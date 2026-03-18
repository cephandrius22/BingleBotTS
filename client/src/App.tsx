import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import KarmaRemote from "./pages/KarmaRemote.tsx";
import Leaderboard from "./pages/Leaderboard.tsx";
import DailyLog from "./pages/DailyLog.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/remote" element={<KarmaRemote />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/log" element={<DailyLog />} />
    </Routes>
  );
}
