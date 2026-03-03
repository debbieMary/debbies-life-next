'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Wallet, Target, CalendarDays, Menu, X, Sparkles, Scale, BookHeart } from 'lucide-react';

const BG     = '#FFD6E0';
const TEXT   = '#7D3050';
const ACTIVE = 'rgba(125,48,80,0.10)';

const navLinks = [
  { href: '/',         label: 'Resumen',    icon: LayoutDashboard },
  { href: '/finances', label: 'Finanzas',   icon: Wallet },
  { href: '/goals',    label: 'Objetivos',  icon: Target },
  { href: '/weight',   label: 'Peso',       icon: Scale },
  { href: '/diary',    label: 'Diario',     icon: BookHeart },
  { href: '/calendar', label: 'Calendario', icon: CalendarDays },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav style={{ background: BG, borderBottom: '1px solid #f5b8cc' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2" style={{ color: TEXT }}>
            <Sparkles size={18} />
            <span className="font-bold text-base tracking-tight">Debbie's Life Dashboard</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                style={{ color: TEXT, background: pathname === href ? ACTIVE : 'transparent' }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-70">
                <Icon size={15} />{label}
              </Link>
            ))}
          </div>

          <button className="md:hidden p-2 rounded-lg" style={{ color: TEXT }}
            onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-3 space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} style={{ color: TEXT }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-70"
                onClick={() => setOpen(false)}>
                <Icon size={15} />{label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
