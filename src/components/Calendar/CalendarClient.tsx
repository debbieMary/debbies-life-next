'use client';

import { useState } from 'react';
import { Transaction, Goal, GoalAction, WeightEntry, DiaryEntry, PeriodEntry, PeriodCycleLength } from '@/types';
import { format, parseISO, isSameDay, addDays, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Target, X, TrendingUp, TrendingDown, Scale, ThumbsUp, ThumbsDown, Droplets, Sparkles } from 'lucide-react';
import { MOODS } from '@/components/Diary/DiaryClient';

const PINK   = 'var(--pink)';
const BORDER = 'var(--border)';

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface Props {
  transactions:  Transaction[];
  goals:         Goal[];
  goalActions:   GoalAction[];
  weightEntries: WeightEntry[];
  diaryEntries:  DiaryEntry[];
  periodEntries: PeriodEntry[];
  cycleLengths:  PeriodCycleLength[];
}

export default function CalendarClient({ transactions, goals, goalActions, weightEntries, diaryEntries, periodEntries, cycleLengths }: Props) {
  const today = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);

  // Ovulación estimada
  const latestCycle  = [...cycleLengths].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)).at(-1);
  const latestPeriod = [...periodEntries].sort((a, b) => a.start_date.localeCompare(b.start_date)).at(-1);
  const ovulationDay = latestCycle && latestPeriod
    ? addDays(parseISO(latestPeriod.start_date), latestCycle.cycle_days - 14)
    : null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const isPeriodDay = (date: Date) =>
    periodEntries.some((e) =>
      isWithinInterval(date, { start: parseISO(e.start_date), end: addDays(parseISO(e.start_date), e.duration_days - 1) })
    );

  const isOvulationDay = (date: Date) => ovulationDay ? isSameDay(date, ovulationDay) : false;

  const getEventsForDay = (day: number) => {
    const date  = new Date(year, month, day);
    const txs   = transactions.filter((t) => isSameDay(parseISO(t.date), date));
    const gls   = goals.filter((g) => g.target_date && isSameDay(parseISO(g.target_date), date));
    const acts  = goalActions.filter((a) => a.action_date && isSameDay(parseISO(a.action_date), date));
    const wts   = weightEntries.filter((w) => isSameDay(parseISO(w.date), date));
    const diary = diaryEntries.filter((d) => isSameDay(parseISO(d.date), date));
    const period = isPeriodDay(date);
    const ovul   = isOvulationDay(date);
    return { txs, gls, acts, wts, diary, period, ovul };
  };

  const selEvents = selected ? {
    txs:   transactions.filter((t) => isSameDay(parseISO(t.date), selected)),
    gls:   goals.filter((g) => g.target_date && isSameDay(parseISO(g.target_date), selected)),
    acts:  goalActions.filter((a) => a.action_date && isSameDay(parseISO(a.action_date), selected)),
    wts:   weightEntries.filter((w) => isSameDay(parseISO(w.date), selected)),
    diary: diaryEntries.filter((d) => isSameDay(parseISO(d.date), selected)),
    period: isPeriodDay(selected),
    ovul:   isOvulationDay(selected),
  } : null;

  const hasEvents = selEvents && (
    selEvents.txs.length > 0 ||
    selEvents.gls.length > 0 ||
    selEvents.acts.length > 0 ||
    selEvents.wts.length > 0 ||
    selEvents.diary.length > 0 ||
    selEvents.period ||
    selEvents.ovul
  );

  const fmt = (t: Transaction) =>
    t.currency === 'BOB'
      ? `Bs. ${t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
      : t.amount.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

  const goalTitle = (goalId: string) =>
    goals.find((g) => g.id === goalId)?.title ?? 'Objetivo';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth}
          style={{ border: `1px solid ${BORDER}`, color: PINK }}
          className="p-2 rounded-xl hover:opacity-70 transition-opacity">
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-base font-bold" style={{ color: PINK }}>
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth}
          style={{ border: `1px solid ${BORDER}`, color: PINK }}
          className="p-2 rounded-xl hover:opacity-70 transition-opacity">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ border: `1px solid ${BORDER}` }} className="rounded-2xl overflow-hidden">
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} style={{ background: 'var(--bg)', borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }} className="min-h-[80px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const { txs, gls, acts, wts, diary, period, ovul } = getEventsForDay(day);
            const ingresoCount = txs.filter(t => t.type === 'ingreso').length;
            const gastoCount   = txs.filter(t => t.type === 'gasto').length;
            const diaryMood    = diary.length > 0 ? MOODS.find(m => m.value === diary[0].mood) : null;
            const isToday    = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;

            return (
              <div key={day}
                onClick={() => setSelected(new Date(year, month, day))}
                style={{
                  background: isSelected ? 'var(--pink-bg)' : 'var(--card)',
                  borderRight: `1px solid ${BORDER}`,
                  borderBottom: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                }}
                className="min-h-[56px] sm:min-h-[80px] p-1 sm:p-2 hover:bg-pink-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full"
                    style={{ background: isToday ? PINK : 'transparent', color: isToday ? 'var(--card)' : 'var(--text)' }}>
                    {day}
                  </span>
                  {period && <Droplets size={13} style={{ color: '#F472B6' }} />}
                  {ovul   && <Sparkles size={13} style={{ color: '#2DD4BF' }} />}
                </div>

                {/* Mobile: dots */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {ingresoCount > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#16a34a' }} />}
                  {gastoCount   > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#dc2626' }} />}
                  {wts.length   > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#7c3aed' }} />}
                  {gls.length   > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: PINK }} />}
                  {acts.filter(a => a.type === 'buena').length > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#86efac' }} />}
                  {acts.filter(a => a.type === 'mala').length  > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fca5a5' }} />}
                  {diaryMood && <span className="w-1.5 h-1.5 rounded-full" style={{ background: diaryMood.color }} />}
                </div>

                {/* Desktop: chips */}
                <div className="hidden sm:block space-y-0.5">
                  {(ingresoCount > 0 || gastoCount > 0) && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                      className="text-xs px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1.5">
                      {ingresoCount > 0 && <span className="flex items-center gap-0.5" style={{ color: '#065f46' }}><TrendingUp size={9} />{ingresoCount}</span>}
                      {ingresoCount > 0 && gastoCount > 0 && <span style={{ color: 'var(--muted)' }}>·</span>}
                      {gastoCount   > 0 && <span className="flex items-center gap-0.5" style={{ color: '#991b1b' }}><TrendingDown size={9} />{gastoCount}</span>}
                    </div>
                  )}
                  {wts.length > 0 && (
                    <div style={{ background: '#ede9fe', border: '1px solid #ddd6fe', color: '#6d28d9' }}
                      className="text-xs px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                      <Scale size={9} />{wts[0].weight}kg
                    </div>
                  )}
                  {gls.map((g) => (
                    <div key={g.id} style={{ background: '#fce7f3', border: `1px solid ${BORDER}`, color: PINK }}
                      className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium">
                      <Target size={9} />
                      <span className="truncate">{g.title}</span>
                    </div>
                  ))}
                  {acts.length > 0 && (() => {
                    const good = acts.filter(a => a.type === 'buena').length;
                    const bad  = acts.filter(a => a.type === 'mala').length;
                    return (
                      <div style={{ background: '#fff7f9', border: `1px solid ${BORDER}` }}
                        className="flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded-md font-medium">
                        {good > 0 && <span className="flex items-center gap-0.5" style={{ color: '#065f46' }}><ThumbsUp size={9} />{good}</span>}
                        {good > 0 && bad > 0 && <span style={{ color: 'var(--muted)' }}>·</span>}
                        {bad  > 0 && <span className="flex items-center gap-0.5" style={{ color: '#991b1b' }}><ThumbsDown size={9} />{bad}</span>}
                      </div>
                    );
                  })()}
                  {diaryMood && (
                    <div style={{ background: diaryMood.bg, border: `1px solid ${diaryMood.color}40` }}
                      className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium">
                      <diaryMood.Icon size={9} style={{ color: diaryMood.color }} />
                      <span style={{ color: diaryMood.color }}>{diaryMood.label}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail modal */}
      {selected && hasEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}`, maxHeight: '85vh' }}
            className="rounded-2xl shadow-xl w-full max-w-md flex flex-col"
            onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-base font-bold capitalize" style={{ color: PINK }}>
                {format(selected, "EEEE d 'de' MMMM yyyy", { locale: es })}
              </h3>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--muted)' }} className="hover:opacity-70">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

              {/* Ciclo */}
              {(selEvents!.period || selEvents!.ovul) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Ciclo</p>
                  <div className="space-y-2">
                    {selEvents!.period && (
                      <div style={{ background: '#FFE4EE', border: '1px solid #FFBDD6' }} className="rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <Droplets size={14} style={{ color: '#E8739A' }} />
                        <span className="text-sm font-semibold" style={{ color: '#BE185D' }}>Día de período</span>
                      </div>
                    )}
                    {selEvents!.ovul && (
                      <div style={{ background: '#CCFBF1', border: '1px solid #99F6E4' }} className="rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <Sparkles size={14} style={{ color: '#2DD4BF' }} />
                        <span className="text-sm font-semibold" style={{ color: '#2A9D8F' }}>Día de ovulación</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Diario */}
              {selEvents!.diary.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Diario</p>
                  <div className="space-y-2">
                    {selEvents!.diary.map((d) => {
                      const mood = MOODS.find(m => m.value === d.mood)!;
                      return (
                        <div key={d.id} style={{ background: mood.bg, border: `1px solid ${mood.color}30` }}
                          className="light-card rounded-xl px-3 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <mood.Icon size={14} style={{ color: mood.color }} />
                            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{d.title}</p>
                            <span className="text-xs font-semibold ml-auto" style={{ color: mood.color }}>{mood.label}</span>
                          </div>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-soft)' }}>{d.content}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Peso */}
              {selEvents!.wts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Peso</p>
                  <div className="space-y-2">
                    {selEvents!.wts.map((w) => (
                      <div key={w.id}
                        style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}
                        className="rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <Scale size={14} style={{ color: '#6d28d9' }} />
                        <span className="text-sm font-bold" style={{ color: '#6d28d9' }}>{w.weight} kg</span>
                        {w.notes && <span className="text-xs" style={{ color: '#a78bfa' }}>{w.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Movimientos */}
              {selEvents!.txs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Movimientos ({selEvents!.txs.length})
                  </p>
                  <div className="space-y-2">
                    {selEvents!.txs.map((t) => (
                      <div key={t.id}
                        style={{
                          background: t.type === 'ingreso' ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${t.type === 'ingreso' ? '#bbf7d0' : '#fecaca'}`,
                        }}
                        className="light-card rounded-xl px-3 py-2.5 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {t.type === 'ingreso'
                              ? <TrendingUp size={12} style={{ color: '#065f46' }} />
                              : <TrendingDown size={12} style={{ color: '#991b1b' }} />}
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{t.description}</p>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{t.category}</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums shrink-0"
                          style={{ color: t.type === 'ingreso' ? '#065f46' : '#991b1b' }}>
                          {t.type === 'ingreso' ? '+' : '-'}{fmt(t)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objetivos (fecha meta) */}
              {selEvents!.gls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Objetivos — fecha meta ({selEvents!.gls.length})
                  </p>
                  <div className="space-y-2">
                    {selEvents!.gls.map((g) => (
                      <div key={g.id}
                        style={{ background: '#fdf2f8', border: `1px solid ${BORDER}` }}
                        className="light-card rounded-xl px-3 py-2.5 flex items-center gap-2">
                        <Target size={14} style={{ color: g.completed ? '#16a34a' : PINK }} />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{g.title}</p>
                          {g.completed && <p className="text-xs" style={{ color: '#16a34a' }}>Completado</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones de objetivos */}
              {selEvents!.acts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
                    Acciones de objetivos ({selEvents!.acts.length})
                  </p>
                  <div className="space-y-2">
                    {selEvents!.acts.map((a) => (
                      <div key={a.id}
                        style={{
                          background: a.type === 'buena' ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${a.type === 'buena' ? '#bbf7d0' : '#fecaca'}`,
                        }}
                        className="light-card rounded-xl px-3 py-2.5 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {a.type === 'buena'
                              ? <ThumbsUp size={12} style={{ color: '#16a34a' }} />
                              : <ThumbsDown size={12} style={{ color: '#dc2626' }} />}
                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{a.title}</p>
                          </div>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {goalTitle(a.goal_id)}
                            {a.action_time && ` · ${a.action_time.slice(0, 5)}`}
                          </p>
                        </div>
                        {a.completed && (
                          <span className="text-xs font-semibold shrink-0" style={{ color: '#16a34a' }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
