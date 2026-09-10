from dataclasses import dataclass
from math import ceil
from uuid import UUID, uuid4

from psycopg_pool import AsyncConnectionPool


@dataclass(frozen=True)
class ProcessingContext:
    processing_job_id: UUID
    document_id: UUID
    blob_name: str
    lease_token: UUID


@dataclass(frozen=True)
class ActiveProcessingLease:
    remaining_seconds: int


@dataclass(frozen=True)
class PersistedChunk:
    page_number: int
    chunk_index: int
    content: str


async def claim_processing_job(
    database: AsyncConnectionPool,
    processing_job_id: UUID,
    worker_name: str,
    lease_seconds: int,
) -> ProcessingContext | ActiveProcessingLease | None:
    lease_token = uuid4()

    async with database.connection() as connection:
        async with connection.transaction():
            async with connection.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT job."status",
                           job."documentId",
                           document."blobName",
                           document."status" AS "documentStatus",
                           job."leaseExpiresAt" > CURRENT_TIMESTAMP AS "leaseActive",
                           EXTRACT(
                               EPOCH FROM (job."leaseExpiresAt" - CURRENT_TIMESTAMP)
                           ) AS "leaseRemainingSeconds"
                    FROM "DocumentProcessingJob" AS job
                    INNER JOIN "Document" AS document ON document."id" = job."documentId"
                    WHERE job."id" = %s
                    FOR UPDATE OF job, document
                    """,
                    (str(processing_job_id),),
                )
                row = await cursor.fetchone()

                if row is None:
                    return None

                job_status = row["status"]
                document_status = row["documentStatus"]

                if job_status in {"SUCCEEDED", "FAILED"}:
                    return None

                if job_status == "RUNNING" and row["leaseActive"]:
                    remaining_seconds = max(
                        1,
                        ceil(float(row["leaseRemainingSeconds"])),
                    )
                    return ActiveProcessingLease(remaining_seconds)

                expected_document_status = (
                    "UPLOADED" if job_status == "PENDING" else "PROCESSING"
                )
                if document_status != expected_document_status:
                    await cursor.execute(
                        """
                        UPDATE "DocumentProcessingJob"
                        SET "status" = 'FAILED',
                            "finishedAt" = CURRENT_TIMESTAMP,
                            "error" = 'Document is not ready for processing',
                            "leaseToken" = NULL,
                            "leaseOwner" = NULL,
                            "leaseExpiresAt" = NULL,
                            "updatedAt" = CURRENT_TIMESTAMP
                        WHERE "id" = %s
                          AND "status" IN ('PENDING', 'RUNNING')
                        """,
                        (str(processing_job_id),),
                    )
                    if document_status not in {"FAILED", "READY"}:
                        await cursor.execute(
                            """
                            UPDATE "Document"
                            SET "status" = 'FAILED',
                                "updatedAt" = CURRENT_TIMESTAMP
                            WHERE "id" = %s
                            """,
                            (str(row["documentId"]),),
                        )
                    return None

                if job_status == "PENDING":
                    await cursor.execute(
                        """
                        UPDATE "Document"
                        SET "status" = 'PROCESSING',
                            "updatedAt" = CURRENT_TIMESTAMP
                        WHERE "id" = %s
                          AND "status" = 'UPLOADED'
                        """,
                        (str(row["documentId"]),),
                    )
                    if cursor.rowcount != 1:
                        return None

                await cursor.execute(
                    """
                    UPDATE "DocumentProcessingJob"
                    SET "status" = 'RUNNING',
                        "attempts" = "attempts" + 1,
                        "startedAt" = CURRENT_TIMESTAMP,
                        "error" = NULL,
                        "leaseToken" = %s,
                        "leaseOwner" = %s,
                        "leaseExpiresAt" = CURRENT_TIMESTAMP + (%s * INTERVAL '1 second'),
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "id" = %s
                      AND "status" IN ('PENDING', 'RUNNING')
                    """,
                    (
                        str(lease_token),
                        worker_name,
                        lease_seconds,
                        str(processing_job_id),
                    ),
                )
                if cursor.rowcount != 1:
                    return None

                return ProcessingContext(
                    processing_job_id=processing_job_id,
                    document_id=UUID(str(row["documentId"])),
                    blob_name=str(row["blobName"]),
                    lease_token=lease_token,
                )


async def renew_processing_lease(
    database: AsyncConnectionPool,
    context: ProcessingContext,
    lease_seconds: int,
) -> bool:
    async with database.connection() as connection:
        async with connection.cursor() as cursor:
            await cursor.execute(
                """
                UPDATE "DocumentProcessingJob"
                SET "leaseExpiresAt" = CURRENT_TIMESTAMP + (%s * INTERVAL '1 second'),
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE "id" = %s
                  AND "status" = 'RUNNING'
                  AND "leaseToken" = %s
                  AND "leaseExpiresAt" > CURRENT_TIMESTAMP
                RETURNING "id"
                """,
                (
                    lease_seconds,
                    str(context.processing_job_id),
                    str(context.lease_token),
                ),
            )
            return await cursor.fetchone() is not None


async def replace_chunks_and_mark_succeeded(
    database: AsyncConnectionPool,
    context: ProcessingContext,
    chunks: list[PersistedChunk],
) -> bool:
    async with database.connection() as connection:
        async with connection.transaction():
            async with connection.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT "id"
                    FROM "DocumentProcessingJob"
                    WHERE "id" = %s
                      AND "status" = 'RUNNING'
                      AND "leaseToken" = %s
                      AND "leaseExpiresAt" > CURRENT_TIMESTAMP
                    FOR UPDATE
                    """,
                    (str(context.processing_job_id), str(context.lease_token)),
                )
                if await cursor.fetchone() is None:
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
                        "error" = NULL,
                        "leaseToken" = NULL,
                        "leaseOwner" = NULL,
                        "leaseExpiresAt" = NULL,
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "id" = %s
                      AND "status" = 'RUNNING'
                      AND "leaseToken" = %s
                    """,
                    (str(context.processing_job_id), str(context.lease_token)),
                )
                return cursor.rowcount == 1


async def mark_processing_failed(
    database: AsyncConnectionPool,
    context: ProcessingContext,
    error: str,
) -> bool:
    async with database.connection() as connection:
        async with connection.transaction():
            async with connection.cursor() as cursor:
                await cursor.execute(
                    """
                    SELECT "id"
                    FROM "DocumentProcessingJob"
                    WHERE "id" = %s
                      AND "status" = 'RUNNING'
                      AND "leaseToken" = %s
                      AND "leaseExpiresAt" > CURRENT_TIMESTAMP
                    FOR UPDATE
                    """,
                    (str(context.processing_job_id), str(context.lease_token)),
                )
                if await cursor.fetchone() is None:
                    return False

                await cursor.execute(
                    """
                    UPDATE "DocumentProcessingJob"
                    SET "status" = 'FAILED',
                        "finishedAt" = CURRENT_TIMESTAMP,
                        "error" = %s,
                        "leaseToken" = NULL,
                        "leaseOwner" = NULL,
                        "leaseExpiresAt" = NULL,
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "id" = %s
                      AND "status" = 'RUNNING'
                      AND "leaseToken" = %s
                    """,
                    (
                        error[:240],
                        str(context.processing_job_id),
                        str(context.lease_token),
                    ),
                )
                if cursor.rowcount != 1:
                    return False

                await cursor.execute(
                    """
                    UPDATE "Document"
                    SET "status" = 'FAILED',
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "id" = %s
                      AND "status" = 'PROCESSING'
                    """,
                    (str(context.document_id),),
                )
                return True
