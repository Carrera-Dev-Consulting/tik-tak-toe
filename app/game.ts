import { PlayerRole, type Board } from "./model";

const winningPositions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function hasPlayerWon(player: PlayerRole, board: Board) {
  return winningPositions.some((pos) => pos.every((i) => board[i] === player));
}

export interface GameResult {
  ended: boolean;
  winner?: PlayerRole;
}

export function hasGameEnded(board: Board): GameResult {
  if (hasPlayerWon(PlayerRole.X, board)) {
    return { ended: true, winner: PlayerRole.X };
  }
  if (hasPlayerWon(PlayerRole.O, board)) {
    return { ended: true, winner: PlayerRole.O };
  }
  return { ended: board.every(Boolean) };
}
