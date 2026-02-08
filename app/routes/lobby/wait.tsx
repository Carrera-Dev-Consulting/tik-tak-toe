import { useParams, useLocation } from "react-router";
import type { Route } from "./+types/create";
import LobbyComponent from "~/components/pages/lobby/lobby";
import type { ID } from "~/model";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Tik Tak Toe" },
        {
            name: "description",
            content: "Lobby Screen to wait for players...",
        },
    ];
}

export default function Create() {
    const { gameId } = useParams();

    return <LobbyComponent gameId={gameId as ID} />;
}
