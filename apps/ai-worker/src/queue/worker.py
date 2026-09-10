import logging
from pathlib import Path
from uuid import UUID

from azure.core.exceptions import ResourceNotFoundError
from bullmq import Worker
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from src.db.jobs import (
    PersistedChunk,
    ProcessingContext,
    claim_processing_job,
    mark_processing_failed,
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
    def __init__(self, database, storage: AzureBlobStorage, worker_name: str):
        self._database = database
        self._storage = storage
        self._worker_name = worker_name

    async def process(self, job, _token):
        if job.name != DOCUMENT_PROCESSING_JOB_NAME:
            raise ValueError("Unsupported document processing job")

        try:
            input_data = DocumentProcessingJobInput.model_validate(job.data)
        except ValidationError as error:
            raise ValueError("Invalid document processing job payload") from error

        context = await claim_processing_job(
            self._database,
            input_data.processing_job_id,
        )

        if context is None:
            return {"status": "skipped"}

        path: Path | None = None

        try:
            path = await self._storage.download_to_temporary_file(context.blob_name)
            pages = extract_pdf_pages(path)
            extracted_chunks = chunk_pages(pages)

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
            await replace_chunks_and_mark_succeeded(
                self._database,
                context,
                chunks,
            )
            logger.info(
                "Document processing succeeded for job %s on %s",
                context.processing_job_id,
                self._worker_name,
            )

            return {
                "pages": len(pages),
                "chunks": len(chunks),
            }
        except Exception as error:
            await mark_processing_failed(
                self._database,
                context,
                sanitized_error(error),
            )
            logger.exception(
                "Document processing failed for job %s on %s",
                context.processing_job_id,
                self._worker_name,
            )
            raise
        finally:
            if path is not None:
                path.unlink(missing_ok=True)


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
