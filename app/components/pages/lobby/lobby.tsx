import React, { useContext, useEffect, useState } from "react";
import { APIContext } from "~/contexts/api-context";

import BasePage from "../base";
import type { TikTakAPI } from "~/api/base";
import { useNavigate } from "react-router";
import type { Player } from "~/model";

interface LobbyComponentProps {
  gameId: string;
}

export default function LobbyComponent({ gameId }: LobbyComponentProps) {
  const api: TikTakAPI = useContext(APIContext);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const setup = async () => {
        api.subscribeUpdates
    };
    setup();
    return () => {
      // cleanup resources
    };
  }, [gameId]);

  return (
    <BasePage>
      <h2 className="w-fit mx-auto my-5 text-2xl">
        Waiting for Players to Join
      </h2>
    </BasePage>
  );
}
