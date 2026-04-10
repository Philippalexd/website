import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../lib/auth";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    getSession()
      .then((session) => setAuthenticated(!!session))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Laden...</div>;
  if (!authenticated) return <Navigate to="/" replace />;

  return <>{children}</>;
}
