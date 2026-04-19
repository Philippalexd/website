import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { ProfileProvider } from "./context/ProfileContext";
import { StravaProvider } from "./context/StravaContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Menu from "./pages/menus/Menu";
import Settings from "./pages/menus/settings/Settings";
import ActivityList from "./pages/activities/ActivityList";
import ActivityCreate from "./pages/activities/CreateActivity";
import ActivityGroups from "./pages/activities/Groups";
import ActivityRankings from "./pages/activities/Rankings";
import ActivityProfile from "./pages/menus/Profile";
import StravaCallback from "./pages/StravaCallback";

function interceptStravaOAuth(): boolean {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const scope = params.get("scope");

  if (code && scope?.includes("activity")) {
    sessionStorage.setItem("strava_oauth_code", code);

    const callbackUrl =
      window.location.origin + window.location.pathname + "#/strava/callback";

    window.location.replace(callbackUrl);
    return true;
  }
  return false;
}

export default function App() {
  const [redirecting] = useState(() => interceptStravaOAuth());

  if (redirecting) return null;

  return (
    <HashRouter>
      <SessionProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* ProtectedRoute */}
          <Route
            element={
              <ProfileProvider>
                <StravaProvider>
                  <ProtectedRoute />
                </StravaProvider>
              </ProfileProvider>
            }
          >
            <Route path="/menu" element={<Menu />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/activities" element={<ActivityList />} />
            <Route path="/activities/create" element={<ActivityCreate />} />
            <Route path="/activities/groups" element={<ActivityGroups />} />
            <Route path="/activities/rankings" element={<ActivityRankings />} />
            <Route path="/activities/profile" element={<ActivityProfile />} />
            <Route path="/strava/callback" element={<StravaCallback />} />
          </Route>
        </Routes>
      </SessionProvider>
    </HashRouter>
  );
}
