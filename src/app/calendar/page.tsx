import { supabase } from '@/lib/supabase';
import CalendarClient from '@/components/Calendar/CalendarClient';
import PageHeader from '@/components/Layout/PageHeader';
import { CalendarDays } from 'lucide-react';

export const revalidate = 0;

export default async function CalendarPage() {
  const [{ data: transactions }, { data: goals }, { data: goalActions }, { data: weightEntries }, { data: diaryEntries }] = await Promise.all([
    supabase.from('transactions').select('*'),
    supabase.from('goals').select('*'),
    supabase.from('goal_actions').select('*'),
    supabase.from('weight_entries').select('*').neq('notes', '__target__'),
    supabase.from('diary_entries').select('*'),
  ]);
  return (
    <div>
      <PageHeader icon={CalendarDays} title="Calendario" subtitle="Tus movimientos y fechas meta" />
      <CalendarClient
        transactions={transactions ?? []}
        goals={goals ?? []}
        goalActions={goalActions ?? []}
        weightEntries={weightEntries ?? []}
        diaryEntries={diaryEntries ?? []}
      />
    </div>
  );
}
