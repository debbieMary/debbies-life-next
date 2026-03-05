'use client';

import { PeriodEntry, PeriodCycleLength } from '@/types';
import { Droplets, Sparkles, Flower2 } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const BORDER = 'var(--border)';

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
    <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flower2 size={15} style={{ color: '#F9A8D4' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Ciclo Menstrual
          </h3>
        </div>
        <Link href="/period"
          style={{ color: 'var(--pink)', border: `1px solid ${BORDER}` }}
          className="text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-70 transition-opacity">
          Ver todo
        </Link>
      </div>

      {!lastEntry && !cycleDays ? (
        <div className="flex flex-col items-center justify-center py-4 gap-2">
          <Flower2 size={28} style={{ color: '#F9A8D4', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin registros de ciclo</p>
          <Link href="/period"
            style={{ background: 'var(--pink-bg)', color: 'var(--pink)', border: '1px solid var(--pink-border)' }}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity">
            Registrar período
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {/* Próximo período */}
          <div className="rounded-xl px-3 py-3 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: 'var(--pc-lav-bg)', border: '1px solid var(--pc-lav-border)' }}>
            <Flower2 size={40} style={{ position: 'absolute', bottom: -8, right: -8, color: 'var(--pc-lav-border)' }} />
            <Flower2 size={18} style={{ position: 'absolute', top: 4, right: 8, color: 'var(--pc-lav-text)', opacity: 0.5 }} />
            <div className="flex items-center gap-1.5">
              <Droplets size={12} style={{ color: 'var(--pc-lav-text)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--pc-lav-text)' }}>Próximo período</span>
            </div>
            {nextPredicted ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-xl font-bold leading-tight" style={{ color: 'var(--pc-lav-text)' }}>
                  {format(nextPredicted, "d MMM", { locale: es })}
                </p>
                <p className="text-xs" style={{ color: 'var(--pc-lav-text)' }}>{countdown(daysUntilNext)}</p>
              </div>
            ) : (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>—</p>
            )}
          </div>

          {/* Ovulación */}
          <div className="rounded-xl px-3 py-3 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: 'var(--pc-teal-bg)', border: '1px solid var(--pc-teal-border)' }}>
            <Flower2 size={40} style={{ position: 'absolute', bottom: -8, right: -8, color: 'var(--pc-teal-border)' }} />
            <Flower2 size={18} style={{ position: 'absolute', top: 4, right: 8, color: 'var(--pc-teal-text)', opacity: 0.5 }} />
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} style={{ color: 'var(--pc-teal-text)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--pc-teal-text)' }}>Ovulación</span>
            </div>
            {ovulationDay ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-xl font-bold leading-tight" style={{ color: 'var(--pc-teal-text)' }}>
                  {format(ovulationDay, "d MMM", { locale: es })}
                </p>
                <p className="text-xs" style={{ color: 'var(--pc-teal-text)' }}>{countdown(daysUntilOvul)}</p>
              </div>
            ) : (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>—</p>
            )}
          </div>

          {/* Ciclo actual */}
          <div className="rounded-xl px-3 py-3 flex flex-col gap-1 relative overflow-hidden"
            style={{ background: 'var(--pc-peach-bg)', border: '1px solid var(--pc-peach-border)' }}>
            <Flower2 size={40} style={{ position: 'absolute', bottom: -8, right: -8, color: 'var(--pc-peach-border)' }} />
            <Flower2 size={18} style={{ position: 'absolute', top: 4, right: 8, color: 'var(--pc-peach-text)', opacity: 0.4 }} />
            <div className="flex items-center gap-1.5">
              <Flower2 size={12} style={{ color: 'var(--pc-peach-text)' }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--pc-peach-text)' }}>Ciclo actual</span>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-xl font-bold leading-tight" style={{ color: 'var(--pc-peach-text)' }}>
                {cycleDays ? `${cycleDays} días` : '—'}
              </p>
              <p className="text-xs" style={{ color: 'var(--pc-peach-text)' }}>{cycleDays ? 'cada ciclo' : 'sin registrar'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
