'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { SITE_URL } from '@/config/site';

export default function IngresarPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Arranca en true si la URL trae `?code=` o `?error=` (venimos del
  // magic link) para no mostrar el formulario en flash mientras se
  // resuelve el canje de sesión más abajo.
  const [resolvingRedirect, setResolvingRedirect] = useState(false);

  // `createBrowserClient` (@supabase/ssr) usa flowType 'pkce' por
  // defecto. Con PKCE, el magic link no deja la sesión lista en el hash
  // de la URL (como hacía el flujo implícito viejo) — deja un `?code=...`
  // en el query string que HAY que canjear explícitamente llamando a
  // `exchangeCodeForSession`. En un sitio con servidor eso vive en una
  // ruta `/auth/callback`; acá, al ser `output: 'export'` (estático, sin
  // servidor), no existía ninguna ruta ni código que hiciera ese canje —
  // el usuario volvía del mail, caía en `/ingresar/?code=...` y se
  // quedaba sin sesión para siempre, sin ningún error visible. Este
  // efecto es el canje que faltaba, corriendo client-side en la misma
  // página a la que apunta `emailRedirectTo` más abajo.
  //
  // Supabase también puede volver con `?error=...&error_description=...`
  // en vez de `?code=...` (ej.: link vencido o ya usado) — ese caso se
  // muestra como error en vez de intentar canjear nada.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const redirectError = url.searchParams.get('error_description') || url.searchParams.get('error');

    if (!code && !redirectError) return;

    setResolvingRedirect(true);

    const cleanUrl = () => {
      url.searchParams.delete('code');
      url.searchParams.delete('error');
      url.searchParams.delete('error_code');
      url.searchParams.delete('error_description');
      window.history.replaceState({}, '', url.toString());
    };

    if (redirectError) {
      setError(decodeURIComponent(redirectError.replace(/\+/g, ' ')));
      cleanUrl();
      setResolvingRedirect(false);
      return;
    }

    supabase.auth.exchangeCodeForSession(code!).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setError(exchangeError.message);
      }
      cleanUrl();
      setResolvingRedirect(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${SITE_URL}/ingresar/` },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  if (resolvingRedirect) {
    return (
      <div style={{ padding: 32, maxWidth: 400, margin: '0 auto' }}>
        <h1>Ingresar</h1>
        <p>Confirmando el acceso...</p>
      </div>
    );
  }

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
      {sent ? (
        <p>Te mandamos un link a {email}. Abrilo para entrar.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }}
          />
          <button type="submit">Enviar link de acceso</button>
          {error && <p style={{ color: '#c0392b' }}>{error}</p>}
        </form>
      )}
    </div>
  );
}
