'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { SITE_URL } from '@/config/site'

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="marketplace-auth-page">
      <div className="marketplace-auth-orb marketplace-auth-orb-one" aria-hidden="true" />
      <div className="marketplace-auth-orb marketplace-auth-orb-two" aria-hidden="true" />
      <div className="marketplace-auth-card">
        <Link href="/" className="marketplace-auth-brand"><span aria-hidden="true">S</span> Sin Frenos</Link>
        {children}
      </div>
    </main>
  )
}

export default function IngresarPage() {
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolvingRedirect, setResolvingRedirect] = useState(() => {
    if (typeof window === 'undefined') return false
    const params = new URLSearchParams(window.location.search)
    return params.has('code') || params.has('error') || params.has('error_description')
  })

  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const redirectError = url.searchParams.get('error_description') || url.searchParams.get('error')
    if (!code && !redirectError) return
    const cleanUrl = () => {
      url.searchParams.delete('code')
      url.searchParams.delete('error')
      url.searchParams.delete('error_code')
      url.searchParams.delete('error_description')
      window.history.replaceState({}, '', url.toString())
    }
    const resolveSession = redirectError
      ? Promise.resolve({ error: { message: decodeURIComponent(redirectError.replace(/\+/g, ' ')) } })
      : supabase.auth.exchangeCodeForSession(code!)
    resolveSession.then(({ error: exchangeError }) => {
      if (exchangeError) setError(exchangeError.message)
      cleanUrl()
      setResolvingRedirect(false)
    }).catch((exchangeError: Error) => {
      setError(exchangeError?.message ?? 'No se pudo confirmar el acceso.')
      cleanUrl()
      setResolvingRedirect(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${SITE_URL}/ingresar/` },
    })
    if (signInError) setError(signInError.message)
    else setSent(true)
  }

  if (resolvingRedirect) {
    return <AuthShell><div className="marketplace-auth-status"><div className="marketplace-auth-spinner" aria-hidden="true" /><h1>Confirmando tu acceso</h1><p>Estamos preparando tu cuenta para que puedas comprar, vender, guardar favoritos y hablar con vendedores.</p></div></AuthShell>
  }

  if (!loading && user) {
    return <AuthShell><div className="marketplace-auth-status"><div className="marketplace-auth-success" aria-hidden="true">✓</div><p className="marketplace-auth-kicker">Cuenta activa</p><h1>Ya estás adentro.</h1><p>Sesión iniciada como <strong>{user.email}</strong>.</p><Link href="/listings" className="marketplace-auth-primary">Ver publicaciones <span aria-hidden="true">→</span></Link></div></AuthShell>
  }

  return (
    <AuthShell>
      <div className="marketplace-auth-heading"><p className="marketplace-auth-kicker">Entrá a tu marketplace</p><h1>Tu próximo vehículo empieza acá.</h1><p>Usamos un link seguro por email. Sin contraseña: entrá para guardar favoritos, contactar vendedores o publicar el tuyo.</p></div>
      {sent ? (
        <div className="marketplace-auth-sent"><div className="marketplace-auth-mail" aria-hidden="true">@</div><h2>Revisá tu bandeja de entrada</h2><p>Mandamos un link seguro a <strong>{email}</strong>. Abrilo desde cualquier dispositivo y vas a volver directo a Sin Frenos.</p><p className="marketplace-auth-muted">¿No lo ves? Revisá spam o promociones. El link puede tardar unos segundos.</p><button type="button" onClick={() => setSent(false)} className="marketplace-auth-secondary">Usar otro email</button></div>
      ) : (
        <form onSubmit={handleSubmit} className="marketplace-auth-form"><label htmlFor="auth-email">Tu email</label><input id="auth-email" type="email" required placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button type="submit" className="marketplace-auth-primary">Enviar link de acceso <span aria-hidden="true">↗</span></button>{error && <p role="alert" className="marketplace-auth-error">No pudimos enviar el link: {error}</p>}</form>
      )}
      <p className="marketplace-auth-footer">Al entrar aceptás usar Sin Frenos para comprar, vender y comunicarte de forma directa.</p>
    </AuthShell>
  )
}
