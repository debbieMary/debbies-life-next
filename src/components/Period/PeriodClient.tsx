'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PeriodEntry, PeriodCycleLength } from '@/types';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, X, Trash2, Pencil, Droplets, Sparkles, Flower2 } from 'lucide-react';

const PINK_BG     = 'var(--pc-pink-bg)';
const PINK_TEXT   = 'var(--pc-pink-text)';
const PINK_BORDER = 'var(--pc-pink-border)';
const LAV_BG      = 'var(--pc-lav-bg)';
const LAV_TEXT    = 'var(--pc-lav-text)';
const LAV_BORDER  = 'var(--pc-lav-border)';
const TEAL_BG     = 'var(--pc-teal-bg)';
const TEAL_TEXT   = 'var(--pc-teal-text)';
const TEAL_BORDER = 'var(--pc-teal-border)';
const PEACH_BG    = 'var(--pc-peach-bg)';
const PEACH_TEXT  = 'var(--pc-peach-text)';
const PEACH_BORDER= 'var(--pc-peach-border)';
const MUTED       = 'var(--muted)';


const todayStr = () => new Date().toISOString().split('T')[0];

interface Props {
  initial: PeriodEntry[];
  initialCycles: PeriodCycleLength[];
}

export default function PeriodClient({ initial, initialCycles }: Props) {
  const [entries, setEntries] = useState<PeriodEntry[]>(initial);
  const [cycles,  setCycles]  = useState<PeriodCycleLength[]>(initialCycles);

  const [periodOpen,   setPeriodOpen]   = useState(false);
  const [periodSaving, setPeriodSaving] = useState(false);
  const [editPeriodId, setEditPeriodId] = useState<string | null>(null);
  const [periodForm,   setPeriodForm]   = useState({ start_date: todayStr(), duration_days: '5', notes: '' });

  const [cycleOpen,   setCycleOpen]   = useState(false);
  const [cycleSaving, setCycleSaving] = useState(false);
  const [editCycleId, setEditCycleId] = useState<string | null>(null);
  const [cycleForm,   setCycleForm]   = useState({ cycle_days: '', recorded_at: todayStr(), notes: '' });

  const sortedCycles = [...cycles].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const currentCycle = sortedCycles[sortedCycles.length - 1];
  const cycleDays    = currentCycle?.cycle_days ?? null;

  const sortedEntries = [...entries].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const lastEntry     = sortedEntries[sortedEntries.length - 1];
  const nextPredicted = lastEntry && cycleDays ? addDays(parseISO(lastEntry.start_date), cycleDays) : null;
  const daysUntilNext = nextPredicted ? differenceInDays(nextPredicted, new Date()) : null;
  const ovulationDay  = lastEntry && cycleDays ? addDays(parseISO(lastEntry.start_date), cycleDays - 14) : null;
  const daysUntilOvul = ovulationDay ? differenceInDays(ovulationDay, new Date()) : null;

  const isPast  = daysUntilNext !== null && daysUntilNext < 0;
  const isAlert = daysUntilNext !== null && daysUntilNext <= 3 && !isPast;

  const countdown = (d: number | null) => {
    if (d === null) return '—';
    if (d < 0)   return `hace ${Math.abs(d)} días`;
    if (d === 0) return 'hoy';
    return `en ${d} días`;
  };

  const openAddPeriod    = () => { setEditPeriodId(null); setPeriodForm({ start_date: todayStr(), duration_days: '5', notes: '' }); setPeriodOpen(true); };
  const openEditPeriod   = (e: PeriodEntry) => { setEditPeriodId(e.id); setPeriodForm({ start_date: e.start_date, duration_days: String(e.duration_days), notes: e.notes || '' }); setPeriodOpen(true); };
  const closePeriodModal = () => { setPeriodOpen(false); setEditPeriodId(null); };
  const handleSavePeriod = async () => {
    if (!periodForm.start_date) return;
    setPeriodSaving(true);
    const payload = { start_date: periodForm.start_date, duration_days: parseInt(periodForm.duration_days) || 5, notes: periodForm.notes.trim() };
    if (editPeriodId) {
      const { data, error } = await supabase.from('period_entries').update(payload).eq('id', editPeriodId).select().single();
      if (!error && data) { setEntries(p => p.map(e => e.id === editPeriodId ? data : e)); closePeriodModal(); }
    } else {
      const { data, error } = await supabase.from('period_entries').insert([payload]).select().single();
      if (!error && data) { setEntries(p => [...p, data]); closePeriodModal(); }
    }
    setPeriodSaving(false);
  };
  const handleDeletePeriod = async (id: string) => { await supabase.from('period_entries').delete().eq('id', id); setEntries(p => p.filter(e => e.id !== id)); };

  const openAddCycle    = () => { setEditCycleId(null); setCycleForm({ cycle_days: '', recorded_at: todayStr(), notes: '' }); setCycleOpen(true); };
  const openEditCycle   = (c: PeriodCycleLength) => { setEditCycleId(c.id); setCycleForm({ cycle_days: String(c.cycle_days), recorded_at: c.recorded_at, notes: c.notes || '' }); setCycleOpen(true); };
  const closeCycleModal = () => { setCycleOpen(false); setEditCycleId(null); };
  const handleSaveCycle = async () => {
    const days = parseInt(cycleForm.cycle_days);
    if (!days || days <= 0 || !cycleForm.recorded_at) return;
    setCycleSaving(true);
    const payload = { cycle_days: days, recorded_at: cycleForm.recorded_at, notes: cycleForm.notes.trim() };
    if (editCycleId) {
      const { data, error } = await supabase.from('period_cycle_lengths').update(payload).eq('id', editCycleId).select().single();
      if (!error && data) { setCycles(p => p.map(c => c.id === editCycleId ? data : c)); closeCycleModal(); }
    } else {
      const { data, error } = await supabase.from('period_cycle_lengths').insert([payload]).select().single();
      if (!error && data) { setCycles(p => [...p, data]); closeCycleModal(); }
    }
    setCycleSaving(false);
  };
  const handleDeleteCycle = async (id: string) => { await supabase.from('period_cycle_lengths').delete().eq('id', id); setCycles(p => p.filter(c => c.id !== id)); };

  const cycleDay = lastEntry && cycleDays
    ? Math.min(differenceInDays(new Date(), parseISO(lastEntry.start_date)) + 1, cycleDays)
    : null;

  return (
    <div className="space-y-3">

        {/* Tarjetas período + ovulación */}
        <div className="grid grid-cols-2 gap-3">

          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: LAV_BG, border: `1.5px solid ${LAV_BORDER}` }}>
            <Flower2 size={52} style={{ position:'absolute', bottom:-10, right:-10, color: 'var(--pc-lav-text)', opacity: 1 }} />
            <Flower2 size={22} style={{ position:'absolute', top:6, right:8, color: 'var(--pc-lav-text)', opacity: 0.4 }} />
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets size={13} style={{ color: LAV_TEXT }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: LAV_TEXT }}>Período</p>
            </div>
            {nextPredicted ? (
              <>
                <p className="text-2xl font-bold leading-tight" style={{ color: isPast || isAlert ? '#9333EA' : LAV_TEXT }}>
                  {format(nextPredicted, "d MMM", { locale: es })}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: LAV_TEXT }}>{countdown(daysUntilNext)}</p>
              </>
            ) : (
              <p className="text-xs mt-1" style={{ color: LAV_TEXT }}>registra tu ciclo</p>
            )}
          </div>

          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: TEAL_BG, border: `1.5px solid ${TEAL_BORDER}` }}>
            <Flower2 size={52} style={{ position:'absolute', bottom:-10, right:-10, color: '#0F766E', opacity: 1 }} />
            <Flower2 size={22} style={{ position:'absolute', top:6, right:8, color: '#0F766E', opacity: 0.4 }} />
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={13} style={{ color: TEAL_TEXT }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEAL_TEXT }}>Ovulación</p>
            </div>
            {ovulationDay ? (
              <>
                <p className="text-2xl font-bold leading-tight" style={{ color: TEAL_TEXT }}>
                  {format(ovulationDay, "d MMM", { locale: es })}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: TEAL_TEXT }}>{countdown(daysUntilOvul)}</p>
              </>
            ) : (
              <p className="text-xs mt-1" style={{ color: TEAL_TEXT }}>registra tu ciclo</p>
            )}
          </div>
        </div>

        {/* Ciclo actual */}
        <div className="rounded-2xl px-4 py-3 relative overflow-hidden" style={{ background: PEACH_BG, border: `1.5px solid ${PEACH_BORDER}` }}>
          <Flower2 size={44} style={{ position:'absolute', bottom:-8, right:-8, color: PEACH_BORDER, opacity: 1 }} />
          <Flower2 size={20} style={{ position:'absolute', top:-6, right:72, color: PEACH_BORDER, opacity: 0.9 }} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Flower2 size={13} style={{ color: PEACH_TEXT }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PEACH_TEXT }}>Mi ciclo</span>
              {cycleDays && <span className="text-sm font-bold" style={{ color: PEACH_TEXT }}>· cada {cycleDays} días</span>}
              {cycleDay && cycleDays && <span className="text-xs" style={{ color: PEACH_TEXT }}>· día {cycleDay} de {cycleDays}</span>}
            </div>
            <button onClick={openAddCycle}
              style={{ background: 'var(--card)', color: PEACH_TEXT, border: `1px solid ${PEACH_BORDER}` }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity shrink-0">
              <Plus size={11} /> Actualizar
            </button>
          </div>
          {cycleDay && cycleDays && (
            <div className="mt-2 h-1.5 rounded-full" style={{ background: '#fff' }}>
              <div className="h-full rounded-full" style={{ width: `${(cycleDay / cycleDays) * 100}%`, background: PEACH_TEXT }} />
            </div>
          )}
          {sortedCycles.length === 0 && (
            <p className="text-xs mt-1" style={{ color: PEACH_TEXT }}>¿Cada cuántos días te baja? Regístralo.</p>
          )}
          {sortedCycles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...sortedCycles].reverse().map((c, i) => (
                <div key={c.id} className="group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl"
                  style={{ background: 'var(--card)', color: PEACH_TEXT, border: `1px solid ${PEACH_BORDER}` }}>
                  <span className="font-bold">cada {c.cycle_days}d</span>
                  <span style={{ color: MUTED }}>· {format(parseISO(c.recorded_at), 'MMM yyyy', { locale: es })}</span>
                  {i === 0 && <span className="font-bold" style={{ color: PEACH_TEXT }}>· actual</span>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditCycle(c)}><Pencil size={10} /></button>
                    <button onClick={() => handleDeleteCycle(c.id)}><Trash2 size={10} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial de períodos */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${PINK_BORDER}` }}>
          <div className="flex items-center justify-between px-4 py-2.5 relative overflow-hidden"
            style={{ background: PINK_BG, borderBottom: `1px solid ${PINK_BORDER}` }}>
            <Flower2 size={36} style={{ position:'absolute', right:60, top:-6, color: PINK_BORDER, opacity: 0.9 }} />
            <Flower2 size={20} style={{ position:'absolute', right:30, bottom:-4, color: PINK_BORDER, opacity: 0.9 }} />
            <div className="flex items-center gap-1.5 relative">
              <Flower2 size={13} style={{ color: PINK_TEXT }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: PINK_TEXT }}>Mis períodos</p>
            </div>
            <button onClick={openAddPeriod}
              style={{ background: 'var(--card)', color: PINK_TEXT, border: `1px solid ${PINK_BORDER}` }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity relative">
              <Plus size={11} /> Registrar
            </button>
          </div>

          {sortedEntries.length === 0 ? (
            <div className="px-4 py-3" style={{ background: 'var(--bg)' }}>
              <p className="text-xs" style={{ color: MUTED }}>Anota tu próximo período cuando llegue.</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg)' }}>
              {[...sortedEntries].reverse().map((e, i) => (
                <div key={e.id} className="group flex items-center gap-2.5 px-4 py-2.5 text-xs relative"
                  style={{ borderBottom: i < sortedEntries.length - 1 ? `1px solid ${PINK_BORDER}` : 'none' }}>
                  <Flower2 size={11} style={{ color: PINK_TEXT, flexShrink: 0 }} />
                  <span className="font-semibold" style={{ color: 'var(--text)' }}>
                    {format(parseISO(e.start_date), "d MMM yyyy", { locale: es })}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold shrink-0"
                    style={{ background: PINK_BG, color: PINK_TEXT, border: `1px solid ${PINK_BORDER}` }}>
                    {e.duration_days}d
                  </span>
                  {e.notes && <span className="truncate flex-1" style={{ color: MUTED }}>{e.notes}</span>}
                  <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEditPeriod(e)} style={{ color: MUTED }}><Pencil size={11} /></button>
                    <button onClick={() => handleDeletePeriod(e.id)} style={{ color: MUTED }}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* ── Modal período ── */}
      {periodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay)' }}>
          <div style={{ background: 'var(--card)', border: `1.5px solid ${PINK_BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Droplets size={15} style={{ color: PINK_TEXT }} />
                <h3 className="text-sm font-bold" style={{ color: PINK_TEXT }}>{editPeriodId ? 'Editar período' : 'Registrar período'}</h3>
              </div>
              <button onClick={closePeriodModal} style={{ color: MUTED }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: MUTED }}>Fecha de inicio *</label>
                <input type="date" value={periodForm.start_date} onChange={e => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                  style={{ border: `1px solid ${PINK_BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: MUTED }}>Duración (días)</label>
                <input type="number" value={periodForm.duration_days} min="1" max="10" onChange={e => setPeriodForm({ ...periodForm, duration_days: e.target.value })}
                  style={{ border: `1px solid ${PINK_BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: MUTED }}>Notas</label>
                <textarea value={periodForm.notes} rows={2} onChange={e => setPeriodForm({ ...periodForm, notes: e.target.value })}
                  placeholder="dolor leve, manchado previo..."
                  style={{ border: `1px solid ${PINK_BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-white resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={closePeriodModal} style={{ border: `1px solid ${PINK_BORDER}`, color: MUTED }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSavePeriod} disabled={periodSaving || !periodForm.start_date}
                style={{ background: PINK_BG, color: PINK_TEXT, border: `1px solid ${PINK_BORDER}` }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80">
                {periodSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ciclo ── */}
      {cycleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'var(--overlay)' }}>
          <div style={{ background: 'var(--card)', border: `1.5px solid ${PEACH_BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flower2 size={15} style={{ color: PEACH_TEXT }} />
                <h3 className="text-sm font-bold" style={{ color: PEACH_TEXT }}>{editCycleId ? 'Editar ciclo' : 'Duración del ciclo'}</h3>
              </div>
              <button onClick={closeCycleModal} style={{ color: MUTED }}><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: MUTED }}>Cada cuántos días *</label>
                <input type="number" value={cycleForm.cycle_days} min="15" max="60" onChange={e => setCycleForm({ ...cycleForm, cycle_days: e.target.value })}
                  placeholder="ej: 28" style={{ border: `1px solid ${PEACH_BORDER}`, color: '#2a1520' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: MUTED }}>Desde cuándo aplica</label>
                <input type="date" value={cycleForm.recorded_at} onChange={e => setCycleForm({ ...cycleForm, recorded_at: e.target.value })}
                  style={{ border: `1px solid ${PEACH_BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: MUTED }}>Notas</label>
                <input value={cycleForm.notes} onChange={e => setCycleForm({ ...cycleForm, notes: e.target.value })}
                  placeholder="ej: después de dejar la pastilla"
                  style={{ border: `1px solid ${PEACH_BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={closeCycleModal} style={{ border: `1px solid ${PEACH_BORDER}`, color: MUTED }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSaveCycle} disabled={cycleSaving || !cycleForm.cycle_days}
                style={{ background: PEACH_BG, color: PEACH_TEXT, border: `1px solid ${PEACH_BORDER}` }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80">
                {cycleSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
