import os
import tempfile
from pathlib import Path

from azure.identity.aio import DefaultAzureCredential
from azure.storage.blob.aio import BlobServiceClient

from src.config import Settings


class AzureBlobStorage:
    def __init__(self, settings: Settings):
        self._credential = DefaultAzureCredential()
        self._service_client = BlobServiceClient(
            account_url=(
                f"https://{settings.azure_storage_account_name}.blob.core.windows.net"
            ),
            credential=self._credential,
        )
        self._container_client = self._service_client.get_container_client(
            settings.azure_storage_container_name,
        )

    async def download_to_temporary_file(self, blob_name: str) -> Path:
        file_descriptor, file_name = tempfile.mkstemp(suffix=".pdf")
        path = Path(file_name)

        try:
            with os.fdopen(file_descriptor, "wb") as output:
                downloader = await self._container_client.download_blob(blob_name)
                async for block in downloader.chunks():
                    output.write(block)

            return path
        except Exception:
            path.unlink(missing_ok=True)
            raise

    async def close(self) -> None:
        await self._service_client.close()
        await self._credential.close()
