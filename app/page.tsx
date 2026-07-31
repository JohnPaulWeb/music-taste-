'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Disc3, Eye, EyeOff, Headphones, Mail, Music2, UserRound } from 'lucide-react'
import MusicPlayer from '@/components/music-player'

type Mode = 'login' | 'signup'

interface Account {
  name: string
  email: string
}

const storageKey = 'echora-account'

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null)
  const [mode, setMode] = useState<Mode>('signup')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedAccount = window.localStorage.getItem(storageKey)
    if (savedAccount) {
      try {
        setAccount(JSON.parse(savedAccount) as Account)
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }
  }, [])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

    const nextAccount = { name: mode === 'signup' ? name : email.split('@')[0], email }
    window.localStorage.setItem(storageKey, JSON.stringify(nextAccount))
    setAccount(nextAccount)
  }

  if (account) {
    return <MusicPlayer user={account} onLogout={() => { window.localStorage.removeItem(storageKey); setAccount(null) }} />
  }

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
            <button className="mt-2 h-12 w-full rounded-full bg-[#1db954] font-bold text-black transition hover:scale-[1.02] hover:bg-[#1ed760]">{mode === 'signup' ? 'Sign up' : 'Log in'}</button>
          </form>
          <div className="my-8 flex items-center gap-3 text-xs text-zinc-500 before:h-px before:flex-1 before:bg-zinc-700 after:h-px after:flex-1 after:bg-zinc-700">OR</div>
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }} className="w-full rounded-full border border-zinc-500 px-6 py-3 text-sm font-bold transition hover:border-white hover:scale-[1.02]">{mode === 'signup' ? 'Log in to your account' : 'Sign up for Echora'}</button>
          <p className="mt-8 text-center text-xs leading-5 text-zinc-500">This demo stores only your display name and email in this browser. It does not create a server account.</p>
        </div>
      </section>
    </main>
  )
}
