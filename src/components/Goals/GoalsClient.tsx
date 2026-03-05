'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Goal, GoalAction, GoalCategory, ActionType } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus, X, CheckCircle2, Circle,
  Star, Laptop2, Flower2, Heart, Sparkles, Trash2, Target, Pencil,
  ThumbsUp, ThumbsDown, CalendarDays, Music2,
} from 'lucide-react';

const PINK   = 'var(--pink)';
const BORDER = 'var(--border)';

const CATEGORIES: { value: GoalCategory; label: string; Icon: any; color: string; iconColor: string; borderColor?: string }[] = [
  { value: 'influencer',   label: 'Influencer',   Icon: Star,     color: 'var(--pc-peach-bg)',  iconColor: '#9A6E3E'                                       },
  { value: 'programadora', label: 'Programadora', Icon: Laptop2,  color: 'var(--pc-lav-bg)',    iconColor: 'var(--pc-lav-text)'                            },
  { value: 'spa',          label: 'Mi Spa',       Icon: Flower2,  color: '#c8f0c8',             iconColor: '#169870'                                       },
  { value: 'salud',        label: 'Salud',        Icon: Heart,    color: '#FFD6E0',             iconColor: '#B06080'                                                },
  { value: 'baile',        label: 'Baile Fitness',Icon: Music2,   color: 'var(--pc-sky-bg)',    iconColor: 'var(--pc-sky-text)'                            },
  { value: 'otro',         label: 'Otro',         Icon: Sparkles, color: 'var(--pink-bg)',      iconColor: 'var(--pink)'                                          },
];

const emptyGoalForm   = { title: '', description: '', category: 'otro' as GoalCategory, target_date: '' };
const emptyActionForm = { title: '', type: 'buena' as ActionType, action_date: new Date().toISOString().split('T')[0], action_time: '' };

interface Props {
  initial: Goal[];
  initialActions: GoalAction[];
}

const gd7    = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; };
const gToday = () => new Date().toISOString().split('T')[0];

export default function GoalsClient({ initial, initialActions }: Props) {
  const [goals, setGoals]       = useState<Goal[]>(initial);
  const [actions, setActions]   = useState<GoalAction[]>(initialActions);
  const [saving, setSaving]     = useState(false);
  const [dateFrom, setDateFrom] = useState(gd7());
  const [dateTo,   setDateTo]   = useState(gToday());

  const setPreset = (days: number | null) => {
    if (days === null) { setDateFrom(''); setDateTo(''); return; }
    const d = new Date(); d.setDate(d.getDate() - days);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(gToday());
  };

  const isPresetActive = (days: number | null) => {
    if (days === null) return !dateFrom && !dateTo;
    const d = new Date(); d.setDate(d.getDate() - days);
    return dateFrom === d.toISOString().split('T')[0] && dateTo === gToday();
  };

  const [goalOpen, setGoalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const [detailGoal, setDetailGoal]           = useState<Goal | null>(null);
  const [actionForm, setActionForm]           = useState(emptyActionForm);
  const [editingAction, setEditingAction]     = useState<GoalAction | null>(null);
  const [showActionForm, setShowActionForm]   = useState(false);

  const openAddGoal = () => { setGoalForm(emptyGoalForm); setEditGoal(null); setGoalOpen(true); };

  const openEditGoal = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setGoalForm({ title: goal.title, description: goal.description, category: goal.category, target_date: goal.target_date ?? '' });
    setEditGoal(goal);
    setGoalOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.title.trim()) return;
    setSaving(true);
    if (editGoal) {
      const { data } = await supabase.from('goals').update({
        title: goalForm.title.trim(), description: goalForm.description.trim(),
        category: goalForm.category, target_date: goalForm.target_date || null,
      }).eq('id', editGoal.id).select().single();
      if (data) {
        setGoals((prev) => prev.map((g) => g.id === editGoal.id ? data : g));
        if (detailGoal?.id === editGoal.id) setDetailGoal(data);
      }
    } else {
      const { data } = await supabase.from('goals').insert([{
        title: goalForm.title.trim(), description: goalForm.description.trim(),
        category: goalForm.category, target_date: goalForm.target_date || null, completed: false,
      }]).select().single();
      if (data) setGoals((prev) => [...prev, data]);
    }
    setGoalForm(emptyGoalForm); setEditGoal(null); setGoalOpen(false);
    setSaving(false);
  };

  const handleDeleteGoal = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await supabase.from('goals').delete().eq('id', id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setActions((prev) => prev.filter((a) => a.goal_id !== id));
    if (detailGoal?.id === id) setDetailGoal(null);
  };

  const handleToggleGoal = async (goal: Goal, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const { data } = await supabase.from('goals')
      .update({ completed: !goal.completed }).eq('id', goal.id).select().single();
    if (data) {
      setGoals((prev) => prev.map((g) => g.id === goal.id ? data : g));
      if (detailGoal?.id === goal.id) setDetailGoal(data);
    }
  };

  const startAddAction = () => { setEditingAction(null); setActionForm(emptyActionForm); setShowActionForm(true); };

  const startEditAction = (action: GoalAction) => {
    setEditingAction(action);
    setActionForm({
      title: action.title, type: action.type,
      action_date: action.action_date ?? new Date().toISOString().split('T')[0],
      action_time: action.action_time ?? '',
    });
    setShowActionForm(true);
  };

  const cancelActionForm = () => { setShowActionForm(false); setEditingAction(null); setActionForm(emptyActionForm); };

  const handleSaveAction = async () => {
    if (!detailGoal || !actionForm.title.trim()) return;
    setSaving(true);
    const payload = {
      title: actionForm.title.trim(), type: actionForm.type,
      action_date: actionForm.action_date || null,
      action_time: actionForm.action_time || null,
    };
    if (editingAction) {
      const { data } = await supabase.from('goal_actions').update(payload)
        .eq('id', editingAction.id).select().single();
      if (data) setActions((prev) => prev.map((a) => a.id === editingAction.id ? data : a));
    } else {
      const { data } = await supabase.from('goal_actions').insert([{
        ...payload, goal_id: detailGoal.id, completed: false,
      }]).select().single();
      if (data) setActions((prev) => [...prev, data]);
    }
    cancelActionForm();
    setSaving(false);
  };

  const handleToggleAction = async (action: GoalAction) => {
    const { data } = await supabase.from('goal_actions')
      .update({ completed: !action.completed }).eq('id', action.id).select().single();
    if (data) setActions((prev) => prev.map((a) => a.id === action.id ? data : a));
  };

  const handleDeleteAction = async (id: string) => {
    await supabase.from('goal_actions').delete().eq('id', id);
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const actionsForGoal = (goalId: string) => actions.filter((a) =>
    a.goal_id === goalId &&
    (!dateFrom || !a.action_date || a.action_date >= dateFrom) &&
    (!dateTo   || !a.action_date || a.action_date <= dateTo)
  );

  const fmtAction = (action: GoalAction) => {
    const parts = [];
    if (action.action_date) parts.push(format(parseISO(action.action_date), 'dd MMM', { locale: es }));
    if (action.action_time) parts.push(action.action_time.slice(0, 5));
    return parts.join(' · ');
  };

  return (
    <div>
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
            {[{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '3m', days: 90 }, { label: 'Todo', days: null }].map(({ label, days }) => (
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
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Filtra las acciones de cada objetivo por fecha</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold" style={{ color: PINK }}>Mis Objetivos</h2>
        <button onClick={openAddGoal}
          style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity">
          <Plus size={15} /> Agregar
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin objetivos aún. ¡Agrega tu primero!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {goals.map((goal) => {
            const cat         = CATEGORIES.find(c => c.value === goal.category)!;
            const goalActions = actionsForGoal(goal.id);
            const goodCount   = goalActions.filter(a => a.type === 'buena').length;
            const badCount    = goalActions.filter(a => a.type === 'mala').length;
            return (
              <div key={goal.id}
                onClick={() => { setDetailGoal(goal); setShowActionForm(false); cancelActionForm(); }}
                style={{ background: 'var(--card)', border: `1px solid ${goal.completed ? '#86efac' : BORDER}`, cursor: 'pointer', flex: '1 1 280px', maxWidth: '360px' }}
                className="rounded-2xl shadow-sm hover:shadow-md transition-all p-4">

                <div className="flex items-start gap-2 mb-2">
                  <button onClick={(e) => handleToggleGoal(goal, e)} className="mt-0.5 flex-shrink-0">
                    {goal.completed
                      ? <CheckCircle2 size={18} style={{ color: 'var(--green-fg)' }} />
                      : <Circle size={18} style={{ color: 'var(--muted)' }} />}
                  </button>
                  <p className="text-sm font-semibold flex-1 leading-tight" style={{ color: 'var(--text)', textDecoration: goal.completed ? 'line-through' : 'none' }}>
                    {goal.title}
                  </p>
                  <button onClick={(e) => openEditGoal(goal, e)} className="flex-shrink-0 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={(e) => handleDeleteGoal(goal.id, e)} className="flex-shrink-0 hover:opacity-70" style={{ color: 'var(--muted)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>

                {goal.description && (
                  <p className="text-xs ml-6 mb-2 line-clamp-2" style={{ color: 'var(--muted)' }}>{goal.description}</p>
                )}

                <div className="ml-6 flex items-center gap-3 flex-wrap mb-1">
                  <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: cat.color, color: cat.iconColor }}>
                    <cat.Icon size={9} /> {cat.label}
                  </span>
                </div>

                <div className="ml-6 flex items-center gap-3 flex-wrap">
                  {goal.target_date && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-2)' }}>
                      <CalendarDays size={10} />
                      {format(parseISO(goal.target_date), 'dd MMM yyyy', { locale: es })}
                    </span>
                  )}
                  {(goodCount > 0 || badCount > 0) && (
                    <span className="flex items-center gap-2 text-xs">
                      {goodCount > 0 && <span className="flex items-center gap-0.5" style={{ color: 'var(--green-fg)' }}><ThumbsUp size={10} /> {goodCount}</span>}
                      {badCount  > 0 && <span className="flex items-center gap-0.5" style={{ color: 'var(--red-fg)' }}><ThumbsDown size={10} /> {badCount}</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailGoal && (() => {
        const goalActions = actionsForGoal(detailGoal.id);
        const goodActions = goalActions.filter(a => a.type === 'buena');
        const badActions  = goalActions.filter(a => a.type === 'mala');
        const cat         = CATEGORIES.find(c => c.value === detailGoal.category)!;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--overlay)' }}>
            <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }}
              className="rounded-2xl shadow-xl w-full max-w-md">

              <div className="overflow-y-auto p-6" style={{ maxHeight: '90vh' }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat.color }}>
                    <cat.Icon size={16} style={{ color: cat.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleGoal(detailGoal)}>
                        {detailGoal.completed
                          ? <CheckCircle2 size={18} style={{ color: 'var(--green-fg)' }} />
                          : <Circle size={18} style={{ color: 'var(--muted)' }} />}
                      </button>
                      <h3 className="text-base font-bold flex-1" style={{ color: PINK, textDecoration: detailGoal.completed ? 'line-through' : 'none' }}>
                        {detailGoal.title}
                      </h3>
                    </div>
                    {detailGoal.description && (
                      <p className="text-xs mt-1 ml-6" style={{ color: 'var(--muted)' }}>{detailGoal.description}</p>
                    )}
                    {detailGoal.target_date && (
                      <p className="text-xs mt-0.5 ml-6 flex items-center gap-1" style={{ color: 'var(--muted-2)' }}>
                        <CalendarDays size={10} />
                        {format(parseISO(detailGoal.target_date), "dd 'de' MMMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={(e) => openEditGoal(detailGoal, e)} style={{ color: 'var(--muted)' }} className="hover:opacity-70"><Pencil size={14} /></button>
                    <button onClick={(e) => handleDeleteGoal(detailGoal.id, e)} style={{ color: 'var(--muted)' }} className="hover:opacity-70"><Trash2 size={14} /></button>
                    <button onClick={() => { setDetailGoal(null); cancelActionForm(); }} style={{ color: 'var(--muted)' }} className="hover:opacity-70 ml-1"><X size={18} /></button>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${BORDER}` }} className="pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--green-fg)' }}>
                      <ThumbsUp size={12} /> Buenas ({goodActions.length})
                    </p>
                    {goodActions.length === 0 && !showActionForm && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin acciones buenas aún</p>
                    )}
                    <div className="space-y-1.5">
                      {goodActions.map((action) => (
                        <div key={action.id} className="flex items-center gap-2 group">
                          <button onClick={() => handleToggleAction(action)} className="flex-shrink-0">
                            {action.completed
                              ? <CheckCircle2 size={15} style={{ color: 'var(--green-fg)' }} />
                              : <Circle size={15} style={{ color: '#86efac' }} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: 'var(--text)', textDecoration: action.completed ? 'line-through' : 'none', opacity: action.completed ? 0.5 : 1 }}>
                              {action.title}
                            </p>
                            {fmtAction(action) && <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmtAction(action)}</p>}
                          </div>
                          <button onClick={() => startEditAction(action)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }}><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteAction(action.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--red-fg)' }}>
                      <ThumbsDown size={12} /> Malas ({badActions.length})
                    </p>
                    {badActions.length === 0 && !showActionForm && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>Sin acciones malas aún</p>
                    )}
                    <div className="space-y-1.5">
                      {badActions.map((action) => (
                        <div key={action.id} className="flex items-center gap-2 group">
                          <button onClick={() => handleToggleAction(action)} className="flex-shrink-0">
                            {action.completed
                              ? <CheckCircle2 size={15} style={{ color: 'var(--red-fg)' }} />
                              : <Circle size={15} style={{ color: '#fca5a5' }} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: 'var(--text)', textDecoration: action.completed ? 'line-through' : 'none', opacity: action.completed ? 0.5 : 1 }}>
                              {action.title}
                            </p>
                            {fmtAction(action) && <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmtAction(action)}</p>}
                          </div>
                          <button onClick={() => startEditAction(action)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }}><Pencil size={12} /></button>
                          <button onClick={() => handleDeleteAction(action.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }}><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {showActionForm ? (
                    <div style={{ background: 'var(--btn-inactive)', border: `1px solid ${BORDER}` }} className="rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: PINK }}>
                        {editingAction ? 'Editar acción' : 'Nueva acción'}
                      </p>
                      <div className="flex gap-2">
                        {(['buena', 'mala'] as ActionType[]).map((t) => (
                          <button key={t} onClick={() => setActionForm({ ...actionForm, type: t })}
                            style={{
                              background: actionForm.type === t ? (t === 'buena' ? '#d1fae5' : '#fee2e2') : 'var(--card)',
                              color: t === 'buena' ? '#16a34a' : '#dc2626',
                              border: `1px solid ${actionForm.type === t ? (t === 'buena' ? '#6ee7b7' : '#fca5a5') : BORDER}`,
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all">
                            {t === 'buena' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
                            {t === 'buena' ? 'Buena' : 'Mala'}
                          </button>
                        ))}
                      </div>
                      <input value={actionForm.title} onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                        placeholder="Descripción *"
                        style={{ border: `1px solid ${BORDER}`, color: 'var(--text)', background: 'var(--input)' }}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={actionForm.action_date} onChange={(e) => setActionForm({ ...actionForm, action_date: e.target.value })}
                          style={{ border: `1px solid ${BORDER}`, color: 'var(--text)', background: 'var(--input)' }}
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200" />
                        <input type="time" value={actionForm.action_time} onChange={(e) => setActionForm({ ...actionForm, action_time: e.target.value })}
                          style={{ border: `1px solid ${BORDER}`, color: 'var(--text)', background: 'var(--input)' }}
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={cancelActionForm}
                          style={{ border: `1px solid ${BORDER}`, color: 'var(--muted)' }}
                          className="flex-1 py-1.5 rounded-xl text-xs font-semibold hover:opacity-70">Cancelar</button>
                        <button onClick={handleSaveAction} disabled={saving || !actionForm.title.trim()}
                          style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
                          className="flex-1 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 hover:opacity-80">
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={startAddAction}
                      style={{ border: `1px dashed ${BORDER}`, color: 'var(--muted)' }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm hover:opacity-70 transition-opacity">
                      <Plus size={13} /> Nueva acción
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Goal form modal */}
      {goalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay)' }}>
          <div style={{ background: 'var(--card)', border: `1px solid ${BORDER}` }} className="rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold" style={{ color: PINK }}>
                {editGoal ? 'Editar Objetivo' : 'Nuevo Objetivo'}
              </h3>
              <button onClick={() => setGoalOpen(false)} style={{ color: 'var(--muted)' }} className="hover:opacity-70"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Título *</label>
                <input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)', background: 'var(--input)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Descripción</label>
                <textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  rows={2} style={{ border: `1px solid ${BORDER}`, color: 'var(--text)', background: 'var(--input)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200 resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(({ value, label, Icon, color, iconColor, borderColor }) => (
                    <button key={value} onClick={() => setGoalForm({ ...goalForm, category: value })}
                      style={{ background: goalForm.category === value ? color : 'var(--btn-inactive)', border: `1px solid ${borderColor ?? iconColor}` }}
                      className="py-2 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1">
                      <Icon size={14} style={{ color: iconColor }} />
                      <span style={{ color: iconColor }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1 block" style={{ color: 'var(--muted)' }}>Fecha meta</label>
                <input type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                  style={{ border: `1px solid ${BORDER}`, color: 'var(--text)', background: 'var(--input)' }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-200" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setGoalOpen(false)}
                style={{ border: `1px solid ${BORDER}`, color: 'var(--muted)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold hover:opacity-70">Cancelar</button>
              <button onClick={handleSaveGoal} disabled={saving || !goalForm.title.trim()}
                style={{ background: 'var(--pink-bg)', color: PINK, border: '1px solid var(--pink-border)' }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-80 transition-opacity">
                {saving ? 'Guardando...' : editGoal ? 'Guardar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
