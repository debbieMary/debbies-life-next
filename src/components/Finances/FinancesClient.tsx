'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction, TransactionType, Currency, ExchangeRate } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Plus, X, Trash2, DollarSign, Banknote, Pencil } from 'lucide-react';
import ExchangeRateWidget from './ExchangeRateWidget';

const PINK   = 'var(--pink)';
const BORDER = 'var(--border)';

const INCOME_CATS  = ['Salario', 'Freelance', 'Inversión', 'Regalo', 'Cambio de moneda', 'Otro'];
const EXPENSE_CATS = ['Alimentación', 'Transporte', 'Salud', 'Entretenimiento', 'Ropa', 'Educación', 'Servicios', 'Ahorro', 'Cursos', 'Cambio de moneda', 'Otro'];

const emptyForm = {
  description: '', amount: '', type: 'ingreso' as TransactionType,
  currency: 'USD' as Currency, category: '',
  date: new Date().toISOString().split('T')[0],
};

interface Props {
  initial: Transaction[];
  initialRates: ExchangeRate[];
}

const todayStr   = () => new Date().toISOString().split('T')[0];
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };

export default function FinancesClient({ initial, initialRates }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initial);
  const [rates, setRates]     = useState<ExchangeRate[]>(initialRates);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(monthStart());
  const [dateTo, setDateTo]     = useState(todayStr());

  const currentRate = rates[0]?.rate ?? 1;
  const cats        = form.type === 'ingreso' ? INCOME_CATS : EXPENSE_CATS;

  const filtered = transactions.filter((t) =>
    (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo)
  );

  const setPreset = (days: number | null | 'mes') => {
    if (days === null) { setDateFrom(''); setDateTo(''); return; }
    if (days === 'mes') { setDateFrom(monthStart()); setDateTo(todayStr()); return; }
    const d = new Date(); d.setDate(d.getDate() - days);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(todayStr());
  };

  const isPresetActive = (days: number | null | 'mes') => {
    if (days === null) return !dateFrom && !dateTo;
    if (days === 'mes') return dateFrom === monthStart() && dateTo === todayStr();
    const d = new Date(); d.setDate(d.getDate() - days);
    return dateFrom === d.toISOString().split('T')[0] && dateTo === todayStr();
  };

  const fmtUSD = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const fmtBOB = (n: number) =>
    `Bs. ${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const toDisplay = (amount: number, currency: Currency) =>
    currency === 'USD' ? fmtUSD(amount) : fmtBOB(amount);

  const incomeUSD   = filtered.filter((t) => t.type === 'ingreso' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const expensesUSD = filtered.filter((t) => t.type === 'gasto'   && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const balanceUSD  = incomeUSD - expensesUSD;

  const incomeBOB   = filtered.filter((t) => t.type === 'ingreso' && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const expensesBOB = filtered.filter((t) => t.type === 'gasto'   && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const balanceBOB  = incomeBOB - expensesBOB;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setOpen(true); };

  const openEdit = (t: Transaction) => {
    setForm({
      description: t.description, amount: String(t.amount),
      type: t.type, currency: t.currency, category: t.category, date: t.date,
    });
    setEditId(t.id);
    setOpen(true);
  };

  const closeModal = () => { setOpen(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.category) return;
    setSaving(true);
    if (editId) {
      const payload = {
        description: form.description.trim(), amount: parseFloat(form.amount),
        type: form.type, currency: form.currency, category: form.category, date: form.date,
      };
      setTransactions((prev) => prev.map((t) => t.id === editId ? { ...t, ...payload } : t));
      closeModal();
      setSaving(false);
      supabase.from('transactions').update(payload).eq('id', editId).select().single()
        .then(({ data }) => { if (data) setTransactions((prev) => prev.map((t) => t.id === editId ? data : t)); });
      return;
    } else {
      const isCambio = form.type === 'gasto' && form.currency === 'USD' && form.category === 'Cambio de moneda';
      if (isCambio) {
        const usd = parseFloat(form.amount);
        const { data, error } = await supabase.from('transactions').insert([
          { description: form.description.trim(), amount: usd, type: 'gasto',   currency: 'USD', category: 'Cambio de moneda', date: form.date },
          { description: form.description.trim(), amount: usd * currentRate,    type: 'ingreso', currency: 'BOB', category: 'Cambio de moneda', date: form.date },
        ]).select();
        if (!error && data) { setTransactions((prev) => [...data, ...prev]); closeModal(); }
      } else {
        const { data, error } = await supabase.from('transactions').insert([{
          description: form.description.trim(), amount: parseFloat(form.amount),
          type: form.type, currency: form.currency, category: form.category, date: form.date,
        }]).select().single();
        if (!error && data) { setTransactions((prev) => [data, ...prev]); closeModal(); }
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <ExchangeRateWidget
        current={rates[0] ?? null}
        history={rates}
        onUpdate={(r) => setRates((prev) => [r, ...prev])}
        onEditRate={(r) => setRates((prev) => prev.map((x) => x.id === r.id ? r : x))}
        onDeleteRate={(id) => setRates((prev) => prev.filter((x) => x.id !== id))}
      />

      {/* Filtro de fecha */}
      <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl p-3 mb-4 shadow-sm">
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
            {([{ label: 'Mes', days: 'mes' }, { label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '3m', days: 90 }, { label: 'Todo', days: null }] as { label: string; days: number | null | 'mes' }[]).map(({ label, days }) => (
              <button key={label} onClick={() => setPreset(days)}
                style={{
                  background: isPresetActive(days) ? 'var(--pink-bg)' : 'var(--btn-inactive)',
                  color: PINK,
                  border: `1px solid ${isPresetActive(days) ? 'var(--pink-border)' : BORDER}`,
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div style={{ border: `1px solid ${BORDER}`, background: 'var(--card)' }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
            <DollarSign size={12} /> Saldo USD
          </p>
          <div className="space-y-2">
            {[
              { label: 'Ingresos', val: fmtUSD(incomeUSD),   color: '#065f46', bg: '#d1fae5', bold: false },
              { label: 'Gastos',   val: fmtUSD(expensesUSD), color: '#991b1b', bg: '#fee2e2', bold: false },
              { label: 'Balance',  val: fmtUSD(balanceUSD),  color: balanceUSD >= 0 ? '#5b21b6' : '#9a3412', bg: balanceUSD >= 0 ? '#ede9fe' : '#fff7ed', bold: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{r.label}</span>
                <span className={`text-sm tabular-nums px-2 py-0.5 rounded-lg ${r.bold ? 'font-bold' : 'font-semibold'}`}
                  style={{ color: r.color, background: r.bg }}>
                  {r.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: `1px solid ${BORDER}`, background: 'var(--card)' }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
            <Banknote size={12} /> Saldo BOB
          </p>
          <div className="space-y-2">
            {[
              { label: 'Ingresos', val: fmtBOB(incomeBOB),   color: '#065f46', bg: '#d1fae5', bold: false },
              { label: 'Gastos',   val: fmtBOB(expensesBOB), color: '#991b1b', bg: '#fee2e2', bold: false },
              { label: 'Balance',  val: fmtBOB(balanceBOB),  color: balanceBOB >= 0 ? '#5b21b6' : '#9a3412', bg: balanceBOB >= 0 ? '#ede9fe' : '#fff7ed', bold: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{r.label}</span>
                <span className={`text-sm tabular-nums px-2 py-0.5 rounded-lg ${r.bold ? 'font-bold' : 'font-semibold'}`}
                  style={{ color: r.color, background: r.bg }}>
                  {r.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: PINK }}>Movimientos</h2>
        <button onClick={openAdd}
          style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity">
          <Plus size={15} /> Agregar
        </button>
      </div>

      {/* Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
          <Banknote size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{transactions.length === 0 ? 'Sin movimientos. ¡Registra tu primer ingreso!' : 'Sin movimientos en este rango de fechas.'}</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filtered.map((t) => (
              <div key={t.id} style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }}
                className="rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{t.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {t.category} · {format(parseISO(t.date), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <p className="font-bold tabular-nums text-sm"
                      style={{ color: t.type === 'ingreso' ? 'var(--green-fg)' : 'var(--red-fg)' }}>
                      {t.type === 'ingreso' ? '+' : '-'}{toDisplay(t.amount, t.currency)}
                    </p>
                    <p className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                      ≈ {t.type === 'ingreso' ? '+' : '-'}{t.currency === 'BOB' ? fmtUSD(t.amount / currentRate) : fmtBOB(t.amount * currentRate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span style={{ background: t.type === 'ingreso' ? 'var(--c-green)' : 'var(--pink-bg)', color: t.type === 'ingreso' ? 'var(--green-fg)' : 'var(--pink)' }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {t.type === 'ingreso' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {t.type}
                  </span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(t)} style={{ color: 'var(--muted)' }} className="hover:opacity-70 transition-opacity">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--muted)' }} className="hover:opacity-70 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div style={{ border: `1px solid ${BORDER}` }} className="hidden sm:block rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--table-header)' }}>
                <tr>
                  {['Tipo', 'Descripción', 'Categoría', 'Fecha', 'Monto', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {filtered.map((t) => (
                  <tr key={t.id} className="group hover:bg-pink-50 transition-colors">
                    <td className="px-4 py-3">
                      <span style={{ background: t.type === 'ingreso' ? 'var(--c-green)' : 'var(--pink-bg)', color: t.type === 'ingreso' ? 'var(--green-fg)' : 'var(--pink)' }}
                        className="flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold">
                        {t.type === 'ingreso' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>{t.description}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{t.category}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                      {format(parseISO(t.date), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold tabular-nums text-sm"
                          style={{ color: t.type === 'ingreso' ? 'var(--green-fg)' : 'var(--red-fg)' }}>
                          {t.type === 'ingreso' ? '+' : '-'}{toDisplay(t.amount, t.currency)}
                        </p>
                        {t.currency === 'BOB' && (
                          <p className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                            ≈ {t.type === 'ingreso' ? '+' : '-'}{fmtUSD(t.amount / currentRate)}
                          </p>
                        )}
                        {t.currency === 'USD' && (
                          <p className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                            ≈ {t.type === 'ingreso' ? '+' : '-'}{fmtBOB(t.amount * currentRate)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(t)} style={{ color: 'var(--muted)' }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-70 transition-opacity">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--muted)' }}
                          className="hover:opacity-70 transition-opacity">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)' }}>
          <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: PINK }}>
                {editId ? 'Editar Movimiento' : 'Nuevo Movimiento'}
              </h3>
              <button onClick={closeModal} style={{ color: 'var(--muted)' }} className="hover:opacity-70"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {(['ingreso', 'gasto'] as TransactionType[]).map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t, category: '' })}
                    style={{ background: form.type === t ? 'var(--pink-bg)' : 'var(--btn-inactive)', color: PINK, border: `1px solid ${form.type === t ? 'var(--pink-border)' : BORDER}` }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {t === 'ingreso' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {t === 'ingreso' ? 'Ingreso' : 'Gasto'}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Moneda</label>
                <div className="flex gap-2">
                  {(['USD', 'BOB'] as Currency[]).map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, currency: c })}
                      style={{ background: form.currency === c ? 'var(--pink-bg)' : 'var(--btn-inactive)', color: PINK, border: `1px solid ${form.currency === c ? 'var(--pink-border)' : BORDER}` }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all">
                      <DollarSign size={13} />{c}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: 'Descripción', key: 'description', type: 'text', placeholder: '' },
                { label: `Monto (${form.currency})`, key: 'amount', type: 'number', placeholder: '0.00' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>{label}</label>
                  <input type={type} value={(form as any)[key]} placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
                </div>
              ))}

              {form.amount && parseFloat(form.amount) > 0 && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--btn-inactive)', color: 'var(--muted)', border: `1px solid ${BORDER}` }}>
                  ≈ {form.currency === 'USD'
                    ? fmtBOB(parseFloat(form.amount) * currentRate)
                    : fmtUSD(parseFloat(form.amount) / currentRate)}
                  {' '}(TC: {currentRate} BOB/USD)
                </p>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white">
                  <option value="">Seleccionar...</option>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Fecha</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={closeModal}
                style={{ border: `1px solid ${BORDER}`, color: 'var(--muted)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.description || !form.amount || !form.category}
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
