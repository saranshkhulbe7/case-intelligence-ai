import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    database_url: str
    redis_url: str
    azure_storage_account_name: str
    azure_storage_container_name: str
    worker_name: str = Field(default_factory=lambda: f"document-worker-{os.getpid()}")
    worker_concurrency: int = Field(default=1, ge=1)
