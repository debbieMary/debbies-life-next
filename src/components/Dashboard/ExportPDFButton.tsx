'use client';

import { useState } from 'react';
import { FileDown, X, Calendar, CalendarRange } from 'lucide-react';
import { Transaction, Goal, GoalAction, ExchangeRate, WeightEntry, DiaryEntry } from '@/types';
import { exportReportPDF, ReportPeriod } from '@/lib/exportPDF';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const PINK   = '#7D3050';
const BORDER = '#fce8ee';

interface Props {
  transactions:  Transaction[];
  goals:         Goal[];
  goalActions:   GoalAction[];
  rates:         ExchangeRate[];
  weightEntries: WeightEntry[];
  weightTarget:  number | null;
  diaryEntries:  DiaryEntry[];
}

type Mode = 'month' | 'range';

export default function ExportPDFButton({ transactions, goals, goalActions, rates, weightEntries, weightTarget, diaryEntries }: Props) {
  const [open, setOpen]   = useState(false);
  const [mode, setMode]   = useState<Mode>('month');
  const [loading, setLoading] = useState(false);

  const today = new Date();

  // Month mode
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  // Range mode
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [dateTo,   setDateTo]   = useState(format(today, 'yyyy-MM-dd'));

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);

  const handleExport = async () => {
    setLoading(true);
    let period: ReportPeriod;

    if (mode === 'month') {
      const d = new Date(selectedYear, selectedMonth, 1);
      period = {
        from:  format(startOfMonth(d), 'yyyy-MM-dd'),
        to:    format(endOfMonth(d),   'yyyy-MM-dd'),
        label: format(d, 'MMMM yyyy', { locale: es }),
      };
    } else {
      period = {
        from:  dateFrom,
        to:    dateTo,
        label: `${format(new Date(dateFrom + 'T00:00:00'), 'dd/MM/yyyy')} - ${format(new Date(dateTo + 'T00:00:00'), 'dd/MM/yyyy')}`,
      };
    }

    // Small delay so the button shows "Generando..."
    await new Promise((r) => setTimeout(r, 100));
    exportReportPDF(transactions, goals, goalActions, rates, period, weightEntries, weightTarget, diaryEntries);
    setLoading(false);
    setOpen(false);
  };

  const isRangeValid = !dateFrom || !dateTo || dateFrom <= dateTo;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity shadow-sm"
      >
        <FileDown size={16} />
        Exportar PDF
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(125,48,80,0.15)' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}` }}
            className="rounded-2xl shadow-xl w-full max-w-sm p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileDown size={18} style={{ color: PINK }} />
                <h3 className="text-base font-bold" style={{ color: PINK }}>Exportar Reporte PDF</h3>
              </div>
              <button onClick={() => setOpen(false)} style={{ color: '#D4A0B0' }} className="hover:opacity-70">
                <X size={18} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMode('month')}
                style={{
                  background: mode === 'month' ? '#FFD6E0' : '#fff7f9',
                  color: PINK,
                  border: `1px solid ${mode === 'month' ? '#f5b8cc' : BORDER}`,
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <Calendar size={14} />
                Por mes
              </button>
              <button
                onClick={() => setMode('range')}
                style={{
                  background: mode === 'range' ? '#FFD6E0' : '#fff7f9',
                  color: PINK,
                  border: `1px solid ${mode === 'range' ? '#f5b8cc' : BORDER}`,
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <CalendarRange size={14} />
                Rango
              </button>
            </div>

            {/* Month selector */}
            {mode === 'month' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Mes</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => setSelectedMonth(i)}
                        style={{
                          background: selectedMonth === i ? '#FFD6E0' : '#fff7f9',
                          color: PINK,
                          border: `1px solid ${selectedMonth === i ? '#f5b8cc' : BORDER}`,
                        }}
                        className="py-1.5 rounded-lg text-xs font-medium transition-all">
                        {m.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Año</label>
                  <div className="flex gap-2">
                    {years.map((y) => (
                      <button key={y} onClick={() => setSelectedYear(y)}
                        style={{
                          background: selectedYear === y ? '#FFD6E0' : '#fff7f9',
                          color: PINK,
                          border: `1px solid ${selectedYear === y ? '#f5b8cc' : BORDER}`,
                        }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all">
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-center" style={{ color: '#D4A0B0' }}>
                  Período: {MONTHS[selectedMonth]} {selectedYear}
                </p>
              </div>
            )}

            {/* Range selector */}
            {mode === 'range' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Desde</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Hasta</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
                </div>
                {!isRangeValid && (
                  <p className="text-xs" style={{ color: '#991b1b' }}>La fecha final debe ser mayor a la inicial</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setOpen(false)}
                style={{ border: `1px solid ${BORDER}`, color: '#D4A0B0' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">
                Cancelar
              </button>
              <button
                onClick={handleExport}
                disabled={loading || !isRangeValid}
                style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity"
              >
                <FileDown size={14} />
                {loading ? 'Generando...' : 'Generar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
