import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export default function PageHeader({ icon: Icon, title, subtitle }: Props) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--pink-bg)' }}>
        <Icon size={20} style={{ color: 'var(--pink)' }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--pink)' }}>{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{subtitle}</p>
      </div>
    </div>
  );
}
