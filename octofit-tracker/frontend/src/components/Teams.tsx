import { CapabilityCard } from './CapabilityCard.js';

function renderTeam(team: Record<string, unknown>) {
  const members = Array.isArray(team.members) ? team.members.length : 0;
  return <>{String(team.name ?? 'Team')} · {String(team.mascot ?? 'No mascot')} · {members} members</>;
}

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    path="/api/teams"
    collection="teams"
    emptyMessage="No teams yet."
    renderItem={renderTeam}
  />;
}
