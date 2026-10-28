import { CapabilityCard } from './CapabilityCard.js';

const userEmail = 'mona@example.com';

function renderWorkout(workout: Record<string, unknown>) {
  return <><strong>{String(workout.title ?? 'Workout')}</strong> · {String(workout.focus ?? 'general')} · {String(workout.minutes ?? 0)} min · {String(workout.difficulty ?? 'unspecified')}{workout.reason ? ` — ${String(workout.reason)}` : ''}</>;
}

export default function Workouts() {
  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    path={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
    collection="suggestions"
    emptyMessage="No workout suggestions yet."
    renderItem={renderWorkout}
  />;
}
