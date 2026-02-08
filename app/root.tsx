import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { LocalProvider, GQLProvider } from "~/contexts/api-context";
import "./app.css";
import { getEnvVariableBool } from "./util";
import BasePage from "./components/pages/base";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const useMockAPI = getEnvVariableBool("USE_MOCK_API", false);
  const APIProvider = useMockAPI ? LocalProvider : GQLProvider;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <APIProvider>{children}</APIProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <BasePage>
      <h1 className="text-2xl w-fit mx-auto p-5 font-bold">{message}</h1>
      <img
        src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExODhmdjVnbDk0eGI3YXMwcjI3MWgxdDFna3F1NG5lcXJ1YnQwMjJxZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jPAdK8Nfzzwt2/giphy.gif"
        className="mb-5 w-fit mx-auto"
      ></img>
      <p className="w-fit mx-auto text-xl">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto mx-auto">
          <code>{stack}</code>
        </pre>
      )}
    </BasePage>
  );
}
