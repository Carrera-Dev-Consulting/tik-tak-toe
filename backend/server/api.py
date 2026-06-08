from contextlib import asynccontextmanager
from logging import getLogger

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pymongo import AsyncMongoClient

from .config import settings
from .gql import gql, client, broadcast

logger = getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mongo_client = AsyncMongoClient(settings.mongo_url)
    client.set(mongo_client)
    logger.info("Connected to MongoDB")
    await mongo_client.aconnect()
    logger.info("Connected to broadcaster...")
    await broadcast.connect()
    try:
        logger.info("Starting server...")
        yield
    finally:
        logger.info("Shutting down server...")
        logger.info("Disconnecting broadcaster...")
        await broadcast.disconnect()
        logger.info("Disconnecting from MongoDB...")
        await mongo_client.aclose()
        client.set(None)


app = FastAPI(
    lifespan=lifespan,
    debug=True,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=settings.cors_origins,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    max_age=settings.max_session_age,
)

app.mount("/graphql", gql)
