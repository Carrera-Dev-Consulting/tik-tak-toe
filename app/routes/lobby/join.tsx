import { useParams } from "react-router";
import type { Route } from "./+types/create";
import JoinLobbyComponent from "~/components/pages/lobby/lobby-join";
import type { ID } from "~/model";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Tik Tak Toe" },
        {
            name: "description",
            content: "Lobby Screen to join an existing game...",
        },
    ];
}

export default function Join() {
    const { gameId } = useParams();
    return <JoinLobbyComponent gameId={gameId as ID} />;
}
