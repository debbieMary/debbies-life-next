import { supabase } from '@/lib/supabase';
import DashboardClient from '@/components/Dashboard/DashboardClient';

export const revalidate = 0;

export default async function DashboardPage() {
  const [{ data: transactions }, { data: goals }, { data: goalActions }, { data: rates }, { data: weightEntries }, { data: weightTarget }, { data: diaryEntries }] = await Promise.all([
    supabase.from('transactions').select('*').order('date', { ascending: false }),
    supabase.from('goals').select('*').order('created_at', { ascending: false }),
    supabase.from('goal_actions').select('*'),
    supabase.from('exchange_rates').select('*').order('date', { ascending: false }),
    supabase.from('weight_entries').select('*').neq('notes', '__target__').order('date', { ascending: true }),
    supabase.from('weight_entries').select('weight').eq('notes', '__target__').single(),
    supabase.from('diary_entries').select('*').order('date', { ascending: false }),
  ]);

  return (
    <DashboardClient
      transactions={transactions ?? []}
      goals={goals ?? []}
      goalActions={goalActions ?? []}
      rates={rates ?? []}
      weightEntries={weightEntries ?? []}
      weightTarget={weightTarget?.weight ?? null}
      diaryEntries={diaryEntries ?? []}
    />
  );
}
