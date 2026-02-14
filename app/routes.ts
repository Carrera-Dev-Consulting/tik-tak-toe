import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/lobby/create", "routes/lobby/create.tsx"),
  route("/lobby/play/:gameId", "routes/lobby/play.tsx"),
  route("/lobby/wait/:gameId", "routes/lobby/wait.tsx"),
  route("/lobby/join/", "routes/lobby/join.tsx"),
  route("/play/local", "routes/local.tsx"),
] satisfies RouteConfig;
