'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ExchangeRate } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeftRight, History, X, Pencil, Trash2 } from 'lucide-react';

const PINK   = 'var(--pink)';
const BORDER = 'var(--border)';

interface Props {
  current: ExchangeRate | null;
  history: ExchangeRate[];
  onUpdate: (rate: ExchangeRate) => void;
  onEditRate: (rate: ExchangeRate) => void;
  onDeleteRate: (id: string) => void;
}

export default function ExchangeRateWidget({ current, history, onUpdate, onEditRate, onDeleteRate }: Props) {
  const [open, setOpen]               = useState(false);
  const [rate, setRate]               = useState('');
  const [notes, setNotes]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);

  const openAdd = () => { setEditId(null); setRate(''); setNotes(''); setOpen(true); };

  const openEdit = (h: ExchangeRate) => {
    setEditId(h.id); setRate(String(h.rate)); setNotes(h.notes || ''); setOpen(true);
  };

  const closeModal = () => { setOpen(false); setEditId(null); setRate(''); setNotes(''); };

  const handleSave = async () => {
    if (!rate || parseFloat(rate) <= 0) return;
    setSaving(true);
    if (editId) {
      const { data, error } = await supabase.from('exchange_rates')
        .update({ rate: parseFloat(rate), notes: notes.trim() })
        .eq('id', editId).select().single();
      if (!error && data) { onEditRate(data); closeModal(); }
    } else {
      const { data, error } = await supabase.from('exchange_rates').insert([{
        rate: parseFloat(rate), date: new Date().toISOString().split('T')[0], notes: notes.trim(),
      }]).select().single();
      if (!error && data) { onUpdate(data); closeModal(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('exchange_rates').delete().eq('id', id);
    onDeleteRate(id);
  };

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl p-4 mb-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <ArrowLeftRight size={13} style={{ color: 'var(--muted)' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Tipo de cambio actual
            </p>
          </div>
          {current ? (
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold tabular-nums" style={{ color: PINK }}>
                1 USD = <span style={{ color: '#C9849A' }}>{Number(current.rate).toFixed(2)} BOB</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-2)' }}>
                {format(parseISO(current.date), 'dd MMM yyyy', { locale: es })}
                {current.notes && ` · ${current.notes}`}
              </p>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin tipo de cambio configurado</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <button onClick={() => setShowHistory(!showHistory)}
              style={{ border: `1px solid ${BORDER}`, color: 'var(--muted)' }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-70 transition-opacity">
              <History size={13} />
              {showHistory ? 'Ocultar' : 'Historial'}
            </button>
          )}
          <button onClick={openAdd}
            style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity">
            <ArrowLeftRight size={13} />
            Actualizar TC
          </button>
        </div>
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
            Historial de tipos de cambio
          </p>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="group flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold tabular-nums" style={{ color: PINK }}>
                    1 USD = {Number(h.rate).toFixed(2)} BOB
                  </span>
                  {h.notes && <span className="text-xs" style={{ color: 'var(--muted)' }}>{h.notes}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--muted-2)' }}>
                    {format(parseISO(h.date), 'dd MMM yyyy', { locale: es })}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(h)} style={{ color: 'var(--muted)' }} className="hover:opacity-70">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(h.id)} style={{ color: 'var(--muted)' }} className="hover:opacity-70">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)' }}>
          <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: PINK }}>
                {editId ? 'Editar Tipo de Cambio' : 'Actualizar Tipo de Cambio'}
              </h3>
              <button onClick={closeModal} style={{ color: 'var(--muted)' }} className="hover:opacity-70">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                  1 USD = ? BOB
                </label>
                <input type="number" value={rate} onChange={(e) => setRate(e.target.value)}
                  placeholder="ej: 13.50"
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>
                  Nota (opcional)
                </label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="ej: mercado paralelo"
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={closeModal}
                style={{ border: `1px solid ${BORDER}`, color: 'var(--muted)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !rate || parseFloat(rate) <= 0}
                style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
