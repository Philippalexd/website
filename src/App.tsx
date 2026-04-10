import { HashRouter, Routes, Route } from "react-router-dom";
import { ProfileProvider } from "./context/ProfileContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Settings from "./pages/Settings";
import ActivityList from "./pages/activities/ActivityList";
import ActivityCreate from "./pages/activities/CreateActivity";
import ActivityGroups from "./pages/activities/Groups";
import ActivityRankings from "./pages/activities/Rankings";
import ActivityProfile from "./pages/activities/Profile";

export default function App() {
  return (
    <HashRouter>
      <ProfileProvider>
        <Routes>
          {/* Öffentlich */}
          <Route path="/" element={<Index />} />

          {/* Geschützt */}
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <Menu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <ActivityList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/create"
            element={
              <ProtectedRoute>
                <ActivityCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/groups"
            element={
              <ProtectedRoute>
                <ActivityGroups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/rankings"
            element={
              <ProtectedRoute>
                <ActivityRankings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/profile"
            element={
              <ProtectedRoute>
                <ActivityProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ProfileProvider>
    </HashRouter>
  );
}
