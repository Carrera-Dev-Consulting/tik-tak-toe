from contextvars import ContextVar
import json
import os
import uuid

from ariadne import (
    EnumType,
    MutationType,
    QueryType,
    SubscriptionType,
    load_schema_from_path,
    make_executable_schema,
)
from broadcaster import Broadcast, Event
from bson import ObjectId
from fastapi import Request
from graphql import GraphQLResolveInfo
from pymongo import AsyncMongoClient
from ariadne.asgi import GraphQL
from ariadne.asgi.handlers import GraphQLTransportWSHandler

from .models import Game, GameStateInput, Player, PlayerRole
from .config import settings


broadcast = Broadcast(
    settings.redis_url,
)

client: ContextVar[AsyncMongoClient] = ContextVar("client", default=None)

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
async def start_game(_, info: GraphQLResolveInfo, name: str):
    players_obj = [
        Player(
            id=info.context["user_id"],
            name=name,
            role=PlayerRole.X,
        ),
    ]
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
async def join_game(
    _,
    info: GraphQLResolveInfo,
    gameId: str,
    name: str,
    role: PlayerRole,
):
    broadcast: Broadcast = info.context["broadcast"]
    client: AsyncMongoClient = info.context["mongo"]
    player_obj = Player(
        id=info.context["user_id"],
        role=role,
        name=name,
    )

    game: Game = await get_single_game(None, info, gameId)

    if game is None:
        return {"errors": ["Game does not exist!"]}

    if player_obj.id in [player.id for player in game.players]:
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

    updated_game: Game = await get_single_game(None, info, gameId)

    await broadcast.publish(
        f"players:{gameId}",
        json.dumps([player.model_dump(mode="json") for player in updated_game.players]),
    )

    return {
        "game": updated_game,
        "errors": [],
    }


@mutation.field("applyGameState")
async def apply_game_state(_, info: GraphQLResolveInfo, newState: dict):
    game_state = GameStateInput.model_validate(newState)
    game: Game = await get_single_game(None, info, game_state.id)
    user_id = info.context["user_id"]
    client: AsyncMongoClient = info.context["mongo"]
    player = next(
        (player for player in game.players if player.id == user_id),
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


@subscription.source("lobbyUpdate")
async def session_updates(_, info: GraphQLResolveInfo, gameId: str):
    game = await get_single_game(None, info, gameId)
    if game is None:
        return

    broadcast: Broadcast = info.context["broadcast"]
    async with broadcast.subscribe(f"players:{gameId}") as subscriber:
        async for event in subscriber:
            event: Event = event
            yield json.loads(event.message)


@subscription.field("lobbyUpdate")
def session_update(message: list[dict], info: GraphQLResolveInfo, gameId: str):
    return message


schema = load_schema_from_path(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "schema.gql")
)

schema_obj = make_executable_schema(
    schema,
    EnumType("PlayerRole", PlayerRole),
    query,
    subscription,
    mutation,
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
