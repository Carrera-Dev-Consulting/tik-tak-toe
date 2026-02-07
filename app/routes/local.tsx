import type { Route } from "./+types/home";
import GameComponent from "~/components/pages/game"

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Tik Tak Toe" },
        { name: "description", content: "Simple App to get a session of tik tac toe going" },
    ];
}

export default function Home() {
    return <GameComponent />
}
