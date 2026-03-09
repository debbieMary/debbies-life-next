import { supabase } from '@/lib/supabase';
import GoalsClient from '@/components/Goals/GoalsClient';
import PageHeader from '@/components/Layout/PageHeader';
import { Target } from 'lucide-react';

export const revalidate = 0;

export default async function GoalsPage() {
  const [{ data: goals }, { data: actions }] = await Promise.all([
    supabase.from('goals').select('*').order('created_at', { ascending: false }),
    supabase.from('goal_actions').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader icon={Target} title="Mis Objetivos" subtitle="Tus metas con pasos para lograrlo" />
      <GoalsClient initial={goals ?? []} initialActions={actions ?? []} />
    </div>
  );
}
