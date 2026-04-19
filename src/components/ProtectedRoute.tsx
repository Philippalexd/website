import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import Topbar from "./Topbar";

export default function ProtectedRoute() {
  const { session, loading } = useSession();
  if (loading) {
    return <div>Lädt...</div>;
  } else if (session === null) {
    return <Navigate to="/" replace></Navigate>;
  }
  return (
    <>
      <Topbar />
      <Outlet />
    </>
  );
}
