from server import settings
from .logger import logging_config

import uvicorn

uvicorn.run(
    "server:app",
    host=settings.host,
    port=settings.port,
    log_config=logging_config,
    reload=settings.reload,
)
