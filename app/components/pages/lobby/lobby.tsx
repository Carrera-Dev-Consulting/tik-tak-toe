import React, { useContext, useEffect, useMemo, useState } from "react";
import { APIContext } from "~/contexts/api-context";

import BasePage from "../base";
import type { TikTakAPI } from "~/api/base";
import { Link, useNavigate } from "react-router";
import type { Game, Player } from "~/model";
import { PlayerRole } from "~/model";

interface LobbyComponentProps {
  gameId: string;
}


export default function LobbyComponent({ gameId }: LobbyComponentProps) {
  const api: TikTakAPI = useContext(APIContext);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [game, setGame] = useState<Game | undefined>(undefined);
  const navigate = useNavigate();

  const playersByRole = useMemo(() => {
    const obj: Record<PlayerRole, Player[]> = Object.values(PlayerRole).reduce(
      (acc, role) => {
        acc[role] = [];
        return acc
      }, {} as Record<PlayerRole, Player[]>);


    players.forEach((player) => {
      obj[player.role].push(player);
    })
    return obj;
  }, [players]);

  const isReady = useMemo(() => {
    return Object.values(playersByRole).every((players) => players.length > 0)
  }, [playersByRole]);

  useEffect(() => {
    let unsubCallback: () => void;
    const setup = async () => {
      setLoading(true);
      unsubCallback = api.subscribeChanges(
        gameId,
        (players) => {
          setPlayers(players);
        },
        (error) => {
          setError(error.message);
        },
      )
      let game = await api.getGame(gameId)
      setGame(game)
      setPlayers(game?.players || [])
      setLoading(false);
    };

    setup();

    return () => {
      unsubCallback();
    };
  }, [gameId]);

  if (loading) {
    return <BasePage>
      <div className="aspect-square w-1/2 bg-black m-auto rounded-full content-center justify-center">
        <div className="aspect-square animate-spin rounded-full border-r-0 border-l-0 border-b-0 border-white border-[calc(1vw*3)] w-9/10 duration-[3s] mx-auto"></div>
      </div>
    </BasePage>
  }

  if (game === undefined) {
    return <BasePage>
      <h2 className="w-fit mx-auto my-5 text-2xl">
        {error || "Game Not Found"}
      </h2>
      <Link to="/" className="border p-5 w-fit mx-auto hover:bg-gray-400">Go Back Home?</Link>
    </BasePage>
  }

  return (
    <BasePage>
      <h2 className="w-fit mx-auto my-5 text-2xl">
        {isReady ? "Game Ready to Start!!" : "Waiting for players..."}
      </h2>
      <div className="flex flex-row flex-wrap gap-50 border min-h-20 w-1/2 mx-auto mb-5 rounded p-5">
        {
          Object.entries(playersByRole).map(([role, players]) => {
            return (
              <div key={role} className="flex flex-col gap-2">
                <span className="font-bold text-xl mx-auto">{role}</span>
                <div className="flex flex-col gap-2">
                  {players.map((player) => {
                    return (
                      <span key={player.id + player.role} className="text-sm">
                        {player.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        }
      </div>
      <button disabled={!isReady} onClick={async () => {
        await navigate(`/lobby/play/${gameId}`)
      }} className="border disabled:bg-gray-400 disabled:text-gray-100 disabled:cursor-not-allowed  hover:cursor-pointer rounded p-5 w-fit mx-auto hover:bg-black hover:text-white">Start Game</button>
    </BasePage>
  );
}
