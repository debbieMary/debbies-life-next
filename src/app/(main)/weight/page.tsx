import { supabase } from '@/lib/supabase';
import WeightClient from '@/components/Weight/WeightClient';
import PageHeader from '@/components/Layout/PageHeader';
import { Scale } from 'lucide-react';

export const revalidate = 0;

export default async function WeightPage() {
  const { data } = await supabase
    .from('weight_entries')
    .select('*')
    .neq('notes', '__target__')
    .order('date', { ascending: true });

  const { data: targetData } = await supabase
    .from('weight_entries')
    .select('weight')
    .eq('notes', '__target__')
    .single();

  return (
    <div>
      <PageHeader icon={Scale} title="Tracker de Peso" subtitle="Registra tu progreso semana a semana" />
      <WeightClient initial={data ?? []} initialTarget={targetData?.weight ?? null} />
    </div>
  );
}
