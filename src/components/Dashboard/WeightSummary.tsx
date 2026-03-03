'use client';

import { WeightEntry } from '@/types';
import { TrendingDown, TrendingUp, Scale, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const PINK   = '#7D3050';
const BORDER = '#fce8ee';

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
    <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale size={15} style={{ color: '#D4A0B0' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A0B0' }}>
            Tracker de Peso
          </h3>
        </div>
        <Link href="/weight"
          style={{ color: PINK, border: `1px solid ${BORDER}` }}
          className="text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-70 transition-opacity">
          Ver todo
        </Link>
      </div>

      {!latest ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <Scale size={32} style={{ color: '#D4A0B0', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: '#D4A0B0' }}>Sin registros en este período</p>
          <Link href="/weight"
            style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity">
            Registrar peso
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Peso actual + meta */}
          <div className="grid grid-cols-2 gap-3">
            <div style={{ background: '#fff7f9', border: `1px solid ${BORDER}` }} className="rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>Actual</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: PINK }}>{latest.weight} <span className="text-sm font-normal">kg</span></p>
              <p className="text-xs mt-0.5" style={{ color: '#D4A0B0' }}>{format(parseISO(latest.date), 'dd MMM', { locale: es })}</p>
            </div>
            <div style={{
              background: toGoal === null ? '#fff7f9' : toGoal <= 0 ? '#d1fae5' : '#fce7f3',
              border: `1px solid ${toGoal === null ? BORDER : toGoal <= 0 ? '#6ee7b7' : '#f9a8d4'}`
            }} className="rounded-xl p-3">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>Para meta</p>
              <p className="text-2xl font-bold tabular-nums"
                style={{ color: toGoal === null ? '#D4A0B0' : toGoal <= 0 ? '#065f46' : PINK }}>
                {toGoal === null ? '—' : toGoal <= 0 ? 'OK' : `-${toGoal.toFixed(1)}`}
                {toGoal !== null && toGoal > 0 && <span className="text-sm font-normal"> kg</span>}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#D4A0B0' }}>{target ? `meta: ${target} kg` : 'sin meta'}</p>
            </div>
          </div>

          {/* Diferencia en el período */}
          {diff !== null && (
            <div style={{
              background: diff < 0 ? '#d1fae5' : diff > 0 ? '#fee2e2' : '#fff7f9',
              border: `1px solid ${diff < 0 ? '#6ee7b7' : diff > 0 ? '#fca5a5' : BORDER}`
            }} className="rounded-xl px-3 py-2.5 flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: '#D4A0B0' }}>Cambio en el período</p>
              <div className="flex items-center gap-1.5">
                {diff < 0
                  ? <TrendingDown size={14} style={{ color: '#065f46' }} />
                  : diff > 0
                    ? <TrendingUp size={14} style={{ color: '#991b1b' }} />
                    : <Minus size={14} style={{ color: '#D4A0B0' }} />}
                <span className="text-sm font-bold tabular-nums"
                  style={{ color: diff < 0 ? '#065f46' : diff > 0 ? '#991b1b' : '#D4A0B0' }}>
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
