'use client';

import { useState } from 'react';
import { Transaction, Goal, GoalAction, ExchangeRate, WeightEntry, DiaryEntry, PeriodEntry, PeriodCycleLength } from '@/types';
import IncomeExpenseChart from './IncomeExpenseChart';
import GoalsByCategoryChart from './GoalsByCategoryChart';
import DiarySummary from './DiarySummary';
import WeightSummary from './WeightSummary';
import PeriodSummary from './PeriodSummary';
import ExportPDFButton from './ExportPDFButton';

const dMonthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
const today       = () => new Date().toISOString().split('T')[0];

interface Props {
  transactions:  Transaction[];
  goals:         Goal[];
  goalActions:   GoalAction[];
  rates:         ExchangeRate[];
  weightEntries: WeightEntry[];
  weightTarget:  number | null;
  diaryEntries:  DiaryEntry[];
  periodEntries: PeriodEntry[];
  cycleLengths:  PeriodCycleLength[];
}

export default function DashboardClient({ transactions, goals, goalActions, rates, weightEntries, weightTarget, diaryEntries, periodEntries, cycleLengths }: Props) {
  const [dateFrom, setDateFrom] = useState(dMonthStart());
  const [dateTo,   setDateTo]   = useState(today());

  const setPreset = (days: number | null | 'mes') => {
    if (days === null) { setDateFrom(''); setDateTo(''); return; }
    if (days === 'mes') { setDateFrom(dMonthStart()); setDateTo(today()); return; }
    const d = new Date(); d.setDate(d.getDate() - days);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(today());
  };

  const filteredTx = transactions.filter((t) =>
    (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo)
  );
  const filteredWt = weightEntries.filter((w) =>
    (!dateFrom || w.date >= dateFrom) && (!dateTo || w.date <= dateTo)
  );

  const PRESETS: { label: string; days: number | null | 'mes' }[] = [
    { label: 'Mes',  days: 'mes' },
    { label: '7d',   days: 7    },
    { label: '30d',  days: 30   },
    { label: '3m',   days: 90   },
    { label: 'Todo', days: null },
  ];

  const isActive = (days: number | null | 'mes') => {
    if (days === null) return !dateFrom && !dateTo;
    if (days === 'mes') return dateFrom === dMonthStart() && dateTo === today();
    const d = new Date(); d.setDate(d.getDate() - days);
    return dateFrom === d.toISOString().split('T')[0] && dateTo === today();
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--pink-bg)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--pink)' }}>
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--pink)' }}>Bienvenida, Debbie</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Tu resumen de vida al día</p>
          </div>
        </div>
        <ExportPDFButton transactions={transactions} goals={goals} goalActions={goalActions} rates={rates} weightEntries={weightEntries} weightTarget={weightTarget} diaryEntries={diaryEntries} periodEntries={periodEntries} cycleLengths={cycleLengths} />
      </div>

      {/* Filtro de fecha */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)' }} className="rounded-2xl p-3 mb-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200" />
            <span className="hidden sm:inline text-xs shrink-0" style={{ color: 'var(--muted)' }}>—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {PRESETS.map(({ label, days }) => (
              <button key={label} onClick={() => setPreset(days)}
                style={{
                  background: isActive(days) ? 'var(--pink-bg)' : 'var(--btn-inactive)',
                  color: 'var(--pink)',
                  border: `1px solid ${isActive(days) ? 'var(--pink-border)' : 'var(--border)'}`,
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <IncomeExpenseChart transactions={filteredTx} dateFrom={dateFrom} dateTo={dateTo} />
        <GoalsByCategoryChart goals={goals} goalActions={goalActions} dateFrom={dateFrom} dateTo={dateTo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <DiarySummary entries={diaryEntries} dateFrom={dateFrom} dateTo={dateTo} />
        <WeightSummary entries={filteredWt} target={weightTarget} />
      </div>

      <div className="mb-5">
        <PeriodSummary periodEntries={periodEntries} cycleLengths={cycleLengths} />
      </div>
    </div>
  );
}
