'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { SITE_URL } from '@/config/site';

export default function IngresarPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // FIX (14/09/2026): antes no se pasaba `emailRedirectTo`, así que
    // Supabase usaba el "Site URL" configurado en su Dashboard — que
    // apuntaba a la raíz de hnk375561-lab.github.io en vez de
    // /Sin-Frenos/ (el sitio es un "project page" de GitHub Pages, vive
    // en un subpath). Resultado: el link del mail siempre daba 404.
    // SITE_URL ya trae el subpath correcto en producción (lo setea
    // deploy-pages.yml vía NEXT_PUBLIC_SITE_URL en build time). Esto
    // TAMBIÉN requiere agregar esta URL a la lista de "Redirect URLs"
    // permitidas en Supabase Dashboard → Authentication → URL
    // Configuration, o Supabase la va a rechazar igual y volver a caer
    // en el Site URL por defecto.
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

  // Ya hay sesión: no tiene sentido mostrar el formulario de login de
  // nuevo (y evita que alguien logueado mande otro magic link sin darse
  // cuenta). El logout vive en el ícono del Header, no acá.
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
