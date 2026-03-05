'use client';

import { WeightEntry } from '@/types';
import { TrendingDown, TrendingUp, Scale, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface Props {
  entries: WeightEntry[];
  target:  number | null;
}

export default function WeightSummary({ entries, target }: Props) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const first  = sorted[0];
  const diff   = latest && first ? latest.weight - first.weight : null;
  const toGoal = latest && target ? latest.weight - target : null;

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)' }} className="rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale size={15} style={{ color: 'var(--muted)' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Tracker de Peso
          </h3>
        </div>
        <Link href="/weight"
          style={{ color: 'var(--pink)', border: '1px solid var(--border)' }}
          className="text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-70 transition-opacity">
          Ver todo
        </Link>
      </div>

      {!latest ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <Scale size={32} style={{ color: 'var(--muted)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin registros en este período</p>
          <Link href="/weight"
            style={{ background: 'var(--pink-bg)', color: 'var(--pink)', border: '1px solid var(--pink-border)' }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity">
            Registrar peso
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div style={{ background: 'var(--btn-inactive)', border: '1px solid var(--border)' }} className="rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Actual</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--pink)' }}>{latest.weight} <span className="text-sm font-normal">kg</span></p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{format(parseISO(latest.date), 'dd MMM', { locale: es })}</p>
            </div>
            <div style={{ background: 'var(--btn-inactive)', border: '1px solid var(--border)' }} className="rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text)' }}>Para meta</p>
              <p className="text-2xl font-bold tabular-nums"
                style={{ color: toGoal === null ? 'var(--muted)' : toGoal <= 0 ? 'var(--green-fg)' : 'var(--pink)' }}>
                {toGoal === null ? '—' : toGoal <= 0 ? 'OK' : `-${toGoal.toFixed(1)}`}
                {toGoal !== null && toGoal > 0 && <span className="text-sm font-normal"> kg</span>}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{target ? `meta: ${target} kg` : 'sin meta'}</p>
            </div>
          </div>

          {diff !== null && (
            <div style={{ background: 'var(--btn-inactive)', border: '1px solid var(--border)' }} className="rounded-xl px-3 py-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Cambio en el período</p>
              <div className="flex items-center gap-1.5">
                {diff < 0
                  ? <TrendingDown size={14} style={{ color: 'var(--green-fg)' }} />
                  : diff > 0
                    ? <TrendingUp size={14} style={{ color: 'var(--red-fg)' }} />
                    : <Minus size={14} style={{ color: 'var(--muted)' }} />}
                <span className="text-sm font-bold tabular-nums"
                  style={{ color: diff < 0 ? 'var(--green-fg)' : diff > 0 ? 'var(--red-fg)' : 'var(--muted)' }}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
