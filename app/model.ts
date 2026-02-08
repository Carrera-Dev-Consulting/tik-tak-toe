export type Board = (null | PlayerRole)[];

export interface Game {
  id: ID;
  currentPlayer: Player;
}

export interface Player {
  id: ID;
  name: string;
  role: PlayerRole;
}
export enum PlayerRole {
  X = "X",
  O = "O",
}

export interface GameState {
  id?: ID;
  board: Board;
  currentPlayer: PlayerRole;
  winner: string | undefined;
  gameOver: boolean;
}

export type ID = string;
