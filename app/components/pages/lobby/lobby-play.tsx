import React, { useContext, useEffect, useMemo, useState } from "react";
import { APIContext } from "~/contexts/api-context";

import BasePage from "../base";
import type { TikTakAPI } from "~/api/base";
import { Link, useNavigate } from "react-router";
import type { Game, GameState, ID, Player } from "~/model";
import { PlayerRole } from "~/model";
import GameComponent from "../game";

interface LobbyComponentProps {
    gameId: string;
}


export default function LobbyComponent({ gameId }: LobbyComponentProps) {
    const api: TikTakAPI = useContext(APIContext);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [game, setGame] = useState<Game | undefined>(undefined);
    const [gameState, setGameState] = useState<GameState | undefined>(undefined);
    const [userId, setUserId] = useState<ID | null>(null);
    const role = useMemo(() => {
        let player = game?.players.find((player) => player.id === userId);
        return player?.role
    }, [game, userId]);

    useEffect(() => {
        let unsubCallback: () => void;
        const setup = async () => {
            setLoading(true);
            unsubCallback = api.subscribeUpdates(
                gameId,
                (update) => {
                    setGameState(update);
                },
                (error) => {
                    setError(error.message);
                },
            )
            let game = await api.getGame(gameId);
            setGame(game);
            setGameState(game as GameState);
            const id = await api.me();
            setUserId(id);
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
    if (gameState === undefined) {
        return <BasePage>
            <h2 className="w-fit mx-auto my-5 text-2xl">
                {error || "Game Not Found"}
            </h2>
            <Link to="/" className="border p-5 w-fit mx-auto hover:bg-gray-400">Go Back Home?</Link>
        </BasePage>
    }

    if (role === undefined) {
        return <BasePage>
            <h2 className="w-fit mx-auto my-5 text-2xl">
                {error || "Game Not Found"}
            </h2>
            <Link to="/" className="border p-5 w-fit mx-auto hover:bg-gray-400">Go Back Home?</Link>
        </BasePage>
    }

    return (
        <GameComponent identity={role} {...gameState} players={game?.players} onClick={async (index) => {
            await api.selectSquare(gameId, index);
        }} resetDisabled />
    );
}
