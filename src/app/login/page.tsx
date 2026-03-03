'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Flower2 } from 'lucide-react';

const BG   = '#FFD6E0';
const TEXT = '#7D3050';

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario]         = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasenia }),
      });
      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Error al iniciar sesión');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '2.5rem 2rem',
        width: '100%', maxWidth: 360,
        boxShadow: '0 8px 40px rgba(125,48,80,0.13), 0 2px 8px rgba(125,48,80,0.07)',
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: '1.75rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Flower2 size={26} color={TEXT} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, color: TEXT, fontSize: '1.3rem', fontWeight: 800 }}>Bienvenida</h1>
            <p style={{ margin: '2px 0 0', color: TEXT, fontSize: '0.82rem', opacity: 0.55, fontWeight: 500 }}>
              Debbie&apos;s Life Dashboard
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ color: TEXT, fontSize: '0.85rem', fontWeight: 600 }}>Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              required
              autoComplete="username"
              style={{
                padding: '0.6rem 0.8rem', borderRadius: 8,
                border: '1.5px solid #f5b8cc',
                background: '#fff7f9', color: TEXT,
                fontSize: '0.95rem', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ color: TEXT, fontSize: '0.85rem', fontWeight: 600 }}>Contraseña</label>
            <input
              type="password"
              value={contrasenia}
              onChange={e => setContrasenia(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                padding: '0.6rem 0.8rem', borderRadius: 8,
                border: '1.5px solid #f5b8cc',
                background: '#fff7f9', color: TEXT,
                fontSize: '0.95rem', outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem', padding: '0.7rem', borderRadius: 8,
              background: TEXT, color: '#fff',
              fontWeight: 700, fontSize: '0.95rem', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
              boxShadow: '0 4px 14px rgba(125,48,80,0.22)',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
