import React, { useContext, useState } from "react";
import { APIContext } from "~/contexts/api-context";

import BasePage from "../base";
import type { TikTakAPI } from "~/api/base";
import { useNavigate } from "react-router";

export default function LobbyCreateComponent() {
  const api: TikTakAPI = useContext(APIContext);
  const [name, setName] = useState<string>("Player 1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const onFormSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name) return;
    let newGameId = "";
    try {
      setLoading(true);
      newGameId = await api.startGame(name);
      setLoading(false);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(error));
      }
      return;
    }

    await navigate(`/lobby/wait/${newGameId}`, {
      replace: true,
    });
  };

  return (
    <BasePage>
      <h2 className="w-fit mx-auto my-5 text-2xl">Create a Lobby</h2>
      <form
        onSubmit={onFormSubmit}
        className="w-1/2 h-full mx-auto flex flex-col p-5 gap-5 min-w-full"
      >
        {error && (
          <p className="text-red-500 text-2xl border bg-black">{error}</p>
        )}
        <div className="flex flex-row mx-auto w-fit border rounded p-5 gap-3 ">
          <p className="my-auto">Player Name</p>
          <input
            className="border rounded p-1 w-auto"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <input
          type="submit"
          value="Start Game"
          disabled={loading}
          className="p-5 w-fit disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-800 mx-auto border border-black rounded hover:text-white hover:bg-black  transition duration-200 hover:cursor-pointer"
        />
      </form>
    </BasePage>
  );
}
