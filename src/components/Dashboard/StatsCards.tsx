'use client';

import { TrendingUp, TrendingDown, DollarSign, Banknote } from 'lucide-react';
import { Transaction, ExchangeRate, Goal } from '@/types';

const fmtUSD = (n: number) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const fmtBOB = (n: number) =>
  `Bs. ${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  transactions: Transaction[];
  goals:        Goal[];
  currentRate:  ExchangeRate | null;
}

export default function StatsCards({ transactions, goals, currentRate }: Props) {
  const incomeUSD   = transactions.filter(t => t.type === 'ingreso' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const expensesUSD = transactions.filter(t => t.type === 'gasto'   && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);

  const incomeBOB   = transactions.filter(t => t.type === 'ingreso' && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const expensesBOB = transactions.filter(t => t.type === 'gasto'   && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);

  const walletRow = (label: string, val: string, color: string, bg: string, bold = false) => (
    <div key={label} className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className={`text-xs tabular-nums px-2 py-0.5 rounded-lg ${bold ? 'font-bold' : 'font-semibold'}`}
        style={{ color, background: bg }}>
        {val}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)' }} className="rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
          <DollarSign size={12} /> Saldo USD
        </p>
        <div className="space-y-1.5">
          {walletRow('Ingresos', fmtUSD(incomeUSD),   '#065f46', '#d1fae5')}
          {walletRow('Gastos',   fmtUSD(expensesUSD), '#991b1b', '#fee2e2')}
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)' }} className="rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
          <Banknote size={12} /> Saldo BOB
        </p>
        <div className="space-y-1.5">
          {walletRow('Ingresos', fmtBOB(incomeBOB),   '#065f46', '#d1fae5')}
          {walletRow('Gastos',   fmtBOB(expensesBOB), '#991b1b', '#fee2e2')}
        </div>
      </div>
    </div>
  );
}
