import { useEffect, useState } from "react";
import BasePage from "./base";
import { Modal } from "../modal";
import { PlayerRole, type GameState } from "~/model";
import { hasGameEnded as calculateWinner } from "~/game";

const PLAYER_MAPPER: Record<PlayerRole | string, string | undefined> = {
    [PlayerRole.X]: "Player 1",
    [PlayerRole.O]: "Player 2",
};

const CHECK_IMAGE: Record<string, string | undefined> = {
    [PlayerRole.X]:
        "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW1jcndjcjljOWlqZXdnb3FtdzFkN3hvYjhkd3V3M2xnOW1tZGhnMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HCQpU5OTEcNHCmjWvX/giphy.gif",
    [PlayerRole.O]:
        "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHVkeTNzM3VrY3E0eDFiY24yNTB3cWhqMXQyaHNkb3VscHQ1dDR1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lPuW5AlR9AeWzSsIqi/giphy.gif",
};

export interface GameComponentProps extends Partial<GameState> {
    identity?: PlayerRole;
    resetDisabled?: boolean;

    onReset?: () => boolean;
    onClick?: (index: number) => Promise<void>;
}

export default function GameComponent({
    board: boardProp,
    currentPlayer: currentPlayerProp,
    winner: winnerProp,
    gameOver: gameOverProp,
    identity,
    resetDisabled = false,
    onClick,
    onReset,
}: GameComponentProps) {
    const [board, setBoard] = useState<(null | PlayerRole)[]>(
        boardProp || Array(9).fill(null),
    );
    const [currentPlayer, setCurrentPlayer] = useState<PlayerRole>(
        currentPlayerProp || PlayerRole.X,
    );
    const [winner, setWinner] = useState<PlayerRole | undefined>(
        winnerProp || undefined,
    );
    const [gameOver, setGameOver] = useState<boolean>(gameOverProp || false);
    const [showModal, setShowModal] = useState<boolean>(false);

    // Rerender if props change....
    useEffect(() => {
        setBoard(boardProp || Array(9).fill(null));
        setCurrentPlayer(currentPlayerProp || PlayerRole.X);
        setWinner(winnerProp || undefined);
        setGameOver(gameOverProp || false);
        setShowModal(false || gameOverProp || false);
    }, [boardProp, currentPlayerProp, winnerProp, gameOverProp, identity]);

    const reset = () => {
        let applyReset: boolean = !resetDisabled;
        if (onReset) {
            applyReset = onReset();
        }

        if (!applyReset) {
            return;
        }

        let oldBoard = board;
        let oldCurrentPlayer = currentPlayer;
        let oldWinner = winner;
        let oldGameOver = gameOver;

        setBoard(Array(9).fill(null));
        setCurrentPlayer(PlayerRole.X);
        setWinner(undefined);
        setShowModal(false);
        setGameOver(false);

        try {
            onReset?.();
        } catch (e) {
            console.error(e);
            setBoard(oldBoard);
            setCurrentPlayer(oldCurrentPlayer);
            setWinner(oldWinner);
            setGameOver(oldGameOver);
        }
    };

    return (
        <BasePage>
            <h2 className="text-xl font-bold">Tik Tak Toe</h2>
            <h3>Current Player: {PLAYER_MAPPER[currentPlayer]}</h3>
            {
                !resetDisabled && <button
                    className="font-bold p-4 border w-1/4 m-auto my-5 hover:cursor-pointer hover:bg-gray-500 hover:text-white"
                    onClick={() => {
                        reset();
                    }}
                >
                    Reset Board
                </button>
            }
            <div className="flex flex-row flex-wrap gap-5 w-1/2 m-auto">
                {board.map((item, index) => (
                    <div
                        key={index}
                        className={
                            (item !== null || identity && identity !== currentPlayer ? "" : "hover:cursor-pointer hover:bg-red-400") +
                            " " +
                            "bg-slate-400 flex-1  basis-[30%]  aspect-square flex justify-center items-center text-2xl font-bold"
                        }
                        onClick={async () => {
                            // Can't double check a board
                            if (item) return;
                            // Check if we have assigned you a specific player and its your turn
                            if (identity && identity !== currentPlayer) return;
                            const newBoard = [...board];
                            newBoard[index] = currentPlayer;
                            let oldBoard = board;
                            let oldCurrentPlayer = currentPlayer;
                            let oldWinner = winner;
                            let oldGameOver = gameOver;

                            setBoard(newBoard);
                            const result = calculateWinner(newBoard);
                            if (result.winner) {
                                setWinner(result.winner);
                                setShowModal(true);
                            }
                            if (result.ended) {
                                setGameOver(result.ended);
                            }
                            setCurrentPlayer(
                                currentPlayer === PlayerRole.X ? PlayerRole.O : PlayerRole.X,
                            );
                            setWinner(result.winner);
                            setGameOver(result.ended);
                            try {
                                onClick && (await onClick?.(index));
                            } catch (e) {
                                console.error(e);
                                setBoard(oldBoard);
                                setCurrentPlayer(oldCurrentPlayer);
                                setWinner(oldWinner);
                                setGameOver(oldGameOver);
                            }
                        }}
                    >
                        {CHECK_IMAGE[item || ""] && (
                            <img src={CHECK_IMAGE[item || ""]} alt={`${item} Check`} />
                        )}
                    </div>
                ))}
            </div>
            <Modal display={showModal} onClose={() => {
                setShowModal(false);
            }}>
                <h2 className="text-2xl font-bold w-fit p-5 m-auto">
                    {winner ? `${PLAYER_MAPPER[winner]} won!` : "Tie!"}
                </h2>
                {winner && (
                    <img
                        src={CHECK_IMAGE[winner]}
                        alt="celebration gif"
                        className="m-auto my-5"
                    />
                )}
                {!winner && (
                    <img
                        src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTcyZ3pnaW0xOW12a3ZzZzB0OGZpMmJudHhkOWRnMWtpa29hMTB2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yWwRjPL5XiVoDWCkD4/giphy.gif"
                        alt="draw gif"
                        className="m-auto my-5"
                    />
                )}
                <p className="text-xl w-fit m-auto">Close this modal to play again!!</p>
            </Modal>
        </BasePage>
    );
}
