'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DiaryEntry, DiaryMood } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, X, Pencil, Trash2, Sparkles, Sun, Minus, CloudRain, Flame, Zap, Moon, Thermometer, BookHeart } from 'lucide-react';

const PINK   = 'var(--pink)';
const BORDER = 'var(--border)';

export const MOODS: { value: DiaryMood; label: string; Icon: any; bg: string; color: string }[] = [
  { value: 'increible', label: 'Increible', Icon: Sparkles,    bg: '#fef9c3', color: '#854d0e' },
  { value: 'feliz',     label: 'Feliz',     Icon: Sun,         bg: '#d1fae5', color: '#065f46' },
  { value: 'normal',    label: 'Normal',    Icon: Minus,       bg: '#f1f5f9', color: '#475569' },
  { value: 'triste',    label: 'Triste',    Icon: CloudRain,   bg: '#dbeafe', color: '#1e40af' },
  { value: 'enojada',   label: 'Enojada',   Icon: Flame,       bg: '#fee2e2', color: '#991b1b' },
  { value: 'ansiosa',   label: 'Ansiosa',   Icon: Zap,         bg: '#ede9fe', color: '#6d28d9' },
  { value: 'cansada',   label: 'Cansada',   Icon: Moon,        bg: '#fce7f3', color: '#9d174d' },
  { value: 'enferma',   label: 'Enferma',   Icon: Thermometer, bg: '#fef2f2', color: '#b91c1c' },
];

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  title: '',
  content: '',
  mood: 'feliz' as DiaryMood,
};

interface Props { initial: DiaryEntry[] }

export default function DiaryClient({ initial }: Props) {
  const [entries, setEntries]   = useState<DiaryEntry[]>(initial);
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const dMonthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
  const dTodayStr   = () => new Date().toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(dMonthStart());
  const [dateTo, setDateTo]     = useState(dTodayStr());

  const setPreset = (days: number | null | 'mes') => {
    if (days === null) { setDateFrom(''); setDateTo(''); return; }
    if (days === 'mes') { setDateFrom(dMonthStart()); setDateTo(dTodayStr()); return; }
    const d = new Date(); d.setDate(d.getDate() - days);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(dTodayStr());
  };

  const isActive = (days: number | null | 'mes') => {
    if (days === null) return !dateFrom && !dateTo;
    if (days === 'mes') return dateFrom === dMonthStart() && dateTo === dTodayStr();
    const d = new Date(); d.setDate(d.getDate() - days);
    return dateFrom === d.toISOString().split('T')[0] && dateTo === dTodayStr();
  };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };

  const openEdit = (e: DiaryEntry) => {
    setEditId(e.id);
    setForm({ date: e.date, title: e.title, content: e.content, mood: e.mood });
    setSelected(null);
    setOpen(true);
  };

  const closeModal = () => { setOpen(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setError(null);
    if (editId) {
      const { data, error: err } = await supabase.from('diary_entries')
        .update({ date: form.date, title: form.title.trim(), content: form.content.trim(), mood: form.mood })
        .eq('id', editId).select().single();
      if (err) { setError(err.message); }
      else if (data) { setEntries(prev => prev.map(e => e.id === editId ? data : e)); closeModal(); }
    } else {
      const { data, error: err } = await supabase.from('diary_entries')
        .insert([{ date: form.date, title: form.title.trim(), content: form.content.trim(), mood: form.mood }])
        .select().single();
      if (err) { setError(err.message); }
      else if (data) { setEntries(prev => [data, ...prev]); closeModal(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('diary_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const PRESETS: { label: string; days: number | null | 'mes' }[] = [
    { label: 'Mes',  days: 'mes' },
    { label: '7d',   days: 7    },
    { label: '30d',  days: 30   },
    { label: '3m',   days: 90   },
    { label: 'Todo', days: null },
  ];

  const sorted = [...entries]
    .filter((e) => (!dateFrom || e.date >= dateFrom) && (!dateTo || e.date <= dateTo))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: PINK }}>Mis entradas</h2>
        <button onClick={openAdd}
          style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity">
          <Plus size={15} /> Nueva entrada
        </button>
      </div>

      {/* Filtro de fecha */}
      <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl p-3 mb-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200" />
            <span className="hidden sm:inline text-xs shrink-0" style={{ color: 'var(--muted)' }}>—</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {PRESETS.map(({ label, days }) => (
              <button key={label} onClick={() => setPreset(days)}
                style={{
                  background: isActive(days) ? 'var(--pink-bg)' : 'var(--btn-inactive)',
                  color: PINK,
                  border: `1px solid ${isActive(days) ? 'var(--pink-border)' : BORDER}`,
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
          <BookHeart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin entradas aún. Escribe tu primer dia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry) => {
            const mood = MOODS.find(m => m.value === entry.mood)!;
            return (
              <div key={entry.id}
                onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                style={{ background: 'var(--card)', border: `1px solid ${BORDER}`, cursor: 'pointer' }}
                className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl"
                    style={{ background: mood.bg }}>
                    <mood.Icon size={20} style={{ color: mood.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{entry.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {format(parseISO(entry.date), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); openEdit(entry); }}
                          style={{ color: 'var(--muted)' }} className="hover:opacity-70"><Pencil size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                          style={{ color: 'var(--muted)' }} className="hover:opacity-70"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                      style={{ background: mood.bg, color: mood.color }}>
                      <mood.Icon size={10} /> {mood.label}
                    </span>
                    {selected?.id === entry.id && (
                      <p className="text-sm mt-3 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-soft)' }}>
                        {entry.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)' }}>
          <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}`, maxHeight: '90vh' }}
            className="rounded-2xl shadow-xl w-full max-w-lg flex flex-col">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-base font-bold" style={{ color: PINK }}>
                {editId ? 'Editar entrada' : 'Nueva entrada'}
              </h3>
              <button onClick={closeModal} style={{ color: 'var(--muted)' }} className="hover:opacity-70"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--muted)' }}>
                  Como fue tu dia?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button key={m.value} onClick={() => setForm({ ...form, mood: m.value })}
                      style={{
                        background: form.mood === m.value ? m.bg : 'var(--btn-inactive)',
                        border: `2px solid ${form.mood === m.value ? m.color : BORDER}`,
                      }}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all">
                      <m.Icon size={20} style={{ color: form.mood === m.value ? m.color : 'var(--muted)' }} />
                      <span className="text-xs font-semibold" style={{ color: form.mood === m.value ? m.color : 'var(--muted)' }}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Fecha</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Titulo *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Que paso hoy?"
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Tu dia *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6} placeholder="Cuentame todo..."
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white resize-none" />
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: '#fee2e2', color: '#991b1b' }}>
                Error: {error}
              </div>
            )}
            <div className="flex gap-2 px-6 py-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button onClick={closeModal}
                style={{ border: `1px solid ${BORDER}`, color: 'var(--muted)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}
                style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity">
                {saving ? 'Guardando...' : editId ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
