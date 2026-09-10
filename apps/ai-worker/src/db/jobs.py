from dataclasses import dataclass
from uuid import UUID

from psycopg import AsyncConnection


@dataclass(frozen=True)
class ProcessingContext:
    processing_job_id: UUID
    document_id: UUID
    blob_name: str


@dataclass(frozen=True)
class PersistedChunk:
    page_number: int
    chunk_index: int
    content: str


async def claim_processing_job(
    connection: AsyncConnection,
    processing_job_id: UUID,
) -> ProcessingContext | None:
    async with connection.transaction():
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                SELECT job."status", job."documentId", document."blobName"
                FROM "DocumentProcessingJob" AS job
                INNER JOIN "Document" AS document ON document."id" = job."documentId"
                WHERE job."id" = %s
                FOR UPDATE
                """,
                (str(processing_job_id),),
            )
            row = await cursor.fetchone()

            if row is None or row["status"] != "PENDING":
                return None

            await cursor.execute(
                """
                UPDATE "DocumentProcessingJob"
                SET "status" = 'RUNNING',
                    "attempts" = "attempts" + 1,
                    "startedAt" = CURRENT_TIMESTAMP,
                    "error" = NULL
                WHERE "id" = %s AND "status" = 'PENDING'
                """,
                (str(processing_job_id),),
            )

            if cursor.rowcount != 1:
                return None

            await cursor.execute(
                """
                UPDATE "Document"
                SET "status" = 'PROCESSING'
                WHERE "id" = %s AND "status" = 'UPLOADED'
                """,
                (str(row["documentId"]),),
            )

            return ProcessingContext(
                processing_job_id=processing_job_id,
                document_id=UUID(str(row["documentId"])),
                blob_name=str(row["blobName"]),
            )


async def replace_chunks_and_mark_succeeded(
    connection: AsyncConnection,
    context: ProcessingContext,
    chunks: list[PersistedChunk],
) -> bool:
    async with connection.transaction():
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                SELECT "status"
                FROM "DocumentProcessingJob"
                WHERE "id" = %s
                FOR UPDATE
                """,
                (str(context.processing_job_id),),
            )
            row = await cursor.fetchone()

            if row is None or row["status"] != "RUNNING":
                return False

            await cursor.execute(
                'DELETE FROM "DocumentChunk" WHERE "documentId" = %s',
                (str(context.document_id),),
            )
            await cursor.executemany(
                """
                INSERT INTO "DocumentChunk" (
                    "id",
                    "documentId",
                    "pageNumber",
                    "chunkIndex",
                    "content"
                )
                VALUES (gen_random_uuid(), %s, %s, %s, %s)
                """,
                [
                    (
                        str(context.document_id),
                        chunk.page_number,
                        chunk.chunk_index,
                        chunk.content,
                    )
                    for chunk in chunks
                ],
            )
            await cursor.execute(
                """
                UPDATE "DocumentProcessingJob"
                SET "status" = 'SUCCEEDED',
                    "finishedAt" = CURRENT_TIMESTAMP,
                    "error" = NULL
                WHERE "id" = %s
                """,
                (str(context.processing_job_id),),
            )

            return True


async def mark_processing_failed(
    connection: AsyncConnection,
    context: ProcessingContext,
    error: str,
) -> None:
    async with connection.transaction():
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                SELECT "status"
                FROM "DocumentProcessingJob"
                WHERE "id" = %s
                FOR UPDATE
                """,
                (str(context.processing_job_id),),
            )
            row = await cursor.fetchone()

            if row is None or row["status"] != "RUNNING":
                return

            await cursor.execute(
                """
                UPDATE "DocumentProcessingJob"
                SET "status" = 'FAILED',
                    "finishedAt" = CURRENT_TIMESTAMP,
                    "error" = %s
                WHERE "id" = %s
                """,
                (error[:240], str(context.processing_job_id)),
            )
            await cursor.execute(
                """
                UPDATE "Document"
                SET "status" = 'FAILED'
                WHERE "id" = %s
                """,
                (str(context.document_id),),
            )
