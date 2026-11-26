import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = {
  title: string;
  reason: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
};

type WorkoutsResponse = {
  suggestions: Workout[];
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<WorkoutsResponse>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      empty={suggestions.length === 0}
      emptyText="No workout suggestions found."
      error={error}
    >
      <ul className="list-group">
        {suggestions.map((workout, index) => (
          <li className="list-group-item" key={`${workout.title}-${index}`}>
            <strong>{workout.title}</strong>
            <span className="d-block">{workout.reason}</span>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
