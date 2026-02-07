import { useEffect, useState, type PropsWithChildren } from "react";
import BasePage from "./base";
import { Modal } from "../modal";

function hasPlayerWon(player: string, board: (null | string)[]) {
    return (
        (board[0] === player && board[1] === player && board[2] === player) ||
        (board[3] === player && board[4] === player && board[5] === player) ||
        (board[6] === player && board[7] === player && board[8] === player) ||
        (board[0] === player && board[3] === player && board[6] === player) ||
        (board[1] === player && board[4] === player && board[7] === player) ||
        (board[2] === player && board[5] === player && board[8] === player) ||
        (board[0] === player && board[4] === player && board[8] === player) ||
        (board[2] === player && board[4] === player && board[6] === player)
    );
}

enum Player {
    X = 'X',
    O = 'O'
}

const PLAYER_MAPPER: Record<Player | string, string | undefined> = {
    [Player.X]: 'Player 1',
    [Player.O]: 'Player 2'
}

const CHECK_IMAGE: Record<string, string | undefined> = {
    [Player.X]: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW1jcndjcjljOWlqZXdnb3FtdzFkN3hvYjhkd3V3M2xnOW1tZGhnMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HCQpU5OTEcNHCmjWvX/giphy.gif',
    [Player.O]: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHVkeTNzM3VrY3E0eDFiY24yNTB3cWhqMXQyaHNkb3VscHQ1dDR1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lPuW5AlR9AeWzSsIqi/giphy.gif',
}

export interface GameState {
    board: (null | Player)[]
    currentPlayer: Player
    winner: string | undefined
    gameOver: boolean
}

export interface GameComponentProps {
    board?: (null | Player)[]
    currentPlayer?: Player
    winner?: Player
    gameOver?: boolean
    identity?: Player

    onReset?: () => void
    onClick?: (gameState: GameState) => void
}

export default function GameComponent(
    {
        board: initialBoardState,
        currentPlayer: initialCurrentPlayer,
        winner: initialWinner,
        gameOver: initialGameOver,
        identity,
        onClick,
        onReset,
    }: GameComponentProps
) {
    const [board, setBoard] = useState<(null | Player)[]>(initialBoardState || Array(9).fill(null));
    const [currentPlayer, setCurrentPlayer] = useState<Player>(initialCurrentPlayer || Player.X);
    const [winner, setWinner] = useState<Player | undefined>(initialWinner || undefined);
    const [gameOver, setGameOver] = useState<boolean>(initialGameOver || false);

    // Rerender if props change....
    useEffect(() => {
        setBoard(initialBoardState || Array(9).fill(null))
        setCurrentPlayer(initialCurrentPlayer || Player.X)
        setWinner(initialWinner || undefined)
        setGameOver(initialGameOver || false)
    }, [initialBoardState, initialCurrentPlayer, initialWinner, initialGameOver, identity])

    const reset = () => {
        let oldBoard = board
        let oldCurrentPlayer = currentPlayer
        let oldWinner = winner
        let oldGameOver = gameOver

        setBoard(Array(9).fill(null))
        setCurrentPlayer(Player.X)
        setWinner(undefined)
        setGameOver(false)

        try {
            onReset?.()
        } catch (e) {
            console.error(e)
            setBoard(oldBoard)
            setCurrentPlayer(oldCurrentPlayer)
            setWinner(oldWinner)
            setGameOver(oldGameOver)
        }
    }

    return <BasePage>
        <h2 className="text-xl font-bold">Tik Tak Toe</h2>
        <h3>Current Player: {PLAYER_MAPPER[currentPlayer]}</h3>
        <button className="font-bold p-4 border w-1/4 m-auto my-5 hover:cursor-pointer hover:bg-gray-500 hover:text-white" onClick={() => {
            reset()
        }}>Reset Board</button>
        <div className="flex flex-row flex-wrap gap-5 w-1/2 m-auto">
            {
                board.map((item, index) => <div key={index} className={(item !== null ? "" : "hover:cursor-pointer hover:bg-red-400") + " " + "bg-slate-400 flex-1  basis-[30%]  aspect-square flex justify-center items-center text-2xl font-bold"} onClick={() => {
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
                    let newGameState: GameState = {
                        board: newBoard,
                        currentPlayer: currentPlayer == Player.X ? Player.O : Player.X,
                        winner: undefined,
                        gameOver: false
                    }
                    setBoard(newGameState.board);
                    if (hasPlayerWon(currentPlayer, newBoard)) {
                        newGameState.winner = currentPlayer;
                        newGameState.gameOver = true;
                        setGameOver(true);
                        setWinner(currentPlayer);
                    }
                    else if (newBoard.every((item) => item !== null)) {
                        newGameState.gameOver = true;
                        newGameState.winner = undefined;
                        setGameOver(true);
                        setWinner(undefined);
                    }
                    setCurrentPlayer(newGameState.currentPlayer);

                    try {
                        onClick?.(
                            newGameState
                        );
                    } catch (e) {
                        console.error(e)
                        setBoard(oldBoard)
                        setCurrentPlayer(oldCurrentPlayer)
                        setWinner(oldWinner)
                        setGameOver(oldGameOver)
                    }

                }}>{CHECK_IMAGE[item || ''] && <img src={CHECK_IMAGE[item || '']} alt={`${item} Check`} />}</div>)
            }
        </div>
        <Modal display={gameOver} onClose={reset}>
            <h2 className="text-2xl font-bold w-fit p-5 m-auto">{winner ? `${PLAYER_MAPPER[winner]} won!` : "Tie!"}</h2>
            {
                winner && <img src={CHECK_IMAGE[winner]} alt="celebration gif" className="m-auto my-5" />
            }
            {
                !winner && <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbTcyZ3pnaW0xOW12a3ZzZzB0OGZpMmJudHhkOWRnMWtpa29hMTB2MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yWwRjPL5XiVoDWCkD4/giphy.gif" alt="draw gif" className="m-auto my-5" />
            }
            <p className="text-xl w-fit m-auto">
                Close this modal to play again!!
            </p>
        </Modal>
    </BasePage>
}