import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { sb } from "../lib/supabaseClient";
import Topbar from "./Topbar";

export default function ProtectedRoute() {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        setSession(session ?? null);
      } else if (event === "SIGNED_IN") {
        setSession(session);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
      } else if (event === "TOKEN_REFRESHED") {
        setSession(session);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div>Laden...</div>;
  if (session === null) return <Navigate to="/" replace />;

  return (
    <>
      <Topbar />
      <Outlet />
    </>
  );
}
