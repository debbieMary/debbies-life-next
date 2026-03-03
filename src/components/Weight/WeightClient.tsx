'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WeightEntry } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Plus, X, Trash2, TrendingDown, TrendingUp, Minus, Pencil } from 'lucide-react';

const PINK   = '#7D3050';
const BORDER = '#fce8ee';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #fce8ee' }} className="rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#D4A0B0' }}>{label}</p>
      <p className="font-bold" style={{ color: PINK }}>{payload[0].value} kg</p>
      {payload[0].payload.notes && (
        <p className="text-xs mt-1" style={{ color: '#D4A0B0' }}>{payload[0].payload.notes}</p>
      )}
    </div>
  );
}

interface Props {
  initial: WeightEntry[];
  initialTarget: number | null;
}

const wToday7  = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; };
const wTodayStr = () => new Date().toISOString().split('T')[0];

export default function WeightClient({ initial, initialTarget }: Props) {
  const [entries, setEntries]     = useState<WeightEntry[]>(initial);
  const [target, setTarget]       = useState<number | null>(initialTarget);
  const [open, setOpen]           = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState({
    weight: '', date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [targetInput, setTargetInput] = useState(String(initialTarget ?? ''));
  const [dateFrom, setDateFrom] = useState(wToday7());
  const [dateTo, setDateTo]     = useState(wTodayStr());

  const setPreset = (days: number | null) => {
    if (days === null) { setDateFrom(''); setDateTo(''); return; }
    const d = new Date(); d.setDate(d.getDate() - days);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(wTodayStr());
  };

  const allSorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const sorted    = allSorted.filter((e) =>
    (!dateFrom || e.date >= dateFrom) && (!dateTo || e.date <= dateTo)
  );

  const latest   = sorted[sorted.length - 1];
  const first    = sorted[0];
  const diff     = latest && first ? latest.weight - first.weight : null;
  const toGoal   = latest && target ? latest.weight - target : null;

  const chartData = sorted.map((e) => ({
    date:   format(parseISO(e.date), 'dd MMM', { locale: es }),
    peso:   Number(e.weight),
    notes:  e.notes,
  }));

  const openAdd = () => {
    setEditId(null);
    setForm({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setOpen(true);
  };

  const openEdit = (e: WeightEntry) => {
    setEditId(e.id);
    setForm({ weight: String(e.weight), date: e.date, notes: e.notes || '' });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setForm({ weight: '', date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const handleSave = async () => {
    if (!form.weight || parseFloat(form.weight) <= 0) return;
    setSaving(true);
    if (editId) {
      const { data, error } = await supabase.from('weight_entries')
        .update({
          weight: parseFloat(form.weight),
          date:   form.date,
          notes:  form.notes.trim(),
        })
        .eq('id', editId)
        .select().single();
      if (!error && data) {
        setEntries((prev) => prev.map((e) => e.id === editId ? data : e));
        closeModal();
      }
    } else {
      const { data, error } = await supabase.from('weight_entries').insert([{
        weight: parseFloat(form.weight),
        date:   form.date,
        notes:  form.notes.trim(),
      }]).select().single();
      if (!error && data) {
        setEntries((prev) => [...prev, data]);
        closeModal();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('weight_entries').delete().eq('id', id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveTarget = async () => {
    const val = parseFloat(targetInput);
    if (!val || val <= 0) return;
    await supabase.from('weight_entries').delete().eq('notes', '__target__');
    await supabase.from('weight_entries').insert([{ weight: val, date: '2000-01-01', notes: '__target__' }]);
    setTarget(val);
    setTargetOpen(false);
  };

  const allWeights   = sorted.map((e) => e.weight);
  const minW         = Math.min(...allWeights, target ?? Infinity) - 2;
  const maxW         = Math.max(...allWeights, target ?? -Infinity) + 2;

  return (
    <div>
      {/* Filtro de fecha */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl p-3 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
            <span className="text-xs shrink-0" style={{ color: '#D4A0B0' }}>—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '3m', days: 90 }, { label: 'Todo', days: null }].map(({ label, days }) => (
              <button key={label} onClick={() => setPreset(days)}
                style={{
                  background: (days === 7 ? dateFrom === wToday7() : days === 30 ? dateFrom === (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; })() : days === 90 ? dateFrom === (() => { const d = new Date(); d.setDate(d.getDate()-90); return d.toISOString().split('T')[0]; })() : !dateFrom && !dateTo) ? '#FFD6E0' : '#fff7f9',
                  color: PINK,
                  border: `1px solid ${(days === 7 ? dateFrom === wToday7() : days === 30 ? dateFrom === (() => { const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().split('T')[0]; })() : days === 90 ? dateFrom === (() => { const d = new Date(); d.setDate(d.getDate()-90); return d.toISOString().split('T')[0]; })() : !dateFrom && !dateTo) ? '#f5b8cc' : BORDER}`,
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>Peso actual</p>
          <p className="text-2xl font-bold" style={{ color: PINK }}>{latest ? `${latest.weight} kg` : '—'}</p>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>Peso inicial</p>
          <p className="text-2xl font-bold" style={{ color: '#2a1520' }}>{first ? `${first.weight} kg` : '—'}</p>
        </div>
        <div style={{
          background: diff === null ? '#fff' : diff < 0 ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${diff === null ? BORDER : diff < 0 ? '#6ee7b7' : '#fca5a5'}`
        }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: diff === null ? '#D4A0B0' : diff < 0 ? '#065f46' : '#991b1b' }}>
            Diferencia
          </p>
          <div className="flex items-center gap-1">
            {diff !== null && (diff < 0
              ? <TrendingDown size={18} style={{ color: '#065f46' }} />
              : diff > 0
                ? <TrendingUp size={18} style={{ color: '#991b1b' }} />
                : <Minus size={18} style={{ color: '#D4A0B0' }} />)}
            <p className="text-2xl font-bold" style={{ color: diff === null ? '#D4A0B0' : diff < 0 ? '#065f46' : '#991b1b' }}>
              {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : '—'}
            </p>
          </div>
        </div>
        <div style={{
          background: toGoal === null ? '#fff' : toGoal <= 0 ? '#d1fae5' : '#fce7f3',
          border: `1px solid ${toGoal === null ? BORDER : toGoal <= 0 ? '#6ee7b7' : '#f9a8d4'}`
        }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#D4A0B0' }}>Para la meta</p>
          <p className="text-2xl font-bold" style={{ color: toGoal === null ? '#D4A0B0' : toGoal <= 0 ? '#065f46' : PINK }}>
            {toGoal !== null ? (toGoal <= 0 ? 'Meta lograda!' : `-${toGoal.toFixed(1)} kg`) : '—'}
          </p>
          {target && <p className="text-xs mt-0.5" style={{ color: '#D4A0B0' }}>Meta: {target} kg</p>}
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A0B0' }}>Progreso de peso</h3>
            <p className="text-xs mt-0.5" style={{ color: '#E0B8C4' }}>Historial en kg</p>
          </div>
          <button onClick={() => setTargetOpen(true)}
            style={{ border: `1px solid ${BORDER}`, color: '#D4A0B0' }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-70 transition-opacity">
            {target ? `Meta: ${target} kg` : 'Fijar meta'}
          </button>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fce8ee" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#D4A0B0', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#D4A0B0' }} axisLine={false} tickLine={false}
                domain={[minW, maxW]} tickFormatter={(v) => `${v}kg`} />
              <Tooltip content={<CustomTooltip />} />
              {target && (
                <ReferenceLine y={target} stroke="#86efac" strokeDasharray="6 3" strokeWidth={2}
                  label={{ value: `Meta ${target}kg`, position: 'right', fontSize: 10, fill: '#16a34a' }} />
              )}
              <Line type="monotone" dataKey="peso" stroke="#C9849A" strokeWidth={2.5}
                dot={{ fill: '#C9849A', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: PINK }} name="Peso (kg)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[240px]">
            <p className="text-sm" style={{ color: '#D4A0B0' }}>Sin registros aún</p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: PINK }}>Historial</h2>
        <button onClick={openAdd}
          style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity">
          <Plus size={15} /> Registrar peso
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#D4A0B0' }}>
          <p className="text-sm">{entries.length === 0 ? 'Sin registros. ¡Anota tu peso de hoy!' : 'Sin registros en este rango de fechas.'}</p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}` }} className="rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: '#fff7f9' }}>
              <tr>
                {['Fecha', 'Peso', 'Nota', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A0B0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: BORDER }}>
              {sorted.slice().reverse().map((e, i, arr) => {
                const prev = arr[i + 1];
                const delta = prev ? e.weight - prev.weight : null;
                return (
                  <tr key={e.id} className="group hover:bg-pink-50 transition-colors">
                    <td className="px-4 py-3" style={{ color: '#2a1520' }}>
                      {format(parseISO(e.date), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums" style={{ color: PINK }}>{e.weight} kg</span>
                        {delta !== null && (
                          <span className="text-xs font-semibold tabular-nums"
                            style={{ color: delta < 0 ? '#065f46' : delta > 0 ? '#991b1b' : '#D4A0B0' }}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#D4A0B0' }}>{e.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(e)} style={{ color: '#D4A0B0' }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-70 transition-opacity">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="hover:opacity-70 transition-opacity" style={{ color: '#D4A0B0' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(125,48,80,0.15)' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: PINK }}>
                {editId ? 'Editar registro' : 'Registrar peso'}
              </h3>
              <button onClick={closeModal} style={{ color: '#D4A0B0' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Peso (kg) *</label>
                <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="ej: 68.5" step="0.1"
                  style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Fecha</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Nota (opcional)</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ej: después del gym"
                  style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={closeModal}
                style={{ border: `1px solid ${BORDER}`, color: '#D4A0B0' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.weight}
                style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target modal */}
      {targetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(125,48,80,0.15)' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: PINK }}>Peso meta</h3>
              <button onClick={() => setTargetOpen(false)} style={{ color: '#D4A0B0' }}><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Quiero llegar a (kg)</label>
              <input type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)}
                placeholder="ej: 60" step="0.5"
                style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setTargetOpen(false)}
                style={{ border: `1px solid ${BORDER}`, color: '#D4A0B0' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSaveTarget} disabled={!targetInput || parseFloat(targetInput) <= 0}
                style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
