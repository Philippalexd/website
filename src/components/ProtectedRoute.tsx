import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getSession } from "../lib/supabaseClient";
import { useProfileNull } from "../context/ProfileContext";
import Topbar from "./Topbar";

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { profile } = useProfileNull();

  useEffect(() => {
    getSession()
      .then((session) => setAuthenticated(!!session))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading || (authenticated && !profile)) {
    return <div>Laden...</div>;
  }

  if (!authenticated) return <Navigate to="/" replace />;

  return (
    <>
      <Topbar />
      <Outlet />
    </>
  );
}
