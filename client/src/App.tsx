import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import type { ReactElement } from "react";
import { useAuthStore } from "@/stores/auth";
import { useCineStore } from "@/stores/cines";
import { useCollectionStore } from "@/stores/collections";
import { LoginPage } from "@/pages/LoginPage";
import { HallPage } from "@/pages/HallPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { SpacePage } from "@/pages/SpacePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { PlaybackPage } from "@/pages/PlaybackPage";

function RequireAuth({ children }: { children: ReactElement }) {
  const token = useAuthStore((state) => state.token);
  const loadCines = useCineStore((state) => state.load);
  const loadCollections = useCollectionStore((state) => state.load);
  const clearCollections = useCollectionStore((state) => state.clear);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      void Promise.all([loadCines(), loadCollections()]);
      return;
    }

    clearCollections();
  }, [clearCollections, loadCines, loadCollections, token]);

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
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings/:section"
        element={
          <RequireAuth>
            <SettingsPage />
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
