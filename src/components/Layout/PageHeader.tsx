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
        style={{ background: '#FFD6E0' }}>
        <Icon size={20} style={{ color: '#7D3050' }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#7D3050' }}>{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: '#D4A0B0' }}>{subtitle}</p>
      </div>
    </div>
  );
}
