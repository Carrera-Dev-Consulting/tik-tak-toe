import { createContext, type PropsWithChildren } from "react";
import type { TikTakAPI } from "~/api/base";
import { GQLAPI } from "~/api/gql";
import { LocalAPI } from "~/api/local";

export const APIContext = createContext<TikTakAPI>(LocalAPI);

export function LocalProvider({ children }: PropsWithChildren) {
  return <APIContext.Provider value={LocalAPI}>{children}</APIContext.Provider>;
}

export function GQLProvider({ children }: PropsWithChildren) {
  return (
    <APIContext.Provider value={GQLAPI.getInstance()}>
      {children}
    </APIContext.Provider>
  );
}
