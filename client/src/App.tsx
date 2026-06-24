import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactElement } from "react";
import { useAuthStore } from "@/stores/auth";
import { useCineStore } from "@/stores/cines";
import { LoginPage } from "@/pages/LoginPage";
import { HallPage } from "@/pages/HallPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { SpacePage } from "@/pages/SpacePage";
import { PlaybackPage } from "@/pages/PlaybackPage";

function RequireAuth({ children }: { children: ReactElement }) {
  const token = useAuthStore((state) => state.token);
  const loadCines = useCineStore((state) => state.load);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      loadCines();
    }
  }, [token, loadCines]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/hall"
        element={
          <RequireAuth>
            <HallPage />
          </RequireAuth>
        }
      />
      <Route
        path="/history"
        element={
          <RequireAuth>
            <HistoryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/collection"
        element={
          <RequireAuth>
            <CollectionPage />
          </RequireAuth>
        }
      />
      <Route
        path="/space"
        element={
          <RequireAuth>
            <SpacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/play/:id/:episodeId"
        element={
          <RequireAuth>
            <PlaybackPage />
          </RequireAuth>
        }
      />
      <Route
        path="/play/:id"
        element={
          <RequireAuth>
            <PlaybackPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/hall" replace />} />
    </Routes>
  );
}
