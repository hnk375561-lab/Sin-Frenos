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
  const [resolvingRedirect, setResolvingRedirect] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error') || params.has('error_description');
  });

  // `createBrowserClient` (@supabase/ssr) usa flowType 'implicit' (ver
  // src/lib/supabase/client.ts) precisamente por lo que pasaba antes acá:
  // con PKCE (el default de la librería) el magic link vuelve con
  // `?code=...` en el query string, y canjear ese code requiere el
  // "code_verifier" que quedó guardado en el localStorage del MISMO
  // navegador/perfil que pidió el link. Si el usuario abre el mail desde
  // otra app/navegador (lo normal: Gmail dispara el navegador por
  // defecto del sistema, no necesariamente el mismo que usaste para
  // pedir el acceso), ese navegador no tiene el verifier → el canje
  // falla, y como es un sitio `output: 'export'` (estático, sin
  // servidor ni ruta `/auth/callback`), no había ningún lado donde
  // recuperarse de eso: el usuario quedaba en `/ingresar/?code=...` para
  // siempre, sin sesión y sin ningún error visible.
  //
  // Con flujo implícito el magic link no lleva `?code=`, trae el token
  // directo en el fragment de la URL (`#access_token=...`) y el cliente
  // lo procesa solo al iniciar (`detectSessionInUrl`, true por
  // defecto) — no depende de nada guardado localmente, así que funciona
  // sin importar en qué navegador se abra. Este bloque de canje de
  // `?code=` queda como red de seguridad por si llega un link viejo
  // (emitido antes de este cambio) o si el proyecto vuelve a pkce más
  // adelante.
  //
  // Supabase también puede volver con `?error=...&error_description=...`
  // en vez de `?code=...` (ej.: link vencido o ya usado) — ese caso se
  // muestra como error en vez de intentar canjear nada.
  //
  // NOTA (fix lint react-hooks/set-state-in-effect): antes acá había un
  // `setResolvingRedirect(true)` justo al entrar al efecto. Se sacó
  // porque es redundante — el useState de arriba ya inicializa
  // `resolvingRedirect` en `true` leyendo la misma URL (`code`/`error`/
  // `error_description`) en el mismo mount, antes de que este efecto
  // corra. Llamar setState sincrónicamente ahí no cambiaba nada (el
  // estado ya era `true`) y disparaba el warning de renders en cascada.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const redirectError = url.searchParams.get('error_description') || url.searchParams.get('error');

    if (!code && !redirectError) return;

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

    supabase.auth
      .exchangeCodeForSession(code!)
      .then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
        }
        cleanUrl();
        setResolvingRedirect(false);
      })
      .catch((exchangeError: Error) => {
        // Sin este catch, si la promesa se rechaza en vez de resolver
        // con { error } (ej.: no hay code_verifier en este navegador),
        // el .then() de arriba nunca corre — la URL se queda con
        // `?code=...` para siempre y la página trabada en "Confirmando
        // el acceso..." sin ningún mensaje visible.
        setError(exchangeError?.message ?? 'No se pudo confirmar el acceso.');
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
