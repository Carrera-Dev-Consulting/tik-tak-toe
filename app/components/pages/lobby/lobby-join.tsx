import React, { useContext, useState } from "react";
import { APIContext } from "~/contexts/api-context";

import BasePage from "../base";
import type { TikTakAPI } from "~/api/base";
import { useNavigate } from "react-router";
import { PlayerRole } from "~/model";

interface JoinLobbyComponentProps {
  gameId?: string;
}

export default function JoinLobbyComponent({ gameId: gameIdProp }: JoinLobbyComponentProps) {
  const api: TikTakAPI = useContext(APIContext);
  const [gameId, setGameId] = useState<string | undefined>(gameIdProp);
  const [name, setName] = useState<string>("Player 2");
  const [role, setRole] = useState<PlayerRole>(PlayerRole.O);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ADD THAT SHIT HERE

  const navigate = useNavigate();

  const onFormSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!gameId) return;

    if (!name) return;
    try {
      setLoading(true);
      await api.joinGame(gameId, name, role);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
      return;
    }

    await navigate(`/lobby/play/${gameId}`, {
      replace: true,
    });
  };

  return (
    <BasePage>
      <h2 className="w-fit mx-auto my-5 text-2xl">Join a Lobby</h2>
      <form
        onSubmit={onFormSubmit}
        className="w-1/2 h-full mx-auto flex flex-col p-5 gap-5 min-w-full border rounded"
      >
        {error && (
          <p className="text-red-500 text-2xl border border-white rounded bg-black p-5 mx-auto">{error}</p>
        )}
        <div className="flex flex-row mx-auto w-fit p-5 gap-3">
          <p className ="my-auto">Game ID</p>
          <input
            className="border rounded p-1 w-auto"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          />
        </div>
        <div className="flex flex-row mx-auto w-fit  p-5 gap-3 ">
          <p className="my-auto">Player Name</p>
          <input
            className="border rounded p-1 w-auto"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-row mx-auto w-fit p-5 gap-3">
          <p className="my-auto">Select Role</p>
          <select
            className=" p-1 w-auto"
            value={role}
            onChange={(e) => setRole(e.target.value as PlayerRole)}
          >
            <option value={PlayerRole.X}>X</option>
            <option value={PlayerRole.O}>O</option>
          </select>
        </div>
        <input
          type="submit"
          value="Join Game"
          disabled={loading || (!gameId || !name)}
          className="p-5 w-fit disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-800 mx-auto border border-black rounded hover:text-white hover:bg-black transition duration-200 hover:cursor-pointer"
        />
      </form>
    </BasePage>
  );
}
