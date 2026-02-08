import type { Route } from "./+types/create";
import CreateLobbyComponent from "~/components/pages/lobby/lobby-create";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tik Tak Toe" },
    {
      name: "description",
      content: "Lobby Screen to start a game of tik tac toe...",
    },
  ];
}

export default function Create() {
  return <CreateLobbyComponent />;
}
