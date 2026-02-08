export type Board = (null | PlayerRole)[];

export interface Game extends GameState {
  players: Player[];
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
  winner: PlayerRole | undefined;
  gameOver: boolean;
}

export type ID = string;
