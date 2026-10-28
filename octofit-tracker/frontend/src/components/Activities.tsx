import { CapabilityCard } from './CapabilityCard.js';

function renderActivity(activity: Record<string, unknown>) {
  return <>{String(activity.type ?? 'Activity')} · {String(activity.minutes ?? 0)} min · {String(activity.points ?? 0)} points</>;
}

export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    path="/api/activities"
    collection="activities"
    emptyMessage="No activities yet."
    renderItem={renderActivity}
  />;
}
