import { supabase } from '@/lib/supabase';
import FinancesClient from '@/components/Finances/FinancesClient';
import PageHeader from '@/components/Layout/PageHeader';
import { Wallet } from 'lucide-react';

export const revalidate = 0;

export default async function FinancesPage() {
  const [{ data: transactions }, { data: rates }] = await Promise.all([
    supabase.from('transactions').select('*').order('date', { ascending: false }),
    supabase.from('exchange_rates').select('*').order('date', { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader icon={Wallet} title="Mis Finanzas" subtitle="Registra tus ingresos y gastos en USD o BOB" />
      <FinancesClient initial={transactions ?? []} initialRates={rates ?? []} />
    </div>
  );
}
