'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Goal, GoalAction } from '@/types';

const BORDER  = '#fce8ee';
const PALETTE = ['#f9a8d4','#a5b4fc','#86efac','#fca5a5','#fcd34d','#6ee7b7','#c4b5fd','#fdba74'];

interface Props {
  goals:       Goal[];
  goalActions: GoalAction[];
  dateFrom:    string;
  dateTo:      string;
}

export default function GoalsByCategoryChart({ goals, goalActions, dateFrom, dateTo }: Props) {
  const filtered = goalActions.filter((a) =>
    a.action_date &&
    (!dateFrom || a.action_date >= dateFrom) &&
    (!dateTo   || a.action_date <= dateTo)
  );

  const data = goals
    .map((g, i) => ({
      name:  g.title,
      value: filtered.filter((a) => a.goal_id === g.id).length,
      color: PALETTE[i % PALETTE.length],
    }))
    .filter((d) => d.value > 0);

  const total  = filtered.length;
  const buenas = filtered.filter((a) => a.type === 'buena').length;
  const malas  = filtered.filter((a) => a.type === 'mala').length;

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-sm p-5 mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>
        Acciones de objetivos
      </h3>
      <p className="text-xs mb-4" style={{ color: '#E0B8C4' }}>
        {total} accion{total !== 1 ? 'es' : ''} en el período
      </p>

      {data.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value, name]}
                contentStyle={{ border: '1px solid #fce8ee', borderRadius: 12, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#D4A0B0' }} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex gap-3 mt-3">
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span className="text-xs font-semibold" style={{ color: '#065f46' }}>Buenas</span>
              <span className="text-sm font-bold" style={{ color: '#065f46' }}>{buenas}</span>
            </div>
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span className="text-xs font-semibold" style={{ color: '#991b1b' }}>Malas</span>
              <span className="text-sm font-bold" style={{ color: '#991b1b' }}>{malas}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-sm" style={{ color: '#D4A0B0' }}>Sin acciones en este período</p>
        </div>
      )}
    </div>
  );
}
