import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileContext";
import { StravaProvider } from "./context/StravaContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Login";
import Menu from "./pages/Menu";
import Settings from "./pages/Settings";
import ActivityList from "./pages/activities/ActivityList";
import ActivityCreate from "./pages/activities/CreateActivity";
import ActivityGroups from "./pages/activities/Groups";
import ActivityRankings from "./pages/activities/Rankings";
import ActivityProfile from "./pages/activities/Profile";
import StravaCallback from "./pages/StravaCallback";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const scope = params.get("scope");

    if (code && scope?.includes("activity")) {
      window.history.replaceState(
        {},
        "",
        window.location.pathname + "#/strava/callback",
      );
      sessionStorage.setItem("strava_code", code);
    }

    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <HashRouter>
      <ProfileProvider>
        <StravaProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/strava/callback" element={<StravaCallback />} />

            {/* ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/menu" element={<Menu />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/activities" element={<ActivityList />} />
              <Route path="/activities/create" element={<ActivityCreate />} />
              <Route path="/activities/groups" element={<ActivityGroups />} />
              <Route
                path="/activities/rankings"
                element={<ActivityRankings />}
              />
              <Route path="/activities/profile" element={<ActivityProfile />} />
            </Route>
          </Routes>
        </StravaProvider>
      </ProfileProvider>
    </HashRouter>
  );
}
