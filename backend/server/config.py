from enum import Enum
from logging import getLogger
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


logger = getLogger(__name__)


class LogFormatters(str, Enum):
    default = "default"
    json = "json"
    pretty = "pretty"


formatters = {
    LogFormatters.default: "uvicorn.logging.DefaultFormatter",
    LogFormatters.json: "pythonjsonlogger.json.JsonFormatter",
    LogFormatters.pretty: "colorlog.ColoredFormatter",
}
formats = {
    "colorlog.ColoredFormatter": "%(log_color)s%(asctime)s :: %(levelname)s :: %(name)s :: %(funcName)s :: %(lineno)d :: %(message)s"
}


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    mongo_url: str = "mongodb://localhost:27017"

    cors_origins: list = ["*"]
    cors_headers: list = ["*"]
    cors_methods: list = ["*"]

    games_database: str = "games"
    games_collection: str = "tiktaktoe"

    session_secret: str = "super-secret-key-idle"
    max_session_age: int = 14 * 24 * 60 * 60  # 14 days

    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False

    log_formatter: str = "uvicorn.logging.DefaultFormatter"
    log_level: str = "INFO"
    uvicorn_log_level: str = "INFO"

    @property
    def log_format(self) -> str:
        logger.info("Parsing log format: %s", self.log_formatter)
        return formatters.get(
            self.log_formatter,
            "%(asctime)s :: %(levelname)s :: %(name)s :: %(funcName)s :: %(lineno)d :: %(message)s",
        )

    @field_validator(
        "log_level",
        "uvicorn_log_level",
        mode="before",
    )
    @classmethod
    def parse_log_level(cls, value: Any) -> str:
        if isinstance(value, str):
            return value.upper()
        return value

    @field_validator(
        "log_formatter",
        mode="before",
    )
    @classmethod
    def parse_log_formatter(cls, value: Any) -> str:
        logger.info("Parsing log formatter: %s", value)
        return formatters.get(value, value)

    @field_validator(
        "cors_origins",
        "cors_headers",
        "cors_methods",
        mode="before",
    )
    @classmethod
    def parse_string(cls, value: Any) -> str:
        if isinstance(value, str):
            return [v.strip() for v in value.split(",")]

        return value


settings = Settings()
