import type { ID, Game, GameState, Player } from "~/model";
import type { TikTakAPI } from "./base";
import { Observable, Subject } from "rxjs";

const games: Game[] = [];

export const LocalAPI: TikTakAPI = {
  getGame: function (id: ID): Promise<Game | undefined> {
    throw new Error("Function not implemented.");
  },
  startGame: function (name: string): Promise<ID> {
    throw new Error("Function not implemented.");
  },
  joinGame: function (gameId: ID, name: string): Promise<ID> {
    throw new Error("Function not implemented.");
  },
  selectSquare: function (gameId: ID, index: number): Promise<ID> {
    throw new Error("Function not implemented.");
  },
  subscribeUpdates: function (
    id: ID,
    onUpdate: (state: GameState) => void,
    onError: ((error: Error) => void) | undefined = undefined,
  ): () => void {
    throw new Error("Function not implemented.");
  },
  me: function (): Promise<ID> {
    throw new Error("Function not implemented.");
  },
  subscribeChanges: function (
    id: ID,
    onUpdate: (players: Player[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    throw new Error("Function not implemented.");
  },
};
