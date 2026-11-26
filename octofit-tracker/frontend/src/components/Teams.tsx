import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot?: string;
  members?: string[];
};

type TeamsResponse = {
  teams: Team[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<TeamsResponse>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      empty={teams.length === 0}
      emptyText="No teams found."
      error={error}
    >
      <ul className="list-group">
        {teams.map((team, index) => (
          <li className="list-group-item" key={`${team.name}-${index}`}>
            <strong>{team.name}</strong>
            {team.mascot && <> - {team.mascot}</>}
            {team.members && team.members.length > 0 && <> ({team.members.length} members)</>}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
