'use client';

import { DiaryEntry } from '@/types';
import { MOODS } from '@/components/Diary/DiaryClient';
import Link from 'next/link';
import { BookHeart } from 'lucide-react';

interface Props {
  entries:  DiaryEntry[];
  dateFrom: string;
  dateTo:   string;
}

export default function DiarySummary({ entries, dateFrom, dateTo }: Props) {
  const filtered = entries.filter((e) =>
    (!dateFrom || e.date >= dateFrom) && (!dateTo || e.date <= dateTo)
  );

  const counts = MOODS.map((m) => ({
    ...m,
    count: filtered.filter((e) => e.mood === m.value).length,
  })).filter((m) => m.count > 0);

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)' }} className="rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookHeart size={15} style={{ color: 'var(--muted)' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Mi Diario</h3>
        </div>
        <Link href="/diary"
          style={{ color: 'var(--pink)', border: '1px solid var(--border)' }}
          className="text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-70 transition-opacity">
          Ver todo
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <BookHeart size={32} style={{ color: 'var(--muted)', opacity: 0.3 }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sin entradas en este periodo</p>
        </div>
      ) : (
        <div>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
            {filtered.length} entrada{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {counts.map((m) => (
              <div key={m.value}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: m.bg }}>
                <m.Icon size={13} style={{ color: m.color }} />
                <span className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: m.color }}>{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
