'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';

export default function IngresarPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setStep('code');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
    }
  };

  if (!loading && user) {
    return (
      <div style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
        <h1>Ingresar</h1>
        <p>Ya iniciaste sesión como {user.email}.</p>
        <p>
          <Link href="/">Volver al inicio</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
      <h1>Ingresar</h1>
      {step === 'email' ? (
        <form onSubmit={handleSendCode}>
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar código de acceso'}
          </button>
          {error && <p style={{ color: '#c0392b' }}>{error}</p>}
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <p>
            Te mandamos un código de 6 dígitos a {email}. Escribilo acá abajo (revisá también spam/promociones).
          </p>
          <input
            type="text"
            inputMode="numeric"
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12, fontSize: 20, letterSpacing: 4 }}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Verificando...' : 'Ingresar'}
          </button>
          {error && <p style={{ color: '#c0392b' }}>{error}</p>}
          <p>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError(null);
              }}
              style={{ background: 'none', border: 'none', color: '#555', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            >
              Usar otro email
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
