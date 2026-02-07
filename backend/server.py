from contextlib import asynccontextmanager
from contextvars import ContextVar
from enum import Enum
import json
from logging import getLogger
import os
from typing import Any
import uuid
from bson import ObjectId
from fastapi import FastAPI, Request
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLTransportWSHandler
from ariadne import (
    MutationType,
    SubscriptionType,
    load_schema_from_path,
    make_executable_schema,
    EnumType,
    QueryType,
    InputType,
)
from ariadne.types import GraphQLResolveInfo
from broadcaster import Broadcast, Event
from pydantic import AliasChoices, BaseModel, Field, field_validator
from pydantic_settings import BaseSettings
from pymongo import AsyncMongoClient
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware


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

broadcast = Broadcast(
    settings.redis_url,
)

client: ContextVar[AsyncMongoClient] = ContextVar("client", default=None)


class PlayerRole(str, Enum):
    X = "X"
    O = "O"


class GameStateInput(BaseModel):
    id: str
    index: int


class GameState(BaseModel):
    id: str
    currentPlayer: PlayerRole
    board: list[PlayerRole | None]
    winner: PlayerRole
    gameOver: bool


class Player(BaseModel):
    id: str = Field(
        validation_alias=AliasChoices("id", "_id"),
        default_factory=uuid.uuid4,
    )
    role: PlayerRole
    name: str


class Game(BaseModel):
    id: str = Field(validation_alias=AliasChoices("id", "_id"), alias="_id")
    players: list[Player]
    currentPlayer: PlayerRole = PlayerRole.X
    winner: PlayerRole | None = None
    gameOver: bool = False
    # Default to a 3x3 board
    board: list[PlayerRole | None] = Field(default_factory=lambda: [None] * 9)

    @field_validator("id", mode="before")
    @classmethod
    def validate_id(cls, value: Any):
        return str(value)

    @property
    def is_ready(self):
        values = {role: 0 for role in PlayerRole}

        for player in self.players:
            values[player.role] += 1

        # Must have at least one player of each role
        return all(value > 0 for value in values.values())

    def checkGameOver(self):
        for row in [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ]:
            if self.board[row[0]] == self.board[row[1]] == self.board[row[2]] != None:
                self.winner = self.board[row[0]]
                self.gameOver = True

        if self.board.count(None) == 0:
            self.gameOver = True


query = QueryType()


@query.field("me")
async def get_me(_, info: GraphQLResolveInfo):
    return {
        "id": info.context["user_id"],
    }


@query.field("games")
async def get_games(_, info: GraphQLResolveInfo):
    client: AsyncMongoClient = info.context["mongo"]
    cursors = (
        client.get_database(settings.games_database)
        .get_collection(settings.games_collection)
        .find({})
    )
    return [Game.model_validate(game) async for game in cursors]


@query.field("game")
async def get_single_game(_, info: GraphQLResolveInfo, gameId: str) -> Game | None:
    client: AsyncMongoClient = info.context["mongo"]
    game = (
        await client.get_database(settings.games_database)
        .get_collection(settings.games_collection)
        .find_one({"_id": ObjectId(gameId)})
    )
    if game is None:
        return None

    return Game.model_validate(game)


mutation = MutationType()


@mutation.field("startGame")
async def start_game(_, info: GraphQLResolveInfo, players: list[dict]):
    players_obj = [Player.model_validate(player) for player in players]
    client: AsyncMongoClient = info.context["mongo"]

    ids = {}
    for player in players_obj:
        if player.id in ids:
            return {"errors": ["Player IDs must be unique!"]}
        ids[player.id] = player

    result = (
        await client.get_database(settings.games_database)
        .get_collection(settings.games_collection)
        .insert_one(
            {
                "players": [player.model_dump(mode="json") for player in players_obj],
            }
        )
    )

    game_doc = (
        await client.get_database(settings.games_database)
        .get_collection(settings.games_collection)
        .find_one({"_id": result.inserted_id})
    )

    return {
        "game": Game.model_validate(game_doc),
        "errors": [],
    }


@mutation.field("joinGame")
async def join_game(_, info: GraphQLResolveInfo, gameId: str, player: dict):
    client: AsyncMongoClient = info.context["mongo"]
    player_obj = Player.model_validate(player)

    game: Game = await get_single_game(None, info, gameId)

    if game is None:
        return {"errors": ["Game does not exist!"]}

    if player_obj.id in [
        player.id for player in game.players if player.role == player_obj.role
    ]:
        return {"errors": ["Player already in game!"]}

    # TODO: Consider if we want to allow players to join after game is over in case of reset...
    if game.gameOver or game.winner:
        return {"errors": ["Game is over, cannot join!"]}

    await client.get_database(settings.games_database).get_collection(
        settings.games_collection
    ).update_one(
        {"_id": ObjectId(gameId)},
        {"$addToSet": {"players": player_obj.model_dump(mode="json")}},
    )

    return {
        "game": await get_single_game(None, info, gameId),
        "errors": [],
    }


@mutation.field("applyGameState")
async def apply_game_state(_, info: GraphQLResolveInfo, newState: dict):
    game_state = GameStateInput.model_validate(newState)
    game: Game = await get_single_game(None, info, game_state.id)
    user_id = info.context["user_id"]
    client: AsyncMongoClient = info.context["mongo"]
    player = next(
        (
            player
            for player in game.players
            if player.id == user_id and player.role == game.currentPlayer
        ),
        None,
    )

    if not game.is_ready:
        return {"errors": ["Game is not ready!, Waiting for more players..."]}

    if player is None:
        return {"errors": ["You're not a player in this game!"]}

    if player.role != game.currentPlayer:
        return {"errors": ["It's not your turn!"]}

    if game.winner is not None:
        return {"errors": ["Game is over, no more moves allowed"]}

    if game.gameOver:
        return {"errors": ["Game is over, no more moves allowed"]}

    if game.board[game_state.index] is not None:
        return {"errors": ["Position is already taken!"]}

    game.board[game_state.index] = player.role
    game.currentPlayer = PlayerRole.O if player.role == PlayerRole.X else PlayerRole.X
    game.checkGameOver()

    await client.get_database(settings.games_database).get_collection(
        settings.games_collection
    ).update_one(
        {"_id": ObjectId(game.id)},
        {
            "$set": game.model_dump(
                mode="json",
                exclude={
                    "id",
                    "players",
                },
            )
        },
    )

    await broadcast.publish(
        f"game:{game_state.id}", json.dumps(game.model_dump(mode="json"))
    )

    return {
        "state": game,
        "errors": [],
    }


subscription = SubscriptionType()


@subscription.source("gameUpdates")
async def game_updates(
    _,
    info: GraphQLResolveInfo,
    gameId: str,
):
    game = await get_single_game(None, info, gameId)
    if game is None:
        return

    broadcast: Broadcast = info.context["broadcast"]
    async with broadcast.subscribe(f"game:{gameId}") as subscriber:
        async for event in subscriber:
            event: Event = event
            # Messages will be JSON strings
            yield json.loads(event.message)


@subscription.field("gameUpdates")
def game_updates(message: dict, info: GraphQLResolveInfo, gameId: str):
    # No need to do anything extra yet.
    return message


schema = load_schema_from_path(os.path.join(os.path.dirname(__file__), "schema.gql"))

schema_obj = make_executable_schema(
    schema,
    EnumType("PlayerRole", PlayerRole),
    query,
    subscription,
    mutation,
)


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


async def context_value(request: Request, _):
    if client.get() is None:
        mongo_client = AsyncMongoClient(settings.mongo_url)
        await mongo_client.aconnect()
        client.set(mongo_client)

    mongo_client = client.get()

    user_id = request.session.get("user_id")
    if user_id is None:
        user_id = str(uuid.uuid4())
        request.session["user_id"] = user_id

    return {
        "request": request,
        "broadcast": broadcast,
        "mongo": mongo_client,
        "user_id": user_id,
    }


gql = GraphQL(
    schema_obj,
    context_value=context_value,
    websocket_handler=GraphQLTransportWSHandler(),
)

app.mount("/graphql", gql)

if __name__ == "__main__":
    import uvicorn

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

    uvicorn.run(
        "server:app",
        host=settings.host,
        port=settings.port,
        log_config=logging_config,
        reload=settings.reload,
    )
