from .config import settings

logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": settings.log_formatter,
            "fmt": settings.log_format,
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": settings.log_level,
            "propagate": True,
        },
        "uvicorn.error": {
            "handlers": ["default"],
            "level": settings.uvicorn_log_level,
            "propagate": False,
        },
        "uvicorn.access": {
            "handlers": ["default"],
            "level": settings.uvicorn_log_level,
            "propagate": False,
        },
    },
}
