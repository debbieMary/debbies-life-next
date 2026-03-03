import { supabase } from '@/lib/supabase';
import PeriodClient from '@/components/Period/PeriodClient';
import PageHeader from '@/components/Layout/PageHeader';
import { Droplets } from 'lucide-react';

export const revalidate = 0;

export default async function PeriodPage() {
  const [{ data: entries }, { data: cycleLengths }] = await Promise.all([
    supabase.from('period_entries').select('*').order('start_date', { ascending: true }),
    supabase.from('period_cycle_lengths').select('*').order('recorded_at', { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader icon={Droplets} title="Tracker de Ciclo" subtitle="Registra tus períodos y predice el próximo" />
      <PeriodClient initial={entries ?? []} initialCycles={cycleLengths ?? []} />
    </div>
  );
}
