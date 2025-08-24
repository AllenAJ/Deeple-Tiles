import { topPerfs } from '@/app/api/leaderboard/store';

export default async function LeaderboardPage() {
  const items: Array<{ account: string; score: number; accuracy: number; song: string; ts: number }> = topPerfs(50);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Rank</th>
              <th className="py-2">Account</th>
              <th className="py-2">Score</th>
              <th className="py-2">Accuracy</th>
              <th className="py-2">Song</th>
              <th className="py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={`${it.account}-${it.ts}`} className="border-b">
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{it.account.slice(0, 6)}...{it.account.slice(-4)}</td>
                <td className="py-2 font-semibold">{it.score}</td>
                <td className="py-2">{Math.round(it.accuracy)}%</td>
                <td className="py-2">{it.song}</td>
                <td className="py-2">{new Date(it.ts).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">No entries yet. Play a game to appear here.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 