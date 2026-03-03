import { supabase } from '@/lib/supabase';
import DiaryClient from '@/components/Diary/DiaryClient';
import PageHeader from '@/components/Layout/PageHeader';
import { BookHeart } from 'lucide-react';

export const revalidate = 0;

export default async function DiaryPage() {
  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .order('date', { ascending: false });

  return (
    <div>
      <PageHeader icon={BookHeart} title="Mi Diario" subtitle="Tus pensamientos y cómo te sentiste cada día" />
      <DiaryClient initial={data ?? []} />
    </div>
  );
}
