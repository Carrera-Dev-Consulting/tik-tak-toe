from enum import Enum
from typing import Any
import uuid

from pydantic import AliasChoices, BaseModel, Field, field_validator


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
