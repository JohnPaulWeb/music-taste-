'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Disc3, Eye, EyeOff, Headphones, Mail, Music2, UserRound } from 'lucide-react'
import MusicPlayer from '@/components/music-player'
import { getSupabase } from '@/lib/supabase'

type Mode = 'login' | 'signup'

interface Account {
  name: string
  email: string
}

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null)
  const [mode, setMode] = useState<Mode>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('')

  useEffect(() => {
    const supabase = getSupabase()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setAccount({ name: String(user.user_metadata.name ?? user.email.split('@')[0]), email: user.email })
    })
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (mode === 'signup' && name.length < 2) {
      setError('Please enter a name with at least 2 characters.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Your password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const supabase = getSupabase()
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: window.location.origin,
          },
        })
        if (signUpError) throw signUpError

        if (data.session) {
          setAccount({ name, email })
        } else {
          setPendingConfirmationEmail(email)
          setMessage('Check your inbox to confirm your email address, then log in.')
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        setAccount({ name: String(data.user.user_metadata.name ?? email.split('@')[0]), email })
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to complete your request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resendConfirmation = async () => {
    if (!pendingConfirmationEmail) return

    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const { error: resendError } = await getSupabase().auth.resend({
        type: 'signup',
        email: pendingConfirmationEmail,
        options: { emailRedirectTo: window.location.origin },
      })
      if (resendError) throw resendError
      setMessage('A new confirmation email has been sent. Check spam or junk mail too.')
    } catch (resendFailure) {
      setError(resendFailure instanceof Error ? resendFailure.message : 'Unable to resend the confirmation email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (account) return <MusicPlayer user={account} onLogout={async () => { await getSupabase().auth.signOut(); setAccount(null) }} />

  return (
    <main className="min-h-screen bg-[#121212] text-white lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#1db954] via-[#169c46] to-[#063d20] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#b6ff42]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="relative flex items-center gap-2 text-2xl font-black tracking-tight"><Disc3 className="h-8 w-8" /> echora</div>
        <div className="relative max-w-lg">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-white/70">Your sound, your space</p>
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight">Music for every moment.</h1>
          <p className="mt-6 max-w-md text-lg leading-7 text-white/80">Discover your next favorite track, build playlists, and keep the music moving.</p>
        </div>
        <div className="relative flex gap-6 text-sm font-semibold text-white/80"><span className="flex items-center gap-2"><Music2 className="h-4 w-4" /> Curated picks</span><span className="flex items-center gap-2"><Headphones className="h-4 w-4" /> Listen anywhere</span></div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-center gap-2 text-2xl font-black lg:hidden"><Disc3 className="h-8 w-8 text-[#1db954]" /> echora</div>
          <h2 className="text-3xl font-extrabold tracking-tight">{mode === 'signup' ? 'Sign up for free' : 'Welcome back'}</h2>
          <p className="mt-2 text-sm text-zinc-400">{mode === 'signup' ? 'Start listening to music you love.' : 'Log in to continue to Echora.'}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'signup' && <label className="block"><span className="mb-2 block text-sm font-bold">Name</span><div className="relative"><UserRound className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" /><input name="name" required autoComplete="name" placeholder="What should we call you?" className="h-12 w-full rounded-md border border-zinc-600 bg-[#242424] pl-12 pr-4 outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" /></div></label>}
            <label className="block"><span className="mb-2 block text-sm font-bold">Email address</span><div className="relative"><Mail className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-zinc-500" /><input name="email" type="email" required autoComplete="email" placeholder="name@example.com" className="h-12 w-full rounded-md border border-zinc-600 bg-[#242424] pl-12 pr-4 outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" /></div></label>
            <label className="block"><span className="mb-2 block text-sm font-bold">Password</span><div className="relative"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 6 characters" className="h-12 w-full rounded-md border border-zinc-600 bg-[#242424] px-4 pr-12 outline-none transition placeholder:text-zinc-500 focus:border-white focus:ring-1 focus:ring-white" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 text-zinc-400 hover:text-white">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></label>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {message && <p role="status" className="text-sm text-[#1db954]">{message}</p>}
            {pendingConfirmationEmail && <button type="button" onClick={resendConfirmation} disabled={isSubmitting} className="text-sm font-semibold text-[#1db954] hover:text-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60">Resend confirmation email to {pendingConfirmationEmail}</button>}
            <button disabled={isSubmitting} className="mt-2 h-12 w-full rounded-full bg-[#1db954] font-bold text-black transition hover:scale-[1.02] hover:bg-[#1ed760] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}</button>
          </form>
          <div className="my-8 flex items-center gap-3 text-xs text-zinc-500 before:h-px before:flex-1 before:bg-zinc-700 after:h-px after:flex-1 after:bg-zinc-700">OR</div>
          <button type="button" onClick={() => setAccount({ name: 'Guest listener', email: 'guest@echora.local' })} className="w-full rounded-full border border-[#1db954] px-6 py-3 text-sm font-bold text-[#1db954] transition hover:scale-[1.02] hover:bg-[#1db954] hover:text-black">Continue as guest</button>
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setMessage('') }} className="w-full rounded-full border border-zinc-500 px-6 py-3 text-sm font-bold transition hover:border-white hover:scale-[1.02]">{mode === 'signup' ? 'Log in to your account' : 'Sign up for Echora'}</button>
          <p className="mt-8 text-center text-xs leading-5 text-zinc-500">Accounts are secured by Supabase. New members must confirm their email before logging in.</p>
        </div>
      </section>
    </main>
  )
}
