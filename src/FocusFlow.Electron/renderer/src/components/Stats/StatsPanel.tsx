import { useState, useEffect } from 'react';
import { pomodoroApi } from '../../services/api';
import type { PomodoroStatsDto } from '../../types';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold text-white">{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

export function StatsPanel() {
  const [stats, setStats] = useState<PomodoroStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    pomodoroApi.getStats()
      .then(setStats)
      .catch(err => setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-base font-semibold text-gray-100 mb-5">Estatísticas</h2>

      {loading && <p className="text-sm text-gray-500">Carregando...</p>}
      {error  && <p className="text-sm text-red-400">{error}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Hoje"
            value={stats.todayFocusSessions}
            sub="sessões de foco"
          />
          <StatCard
            label="Minutos hoje"
            value={stats.todayFocusMinutes}
            sub="min de foco"
          />
          <StatCard
            label="Esta semana"
            value={stats.weekFocusSessions}
            sub="sessões de foco"
          />
          <StatCard
            label="Total"
            value={stats.totalFocusSessions}
            sub="sessões concluídas"
          />
        </div>
      )}
    </div>
  );
}
