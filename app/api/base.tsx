import type { Game, GameState, ID, Player, PlayerRole } from "~/model";

export interface TikTakAPI {
  getGame(id: ID): Promise<Game | undefined>;
  me(): Promise<ID>;

  // Actions
  startGame(name: string): Promise<ID>;
  joinGame(gameId: ID, name: string, role: PlayerRole): Promise<ID>;
  selectSquare(gameId: ID, index: number): Promise<ID>;

  // Subs
  subscribeUpdates(
    id: ID,
    onUpdate: (state: GameState) => void,
    onError?: (error: Error) => void,
  ): () => void;

  subscribeChanges(
    id: ID,
    onUpdate: (game: Player[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
