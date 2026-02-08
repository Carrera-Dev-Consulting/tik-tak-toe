import { useParams, useLocation } from "react-router";
import type { Route } from "./+types/create";
import LobbyPlayComponent from "~/components/pages/lobby/lobby-play";
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

    return <LobbyPlayComponent gameId={gameId as ID} />;
}
