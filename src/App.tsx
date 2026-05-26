import { Navigate, Route, Routes } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage";
import { HostPage } from "./pages/HostPage";
import { SafeBoardPage } from "./pages/SafeBoardPage";
import { SafeHostPage } from "./pages/SafeHostPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/board" replace />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/host" element={<HostPage />} />
      <Route path="/safe/board" element={<SafeBoardPage />} />
      <Route path="/safe/host" element={<SafeHostPage />} />
    </Routes>
  );
}
