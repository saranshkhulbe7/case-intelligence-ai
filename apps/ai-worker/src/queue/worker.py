import asyncio
import logging
from pathlib import Path
from uuid import UUID

from azure.core.exceptions import ResourceNotFoundError
from bullmq import Worker
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from src.db.jobs import (
    ActiveProcessingLease,
    PersistedChunk,
    ProcessingContext,
    claim_processing_job,
    mark_processing_failed,
    renew_processing_lease,
    replace_chunks_and_mark_succeeded,
)
from src.ingestion.chunk import chunk_pages
from src.ingestion.extract_pdf import extract_pdf_pages
from src.storage.azure_blob import AzureBlobStorage

DOCUMENT_PROCESSING_QUEUE_NAME = "document-processing"
DOCUMENT_PROCESSING_JOB_NAME = "process-document"

logger = logging.getLogger(__name__)


class DocumentProcessingJobInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    processing_job_id: UUID = Field(alias="processingJobId")


def sanitized_error(error: Exception) -> str:
    if isinstance(error, ResourceNotFoundError):
        return "Document blob was not found"

    if isinstance(error, ValueError):
        return str(error).replace("\n", " ").strip()[:240]

    return "Document processing failed"


class DocumentProcessingWorker:
    def __init__(
        self,
        database,
        storage: AzureBlobStorage,
        worker_name: str,
        lease_seconds: int,
        heartbeat_seconds: int,
    ):
        self._database = database
        self._storage = storage
        self._worker_name = worker_name
        self._lease_seconds = lease_seconds
        self._heartbeat_seconds = heartbeat_seconds

    async def _heartbeat(self, context: ProcessingContext, lease_lost: asyncio.Event):
        while True:
            await asyncio.sleep(self._heartbeat_seconds)

            try:
                renewed = await renew_processing_lease(
                    self._database,
                    context,
                    self._lease_seconds,
                )
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception(
                    "Document processing heartbeat failed for job %s on %s",
                    context.processing_job_id,
                    self._worker_name,
                )
                continue

            if not renewed:
                lease_lost.set()
                logger.warning(
                    "Document processing lease was lost for job %s on %s",
                    context.processing_job_id,
                    self._worker_name,
                )
                return

    async def _stop_heartbeat(self, heartbeat_task: asyncio.Task):
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass

    async def _wait_for_claim(self, processing_job_id: UUID):
        while True:
            claim = await claim_processing_job(
                self._database,
                processing_job_id,
                self._worker_name,
                self._lease_seconds,
            )

            if isinstance(claim, ProcessingContext):
                return claim

            if claim is None:
                return None

            if isinstance(claim, ActiveProcessingLease):
                await asyncio.sleep(
                    min(self._heartbeat_seconds, claim.remaining_seconds),
                )

    async def _process_context(self, context: ProcessingContext):
        lease_lost = asyncio.Event()
        heartbeat_task = asyncio.create_task(self._heartbeat(context, lease_lost))
        path: Path | None = None

        try:
            path = await self._storage.download_to_temporary_file(context.blob_name)
            pages = await asyncio.to_thread(extract_pdf_pages, path)
            extracted_chunks = await asyncio.to_thread(chunk_pages, pages)

            if not extracted_chunks:
                raise ValueError("PDF has no extractable text; OCR-only PDFs are not supported")

            chunks = [
                PersistedChunk(
                    page_number=chunk.page_number,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                )
                for chunk in extracted_chunks
            ]

            if lease_lost.is_set():
                return None

            persisted = await replace_chunks_and_mark_succeeded(
                self._database,
                context,
                chunks,
            )
            if not persisted:
                return None

            logger.info(
                "Document processing succeeded for job %s on %s",
                context.processing_job_id,
                self._worker_name,
            )
            return {
                "pages": len(pages),
                "chunks": len(chunks),
            }
        except asyncio.CancelledError:
            raise
        except Exception as error:
            if lease_lost.is_set():
                return None

            failed = await mark_processing_failed(
                self._database,
                context,
                sanitized_error(error),
            )
            if not failed:
                return None

            logger.exception(
                "Document processing failed for job %s on %s",
                context.processing_job_id,
                self._worker_name,
            )
            raise
        finally:
            if path is not None:
                path.unlink(missing_ok=True)
            await self._stop_heartbeat(heartbeat_task)

    async def process(self, job, _token):
        if job.name != DOCUMENT_PROCESSING_JOB_NAME:
            raise ValueError("Unsupported document processing job")

        try:
            input_data = DocumentProcessingJobInput.model_validate(job.data)
        except ValidationError as error:
            raise ValueError("Invalid document processing job payload") from error

        while True:
            context = await self._wait_for_claim(input_data.processing_job_id)

            if context is None:
                return {"status": "skipped"}

            result = await self._process_context(context)
            if result is not None:
                return result


def create_worker(redis_url: str, worker_name: str, concurrency: int, processor):
    return Worker(
        DOCUMENT_PROCESSING_QUEUE_NAME,
        processor,
        {
            "connection": redis_url,
            "name": worker_name,
            "concurrency": concurrency,
        },
    )
