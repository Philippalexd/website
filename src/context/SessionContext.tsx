import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { sb } from "../lib/supabaseClient";

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        setSession(session ?? null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN") {
        setSession(session);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setSession(session);
        return;
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        return;
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
