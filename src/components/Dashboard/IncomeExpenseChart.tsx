'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  dateFrom?: string;
  dateTo?: string;
}

export default function IncomeExpenseChart({ transactions, dateFrom, dateTo }: Props) {
  const ingresoUSD = transactions.filter(t => t.type === 'ingreso' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const gastoUSD   = transactions.filter(t => t.type === 'gasto'   && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const ingresoBOB = transactions.filter(t => t.type === 'ingreso' && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const gastoBOB   = transactions.filter(t => t.type === 'gasto'   && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);

  const balanceUSD = ingresoUSD - gastoUSD;
  const balanceBOB = ingresoBOB - gastoBOB;

  const data = [{ periodo: 'Total', ingresoUSD, gastoUSD, ingresoBOB, gastoBOB }];

  const fmtUSD = (n: number) => `$${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  const fmtBOB = (n: number) => `Bs.${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

  const subtitle = dateFrom && dateTo
    ? `${format(parseISO(dateFrom), 'dd MMM', { locale: es })} – ${format(parseISO(dateTo), 'dd MMM yyyy', { locale: es })}`
    : 'Todo el tiempo';

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)' }} className="rounded-2xl shadow-sm p-5 mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
        Ingresos vs Gastos
      </h3>
      <p className="text-xs mb-4" style={{ color: 'var(--muted-2)' }}>{subtitle}</p>

      {transactions.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 28, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
              <Tooltip formatter={(v: any, name: string | undefined) => [
                name?.includes('$') ? fmtUSD(v) : fmtBOB(v), name
              ]} contentStyle={{ border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--muted)' }} />
              <Bar dataKey="ingresoUSD" name="Ingresos $"  fill="#86efac" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="ingresoUSD" position="top" formatter={(v: any) => v > 0 ? fmtUSD(v) : ''} style={{ fontSize: 10, fill: '#86efac', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="gastoUSD"   name="Gastos $"    fill="#C9849A" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="gastoUSD"   position="top" formatter={(v: any) => v > 0 ? fmtUSD(v) : ''} style={{ fontSize: 10, fill: '#C9849A', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="ingresoBOB" name="Ingresos Bs" fill="#6ee7b7" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="ingresoBOB" position="top" formatter={(v: any) => v > 0 ? fmtBOB(v) : ''} style={{ fontSize: 10, fill: '#6ee7b7', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="gastoBOB"   name="Gastos Bs"   fill="#f9a8d4" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="gastoBOB"   position="top" formatter={(v: any) => v > 0 ? fmtBOB(v) : ''} style={{ fontSize: 10, fill: '#f9a8d4', fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex gap-3 mt-4">
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{
                background: balanceUSD >= 0 ? 'var(--pc-lav-bg)' : 'var(--c-red)',
                border: `1px solid ${balanceUSD >= 0 ? 'var(--pc-lav-border)' : 'var(--c-red-br)'}`,
              }}>
              <span className="text-xs font-medium" style={{ color: balanceUSD >= 0 ? 'var(--pc-lav-text)' : 'var(--red-fg)' }}>Balance $</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: balanceUSD >= 0 ? 'var(--pc-lav-text)' : 'var(--red-fg)' }}>
                {balanceUSD >= 0 ? '+' : ''}{fmtUSD(balanceUSD)}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{
                background: balanceBOB >= 0 ? 'var(--pc-lav-bg)' : 'var(--c-red)',
                border: `1px solid ${balanceBOB >= 0 ? 'var(--pc-lav-border)' : 'var(--c-red-br)'}`,
              }}>
              <span className="text-xs font-medium" style={{ color: balanceBOB >= 0 ? 'var(--pc-lav-text)' : 'var(--red-fg)' }}>Balance Bs</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: balanceBOB >= 0 ? 'var(--pc-lav-text)' : 'var(--red-fg)' }}>
                {balanceBOB >= 0 ? '+' : ''}{fmtBOB(balanceBOB)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin datos en este período</p>
        </div>
      )}
    </div>
  );
}
