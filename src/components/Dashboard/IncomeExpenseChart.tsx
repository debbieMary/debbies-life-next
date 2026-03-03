'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction } from '@/types';

const BORDER = '#fce8ee';

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
    <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-sm p-5 mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>
        Ingresos vs Gastos
      </h3>
      <p className="text-xs mb-4" style={{ color: '#E0B8C4' }}>{subtitle}</p>

      {transactions.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 28, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
              <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: '#D4A0B0' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#D4A0B0' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
              <Tooltip formatter={(v: any, name: string | undefined) => [
                name?.includes('$') ? fmtUSD(v) : fmtBOB(v), name
              ]} contentStyle={{ border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#D4A0B0' }} />
              <Bar dataKey="ingresoUSD" name="Ingresos $"  fill="#86efac" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="ingresoUSD" position="top" formatter={(v: any) => v > 0 ? fmtUSD(v) : ''} style={{ fontSize: 10, fill: '#065f46', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="gastoUSD"   name="Gastos $"    fill="#C9849A" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="gastoUSD"   position="top" formatter={(v: any) => v > 0 ? fmtUSD(v) : ''} style={{ fontSize: 10, fill: '#991b1b', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="ingresoBOB" name="Ingresos Bs" fill="#6ee7b7" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="ingresoBOB" position="top" formatter={(v: any) => v > 0 ? fmtBOB(v) : ''} style={{ fontSize: 10, fill: '#065f46', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="gastoBOB"   name="Gastos Bs"   fill="#f9a8d4" radius={[4,4,0,0]} maxBarSize={40}>
                <LabelList dataKey="gastoBOB"   position="top" formatter={(v: any) => v > 0 ? fmtBOB(v) : ''} style={{ fontSize: 10, fill: '#991b1b', fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Balance */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: balanceUSD >= 0 ? '#ede9fe' : '#fff7ed', border: `1px solid ${balanceUSD >= 0 ? '#c4b5fd' : '#fdba74'}` }}>
              <span className="text-xs font-medium" style={{ color: '#D4A0B0' }}>Balance $</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: balanceUSD >= 0 ? '#5b21b6' : '#9a3412' }}>
                {balanceUSD >= 0 ? '+' : ''}{fmtUSD(balanceUSD)}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: balanceBOB >= 0 ? '#ede9fe' : '#fff7ed', border: `1px solid ${balanceBOB >= 0 ? '#c4b5fd' : '#fdba74'}` }}>
              <span className="text-xs font-medium" style={{ color: '#D4A0B0' }}>Balance Bs</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: balanceBOB >= 0 ? '#5b21b6' : '#9a3412' }}>
                {balanceBOB >= 0 ? '+' : ''}{fmtBOB(balanceBOB)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-sm" style={{ color: '#D4A0B0' }}>Sin datos en este período</p>
        </div>
      )}
    </div>
  );
}
