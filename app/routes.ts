import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/lobby/create", "routes/lobby/create.tsx"),
  route("/play/local", "routes/local.tsx"),
] satisfies RouteConfig;
