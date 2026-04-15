import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSession } from "../lib/supabaseClient";
import { useProfile } from "../context/ProfileContext";
import Topbar from "./Topbar";

export default function ProtectedRoute() {
  const { data: session, isPending } = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
  });
  const { profile } = useProfile();

  if (isPending || (session && !profile)) return <div>Laden...</div>;
  if (!session) return <Navigate to="/" replace />;

  return (
    <>
      <Topbar />
      <Outlet />
    </>
  );
}
