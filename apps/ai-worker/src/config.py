import os
from socket import gethostname

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    database_url: str
    redis_url: str
    azure_storage_account_name: str
    azure_storage_container_name: str
    worker_name: str = Field(
        default_factory=lambda: f"document-worker-{gethostname()}-{os.getpid()}"
    )
    worker_concurrency: int = Field(default=1, ge=1)
    worker_lease_seconds: int = Field(default=90, ge=2)
    worker_heartbeat_seconds: int = Field(default=20, ge=1)

    @model_validator(mode="after")
    def validate_worker_lease(self):
        if self.worker_heartbeat_seconds >= self.worker_lease_seconds:
            raise ValueError("worker_heartbeat_seconds must be less than worker_lease_seconds")
        return self
