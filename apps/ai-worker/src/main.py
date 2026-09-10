import asyncio
import logging
import signal

from src.config import Settings
from src.db.connection import DatabaseConnection
from src.queue.worker import DocumentProcessingWorker, create_worker
from src.storage.azure_blob import AzureBlobStorage


async def run() -> None:
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("azure").setLevel(logging.WARNING)
    logging.getLogger("bullmq").setLevel(logging.WARNING)
    settings = Settings()
    database = DatabaseConnection(settings.database_url)
    connection = await database.connect()
    storage = AzureBlobStorage(settings)
    processor = DocumentProcessingWorker(connection, storage, settings.worker_name)
    worker = create_worker(
        settings.redis_url,
        settings.worker_name,
        settings.worker_concurrency,
        processor.process,
    )
    shutdown_event = asyncio.Event()
    loop = asyncio.get_running_loop()

    for signum in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(signum, shutdown_event.set)

    try:
        await shutdown_event.wait()
    finally:
        await worker.close()
        await storage.close()
        await database.close()


if __name__ == "__main__":
    asyncio.run(run())
