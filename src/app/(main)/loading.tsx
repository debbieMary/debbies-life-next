import { Flower2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', gap: '1.25rem',
    }}>

      {/* Ícono animado */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--pink-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'flotar 2.5s ease-in-out infinite',
      }}>
        <Flower2 size={30} color="var(--pink)" />
      </div>

      {/* Texto */}
      <div style={{ textAlign: 'center', lineHeight: 1.5 }}>
        <p style={{ margin: 0, color: 'var(--pink)', fontSize: '1.1rem', fontWeight: 700, opacity: 0.7 }}>
          Cargando...
        </p>
      </div>

      {/* Puntitos */}
      <div style={{ display: 'flex', gap: 7 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--pink-border)', display: 'inline-block',
            animation: 'saltar 1.3s ease-in-out infinite',
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes flotar {
          0%, 100% { transform: translateY(0);    }
          50%       { transform: translateY(-8px); }
        }
        @keyframes saltar {
          0%, 80%, 100% { transform: translateY(0);     opacity: 0.35; }
          40%            { transform: translateY(-9px); opacity: 1;    }
        }
      `}</style>
    </div>
  );
}
