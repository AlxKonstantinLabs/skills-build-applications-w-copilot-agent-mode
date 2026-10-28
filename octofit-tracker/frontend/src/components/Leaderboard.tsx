import { CapabilityCard } from './CapabilityCard.js';

function renderLeaderboardEntry(entry: Record<string, unknown>) {
  return <>#{String(entry.rank ?? '')} {String(entry.teamName ?? 'Team')} · {String(entry.totalPoints ?? 0)} points</>;
}

export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    path="/api/leaderboard"
    collection="leaderboard"
    emptyMessage="No leaderboard rankings yet."
    renderItem={renderLeaderboardEntry}
  />;
}
