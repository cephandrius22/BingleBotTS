import { Link } from "react-router-dom";

const pages = [
  {
    to: "/remote",
    label: "Karma Remote",
    description: "Give and take karma from cats",
    emoji: "⚡",
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    description: "Current cat karma standings",
    emoji: "🏆",
  },
  {
    to: "/log",
    label: "Daily Log",
    description: "Historical daily snapshots",
    emoji: "📅",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">Binglebot</h1>
      <p className="text-gray-400 mb-12 text-sm">Cat karma tracker</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {pages.map(({ to, label, description, emoji }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col gap-2 rounded-2xl border border-gray-800 bg-gray-900 p-6 hover:border-gray-600 hover:bg-gray-800 transition-colors"
          >
            <span className="text-3xl">{emoji}</span>
            <span className="font-semibold text-lg">{label}</span>
            <span className="text-sm text-gray-400">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
