'use client';

import { PeriodEntry, PeriodCycleLength } from '@/types';
import { Droplets, Sparkles, Flower2 } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const BORDER = '#fce8ee';

interface Props {
  periodEntries: PeriodEntry[];
  cycleLengths:  PeriodCycleLength[];
}

export default function PeriodSummary({ periodEntries, cycleLengths }: Props) {
  const sortedCycles  = [...cycleLengths].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const currentCycle  = sortedCycles[sortedCycles.length - 1];
  const cycleDays     = currentCycle?.cycle_days ?? null;

  const sortedEntries = [...periodEntries].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lastEntry     = sortedEntries[sortedEntries.length - 1];

  const nextPredicted  = lastEntry && cycleDays ? addDays(parseISO(lastEntry.start_date), cycleDays) : null;
  const daysUntilNext  = nextPredicted ? differenceInDays(nextPredicted, new Date()) : null;
  const ovulationDay   = lastEntry && cycleDays ? addDays(parseISO(lastEntry.start_date), cycleDays - 14) : null;
  const daysUntilOvul  = ovulationDay ? differenceInDays(ovulationDay, new Date()) : null;

  const isPast  = daysUntilNext !== null && daysUntilNext < 0;
  const isAlert = daysUntilNext !== null && daysUntilNext <= 3 && !isPast;

  const countdown = (d: number | null) => {
    if (d === null) return null;
    if (d < 0)   return `hace ${Math.abs(d)} días`;
    if (d === 0) return 'hoy';
    return `en ${d} días`;
  };

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flower2 size={15} style={{ color: '#F9A8D4' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A0B0' }}>
            Ciclo Menstrual
          </h3>
        </div>
        <Link href="/period"
          style={{ color: '#BE185D', border: `1px solid ${BORDER}` }}
          className="text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-70 transition-opacity">
          Ver todo
        </Link>
      </div>

      {!lastEntry && !cycleDays ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <Flower2 size={28} style={{ color: '#F9A8D4', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: '#D4A0B0' }}>Sin registros de ciclo</p>
          <Link href="/period"
            style={{ background: '#FFE4EE', color: '#BE185D', border: '1px solid #FFBDD6' }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity">
            Registrar período
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {/* Próximo período */}
          <div className="rounded-xl px-3 py-3 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <Flower2 size={40} style={{ position: 'absolute', bottom: -8, right: -8, color: '#DDD6FE' }} />
            <Flower2 size={18} style={{ position: 'absolute', top: 4, right: 8, color: '#C4B5FD', opacity: 0.5 }} />
            <div className="flex items-center gap-1.5">
              <Droplets size={12} style={{ color: '#C4B5FD' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C4B5FD' }}>Próximo período</span>
            </div>
            {nextPredicted ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-xl font-bold leading-tight" style={{ color: isPast ? '#9F1239' : isAlert ? '#DB2777' : '#A78BFA' }}>
                  {format(nextPredicted, "d MMM", { locale: es })}
                </p>
                <p className="text-xs" style={{ color: '#7C3AED' }}>{countdown(daysUntilNext)}</p>
              </div>
            ) : (
              <p className="text-xs mt-1" style={{ color: '#D4A0B0' }}>—</p>
            )}
          </div>

          {/* Ovulación */}
          <div className="rounded-xl px-3 py-3 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: '#CCFBF1', border: '1px solid #99F6E4' }}>
            <Flower2 size={40} style={{ position: 'absolute', bottom: -8, right: -8, color: '#99F6E4' }} />
            <Flower2 size={18} style={{ position: 'absolute', top: 4, right: 8, color: '#2DD4BF', opacity: 0.5 }} />
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} style={{ color: '#2DD4BF' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#2DD4BF' }}>Ovulación</span>
            </div>
            {ovulationDay ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-xl font-bold leading-tight" style={{ color: '#2A9D8F' }}>
                  {format(ovulationDay, "d MMM", { locale: es })}
                </p>
                <p className="text-xs" style={{ color: '#0F766E' }}>{countdown(daysUntilOvul)}</p>
              </div>
            ) : (
              <p className="text-xs mt-1" style={{ color: '#D4A0B0' }}>—</p>
            )}
          </div>

          {/* Ciclo actual */}
          <div className="rounded-xl px-3 py-3 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
            <Flower2 size={40} style={{ position: 'absolute', bottom: -8, right: -8, color: '#FDE68A' }} />
            <Flower2 size={18} style={{ position: 'absolute', top: 4, right: 8, color: '#A16207', opacity: 0.4 }} />
            <div className="flex items-center gap-1.5">
              <Flower2 size={12} style={{ color: '#A16207' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A16207' }}>Ciclo actual</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-xl font-bold leading-tight" style={{ color: '#A16207' }}>
                {cycleDays ? `${cycleDays} días` : '—'}
              </p>
              <p className="text-xs" style={{ color: '#92400E' }}>{cycleDays ? 'cada ciclo' : 'sin registrar'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
