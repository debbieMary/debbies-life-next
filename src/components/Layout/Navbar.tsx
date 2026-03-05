'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Wallet, Target, CalendarDays, Menu, X, Sparkles, Scale, BookHeart, Droplets, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const navLinks = [
  { href: '/',         label: 'Resumen',    icon: LayoutDashboard },
  { href: '/finances', label: 'Finanzas',   icon: Wallet },
  { href: '/goals',    label: 'Objetivos',  icon: Target },
  { href: '/weight',   label: 'Peso',       icon: Scale },
  { href: '/diary',    label: 'Diario',     icon: BookHeart },
  { href: '/period',   label: 'Ciclo',      icon: Droplets },
  { href: '/calendar', label: 'Calendario', icon: CalendarDays },
];

interface NavbarProps {
  nombre?: string;
}

export default function Navbar({ nombre }: NavbarProps) {
  const pathname         = usePathname();
  const router           = useRouter();
  const { dark, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [popover, setPopover]   = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const inicial = nombre?.charAt(0).toUpperCase() ?? '';

  return (
    <nav style={{ background: 'var(--pink-bg)', borderBottom: '1px solid var(--pink-border)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          <div className="flex items-center gap-2" style={{ color: 'var(--pink)' }}>
            <Sparkles size={18} />
            <span className="font-bold text-base tracking-tight">Debbie's Life Dashboard</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                style={{ color: 'var(--pink)', background: pathname === href ? 'var(--active-link)' : 'transparent' }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-70">
                <Icon size={15} />{label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={toggle} title={dark ? 'Modo claro' : 'Modo oscuro'}
              style={{
                color: 'var(--pink)', background: 'transparent',
                border: '1px solid var(--pink-border)', borderRadius: 8,
                width: 32, height: 32, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {nombre && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setPopover(v => !v)}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: '#7D3050', color: '#fff', border: 'none',
                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: popover ? '0 0 0 3px rgba(125,48,80,0.2)' : 'none',
                    transition: 'box-shadow 0.15s',
                  }}>
                  {inicial}
                </button>

                {popover && (
                  <>
                    <div onClick={() => setPopover(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: 'var(--card)', borderRadius: 12,
                      boxShadow: 'var(--popover-shadow)',
                      border: '1px solid var(--pink-border)',
                      minWidth: 160, zIndex: 20, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ margin: 0, color: 'var(--pink)', fontWeight: 700, fontSize: '0.9rem' }}>{nombre}</p>
                      </div>
                      <button onClick={handleLogout}
                        style={{
                          width: '100%', padding: '0.7rem 1rem',
                          background: 'transparent', border: 'none',
                          color: 'var(--pink)', cursor: 'pointer', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontSize: '0.875rem', fontWeight: 600,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <LogOut size={15} />
                        Salir
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg" style={{ color: 'var(--pink)' }}
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 space-y-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} style={{ color: 'var(--pink)' }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-70"
                onClick={() => setMenuOpen(false)}>
                <Icon size={15} />{label}
              </Link>
            ))}
            <button onClick={toggle}
              style={{ color: 'var(--pink)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-70">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
              <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
            <button onClick={handleLogout}
              style={{ color: 'var(--pink)', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:opacity-70">
              <LogOut size={15} />
              <span>Salir</span>
              {nombre && <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{inicial}</span>}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
