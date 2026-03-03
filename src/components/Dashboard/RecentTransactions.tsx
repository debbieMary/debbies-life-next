'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const fmtUSD = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const fmtBOB = (n: number) =>
    `Bs. ${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmt = (t: Transaction) => t.currency === 'BOB' ? fmtBOB(t.amount) : fmtUSD(t.amount);

  return (
    <div style={{ background: '#fff', border: '1px solid #fce8ee' }} className="rounded-2xl shadow-sm p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#D4A0B0' }}>
        Movimientos recientes
      </h3>

      {recent.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: '#D4A0B0' }}>Sin movimientos aún</p>
      ) : (
        <div className="space-y-3">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: t.type === 'ingreso' ? '#d1fae5' : '#fee2e2' }}>
                  {t.type === 'ingreso'
                    ? <TrendingUp size={14} style={{ color: '#065f46' }} />
                    : <TrendingDown size={14} style={{ color: '#991b1b' }} />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2a1520' }}>{t.description}</p>
                  <p className="text-xs" style={{ color: '#D4A0B0' }}>
                    {t.category} · {format(parseISO(t.date), 'dd MMM', { locale: es })}
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold tabular-nums"
                style={{ color: t.type === 'ingreso' ? '#065f46' : '#991b1b' }}>
                {t.type === 'ingreso' ? '+' : '-'}{fmt(t)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
