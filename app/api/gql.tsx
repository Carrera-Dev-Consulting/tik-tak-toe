import type { Game, GameState, ID, Player, PlayerRole } from "~/model";
import type { TikTakAPI } from "./base";
import {
  ApolloClient,
  HttpLink,
  ApolloLink,
  InMemoryCache,
  gql,
  type DocumentNode,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { getEnvVariable } from "~/util";
import { createClient } from "graphql-ws";
import type { FetchPolicy } from "@apollo/client";

const GET_GAME = gql`
  query Game($gameId: ID!) {
    game(gameId: $gameId) {
      id
      currentPlayer
      players {
        id
        role
        name
      }
      winner
      gameOver
      board
    }
  }
`;

const START_GAME = gql`
  mutation NewGame($name: String!) {
    startGame(name: $name) {
      errors
      game {
        id
      }
    }
  }
`;

const JOIN_GAME = gql`
  mutation JoinGame($gameId: ID!, $name: String!, $role: PlayerRole!) {
    joinGame(gameId: $gameId, name: $name, role: $role) {
      errors
      game {
        id
        players
      }
    }
  }
`;

const SELECT_SQUARE = gql`
  mutation PlaceMark($gameId: ID!, $index: Int!) {
    applyGameState(newState: { id: $gameId, index: $index }) {
      errors
      state {
        id
      }
    }
  }
`;

const SUBSCRIBE_GAME = gql`
  subscription SubscribeToUpdates($gameId: ID!) {
    gameUpdates(gameId: $gameId) {
      id
      currentPlayer
      board
      winner
      gameOver
    }
  }
`;

const ME = gql`
  query Me {
    me {
      id
    }
  }
`;

const SUBSCRIBE_LOBBY = gql`
  subscription SubscribeToUpdates($gameId: ID!) {
    lobbyUpdate(gameId: $gameId) {
      id
      role
      name
    }
  }
`;

interface GameResponse {
  game?: Game;
}

interface GameReference {
  id: ID;
}
interface MutationResponse {
  game?: GameReference;
  errors: string[];
}

interface StartGameMutationResponse {
  startGame: MutationResponse;
}

interface JoinGameMutationResponse {
  joinGame: MutationResponse;
}

interface GameStateResponse {
  state?: GameReference;
  errors: string[];
}

interface ApplyGameStateResponse {
  applyGameState: GameStateResponse;
}

interface GameStateSubscription {
  gameUpdates: GameState;
}

interface LobbyUpdateSubscription {
  lobbyUpdate: Player[];
}

interface MeResponse {
  me: {
    id: ID;
  };
}

export class GQLAPI implements TikTakAPI {
  private apollo: ApolloClient;
  private static instance: GQLAPI | undefined;

  private constructor() {
    const httpAPIHost = getEnvVariable("GQL_API_URL", "/graphql");
    const httpLink = new HttpLink({
      uri: httpAPIHost as string,
      credentials: "include",
    });

    const wsAPIHost = getEnvVariable("GQL_WS_URL", "/graphql");

    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsAPIHost as string,
      }),
    );

    const link = ApolloLink.split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink,
    );

    this.apollo = new ApolloClient({
      link: link,
      cache: new InMemoryCache(),
    });
  }

  static getInstance() {
    if (GQLAPI.instance === undefined) {
      GQLAPI.instance = new GQLAPI();
    }
    return GQLAPI.instance;
  }

  async queryClient<T>(
    query: DocumentNode,
    variables: Record<string, any>,
    fetchPolicy: FetchPolicy | undefined = 'cache-first',
  ): Promise<T> {
    const { data, error } = await this.apollo.query<T>({
      query,
      variables,
      fetchPolicy: fetchPolicy
    });

    if (error) {
      throw error;
    }

    if (data === undefined) {
      throw new Error("Unable to process GQL Request");
    }
    return data;
  }

  async mutateClient<T>(
    query: DocumentNode,
    variables: Record<string, any>,
  ): Promise<T> {
    const { data, error } = await this.apollo.mutate<T>({
      mutation: query,
      variables,
    });

    if (error) {
      throw error;
    }

    if (data === undefined) {
      throw new Error("Unable to process GQL Request");
    }
    return data;
  }

  async me(): Promise<ID> {
    const { me } = await this.queryClient<MeResponse>(ME, {}, 'no-cache');
    return me.id;
  }
  async getGame(id: ID): Promise<Game | undefined> {
    const { game } = await this.queryClient<GameResponse>(GET_GAME, {
      gameId: id,
    }, 'cache-first');

    return game;
  }

  async startGame(name: string): Promise<ID> {
    const {
      startGame: { errors, game },
    } = await this.mutateClient<StartGameMutationResponse>(START_GAME, {
      name,
    });
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    if (!game) {
      throw new Error("GQL API Error");
    }

    return game.id;
  }

  async joinGame(gameId: ID, name: string, role: PlayerRole): Promise<ID> {
    const {
      joinGame: { game, errors },
    } = await this.mutateClient<JoinGameMutationResponse>(JOIN_GAME, {
      gameId,
      name,
      role,
    });

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
    if (game === undefined) {
      throw new Error("GraphQL Error");
    }

    return game.id;
  }

  async selectSquare(gameId: ID, index: number): Promise<ID> {
    const {
      applyGameState: { state, errors },
    } = await this.mutateClient<ApplyGameStateResponse>(SELECT_SQUARE, {
      gameId,
      index,
    });

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    if (state === undefined) {
      throw new Error("GQL Implementation Error");
    }

    return state.id;
  }

  subscribeUpdates(
    id: ID,
    onUpdate: (state: GameState) => void,
    onError: ((error: Error) => void) | undefined = undefined,
  ): () => void {
    const obs = this.apollo.subscribe<GameStateSubscription>({
      query: SUBSCRIBE_GAME,
      variables: { gameId: id },
    });

    const sub = obs.subscribe(({ data, error }) => {
      if (error) {
        return onError?.(error);
      }

      if (data === undefined) {
        return onError?.(new Error("GQL Subscription Error"));
      }

      const { gameUpdates: newState } = data;
      onUpdate(newState);
    });

    return () => {
      sub.unsubscribe();
    };
  }

  subscribeChanges(
    id: ID,
    onUpdate: (players: Player[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    const obs = this.apollo.subscribe<LobbyUpdateSubscription>({
      query: SUBSCRIBE_LOBBY,
      variables: { gameId: id },
    });

    const sub = obs.subscribe(({ data, error }) => {
      if (error) {
        return onError?.(error);
      }

      if (data === undefined) {
        return onError?.(new Error("GQL Subscription Error"));
      }

      const { lobbyUpdate } = data;
      onUpdate(lobbyUpdate);
    });

    return () => {
      sub.unsubscribe();
    };
  }
}
