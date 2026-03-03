'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Transaction, TransactionType, Currency, ExchangeRate } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Plus, X, Trash2, DollarSign, Banknote, Pencil } from 'lucide-react';
import ExchangeRateWidget from './ExchangeRateWidget';

const PINK   = '#7D3050';
const BORDER = '#fce8ee';

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

const today7 = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; };
const todayStr = () => new Date().toISOString().split('T')[0];

export default function FinancesClient({ initial, initialRates }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>(initial);
  const [rates, setRates]     = useState<ExchangeRate[]>(initialRates);
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(today7());
  const [dateTo, setDateTo]     = useState(todayStr());

  const currentRate = rates[0]?.rate ?? 1;
  const cats        = form.type === 'ingreso' ? INCOME_CATS : EXPENSE_CATS;

  const filtered = transactions.filter((t) =>
    (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo)
  );

  const setPreset = (days: number | null) => {
    if (days === null) { setDateFrom(''); setDateTo(''); return; }
    const d = new Date(); d.setDate(d.getDate() - days);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(todayStr());
  };

  const fmtUSD = (n: number) =>
    n.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const fmtBOB = (n: number) =>
    `Bs. ${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const toDisplay = (amount: number, currency: Currency) =>
    currency === 'USD' ? fmtUSD(amount) : fmtBOB(amount);

  // USD wallet — puro USD (filtrado por rango)
  const incomeUSD   = filtered.filter((t) => t.type === 'ingreso' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const expensesUSD = filtered.filter((t) => t.type === 'gasto'   && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const balanceUSD  = incomeUSD - expensesUSD;

  // BOB wallet — puro BOB (filtrado por rango)
  const incomeBOB   = filtered.filter((t) => t.type === 'ingreso' && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const expensesBOB = filtered.filter((t) => t.type === 'gasto'   && t.currency === 'BOB').reduce((s, t) => s + t.amount, 0);
  const balanceBOB  = incomeBOB - expensesBOB;

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      currency: t.currency,
      category: t.category,
      date: t.date,
    });
    setEditId(t.id);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.category) return;
    setSaving(true);
    if (editId) {
      const { data, error } = await supabase.from('transactions')
        .update({
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          type: form.type,
          currency: form.currency,
          category: form.category,
          date: form.date,
        })
        .eq('id', editId)
        .select().single();
      if (!error && data) {
        setTransactions((prev) => prev.map((t) => t.id === editId ? data : t));
        closeModal();
      }
    } else {
      const isCambio = form.type === 'gasto' && form.currency === 'USD' && form.category === 'Cambio de moneda';
      if (isCambio) {
        const usd = parseFloat(form.amount);
        const { data, error } = await supabase.from('transactions').insert([
          { description: form.description.trim(), amount: usd, type: 'gasto',   currency: 'USD', category: 'Cambio de moneda', date: form.date },
          { description: form.description.trim(), amount: usd * currentRate,    type: 'ingreso', currency: 'BOB', category: 'Cambio de moneda', date: form.date },
        ]).select();
        if (!error && data) {
          setTransactions((prev) => [...data, ...prev]);
          closeModal();
        }
      } else {
        const { data, error } = await supabase.from('transactions').insert([{
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          type: form.type,
          currency: form.currency,
          category: form.category,
          date: form.date,
        }]).select().single();
        if (!error && data) {
          setTransactions((prev) => [data, ...prev]);
          closeModal();
        }
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
      {/* Exchange rate widget */}
      <ExchangeRateWidget
        current={rates[0] ?? null}
        history={rates}
        onUpdate={(r) => setRates((prev) => [r, ...prev])}
        onEditRate={(r) => setRates((prev) => prev.map((x) => x.id === r.id ? r : x))}
        onDeleteRate={(id) => setRates((prev) => prev.filter((x) => x.id !== id))}
      />

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
            {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '3m', days: 90 }, { label: 'Todo', days: null }].map(({ label, days }) => {
              const active = days === 7
                ? dateFrom === today7() && dateTo === todayStr()
                : days === 30
                  ? dateFrom === (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; })()
                  : days === 90
                    ? dateFrom === (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0]; })()
                    : !dateFrom && !dateTo;
              return (
                <button key={label} onClick={() => setPreset(days)}
                  style={{
                    background: active ? '#FFD6E0' : '#fff7f9',
                    color: PINK,
                    border: `1px solid ${active ? '#f5b8cc' : BORDER}`,
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all">
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resumen — dos wallets independientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* USD wallet */}
        <div style={{ border: `1px solid #fce8ee`, background: '#fff' }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#D4A0B0' }}>
            <DollarSign size={12} /> Saldo USD
          </p>
          <div className="space-y-2">
            {[
              { label: 'Ingresos', val: fmtUSD(incomeUSD),   color: '#065f46', bg: '#d1fae5', bold: false },
              { label: 'Gastos',   val: fmtUSD(expensesUSD), color: '#991b1b', bg: '#fee2e2', bold: false },
              { label: 'Balance',  val: fmtUSD(balanceUSD),  color: balanceUSD >= 0 ? '#5b21b6' : '#9a3412', bg: balanceUSD >= 0 ? '#ede9fe' : '#fff7ed', bold: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: '#D4A0B0' }}>{r.label}</span>
                <span className={`text-sm tabular-nums px-2 py-0.5 rounded-lg ${r.bold ? 'font-bold' : 'font-semibold'}`}
                  style={{ color: r.color, background: r.bg }}>
                  {r.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOB wallet */}
        <div style={{ border: `1px solid #fce8ee`, background: '#fff' }} className="rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#D4A0B0' }}>
            <Banknote size={12} /> Saldo BOB
          </p>
          <div className="space-y-2">
            {[
              { label: 'Ingresos', val: fmtBOB(incomeBOB),   color: '#065f46', bg: '#d1fae5', bold: false },
              { label: 'Gastos',   val: fmtBOB(expensesBOB), color: '#991b1b', bg: '#fee2e2', bold: false },
              { label: 'Balance',  val: fmtBOB(balanceBOB),  color: balanceBOB >= 0 ? '#5b21b6' : '#9a3412', bg: balanceBOB >= 0 ? '#ede9fe' : '#fff7ed', bold: true },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: '#D4A0B0' }}>{r.label}</span>
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
          style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity">
          <Plus size={15} /> Agregar
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#D4A0B0' }}>
          <Banknote size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{transactions.length === 0 ? 'Sin movimientos. ¡Registra tu primer ingreso!' : 'Sin movimientos en este rango de fechas.'}</p>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}` }} className="rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: '#fff7f9' }}>
              <tr>
                {['Tipo', 'Descripción', 'Categoría', 'Fecha', 'Monto', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#D4A0B0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: BORDER }}>
              {filtered.map((t) => (
                <tr key={t.id} className="group hover:bg-pink-50 transition-colors">
                  <td className="px-4 py-3">
                    <span style={{ background: t.type === 'ingreso' ? '#d1fae5' : '#fee2e2', color: t.type === 'ingreso' ? '#065f46' : '#991b1b' }}
                      className="flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold">
                      {t.type === 'ingreso' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#2a1520' }}>{t.description}</td>
                  <td className="px-4 py-3" style={{ color: '#D4A0B0' }}>{t.category}</td>
                  <td className="px-4 py-3" style={{ color: '#D4A0B0' }}>
                    {format(parseISO(t.date), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold tabular-nums text-sm"
                        style={{ color: t.type === 'ingreso' ? '#065f46' : '#991b1b' }}>
                        {t.type === 'ingreso' ? '+' : '-'}{toDisplay(t.amount, t.currency)}
                      </p>
                      {t.currency === 'BOB' && (
                        <p className="text-xs tabular-nums" style={{ color: '#D4A0B0' }}>
                          ≈ {t.type === 'ingreso' ? '+' : '-'}{fmtUSD(t.amount / currentRate)}
                        </p>
                      )}
                      {t.currency === 'USD' && (
                        <p className="text-xs tabular-nums" style={{ color: '#D4A0B0' }}>
                          ≈ {t.type === 'ingreso' ? '+' : '-'}{fmtBOB(t.amount * currentRate)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} style={{ color: '#D4A0B0' }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-70 transition-opacity">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} style={{ color: '#D4A0B0' }}
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
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(125,48,80,0.15)' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: PINK }}>
                {editId ? 'Editar Movimiento' : 'Nuevo Movimiento'}
              </h3>
              <button onClick={closeModal} style={{ color: '#D4A0B0' }} className="hover:opacity-70"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {/* Tipo */}
              <div className="flex gap-2">
                {(['ingreso', 'gasto'] as TransactionType[]).map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, type: t, category: '' })}
                    style={{ background: form.type === t ? '#FFD6E0' : '#fff7f9', color: PINK, border: `1px solid ${form.type === t ? '#f5b8cc' : BORDER}` }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {t === 'ingreso' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {t === 'ingreso' ? 'Ingreso' : 'Gasto'}
                  </button>
                ))}
              </div>

              {/* Moneda */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Moneda</label>
                <div className="flex gap-2">
                  {(['USD', 'BOB'] as Currency[]).map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, currency: c })}
                      style={{ background: form.currency === c ? '#FFD6E0' : '#fff7f9', color: PINK, border: `1px solid ${form.currency === c ? '#f5b8cc' : BORDER}` }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all">
                      <DollarSign size={13} />
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripcion y monto */}
              {[
                { label: 'Descripción', key: 'description', type: 'text', placeholder: '' },
                { label: `Monto (${form.currency})`, key: 'amount', type: 'number', placeholder: '0.00' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>{label}</label>
                  <input type={type} value={(form as any)[key]} placeholder={placeholder}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
                </div>
              ))}

              {/* Equivalencia en tiempo real */}
              {form.amount && parseFloat(form.amount) > 0 && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: '#fff7f9', color: '#D4A0B0', border: `1px solid ${BORDER}` }}>
                  ≈ {form.currency === 'USD'
                    ? fmtBOB(parseFloat(form.amount) * currentRate)
                    : fmtUSD(parseFloat(form.amount) / currentRate)}
                  {' '}(TC: {currentRate} BOB/USD)
                </p>
              )}

              {/* Categoria */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white">
                  <option value="">Seleccionar...</option>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: '#D4A0B0' }}>Fecha</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: '#2a1520' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 bg-white" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={closeModal}
                style={{ border: `1px solid ${BORDER}`, color: '#D4A0B0' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.description || !form.amount || !form.category}
                style={{ background: '#FFD6E0', color: PINK, border: '1px solid #f5b8cc' }}
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
