'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Heart, LogOut, Pause, Play, Search, SkipBack, SkipForward, Volume2, X } from 'lucide-react'
import VinylVisualizer from './vinyl-visualizer'

interface Track { id: number; title: string; artist: string; album: string; cover: string; audio: string }
interface User { name: string; email: string }
interface ITunesSong { trackId: number; trackName: string; artistName: string; collectionName?: string; artworkUrl100?: string; previewUrl?: string }

const tracks: Track[] = [
  { id: 1, title: 'Neon Horizon', artist: 'Lumina Collective', album: 'Digital Ethereal', cover: 'https://images.unsplash.com/photo-1611339555312-e607c4352fd7?w=500&h=500&fit=crop', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Silica Waves', artist: 'Lumina Collective', album: 'Digital Ethereal', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd8f2c91?w=500&h=500&fit=crop', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Fractal Dream', artist: 'Lumina Collective', album: 'Digital Ethereal', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Velocity Zero', artist: 'Lumina Collective', album: 'Digital Ethereal', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
]

export default function MusicPlayer({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [liked, setLiked] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [externalTrack, setExternalTrack] = useState<Track | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const track = externalTrack ?? tracks[index]

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100 }, [volume])
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const ended = () => { setExternalTrack(null); setIndex((value) => (value + 1) % tracks.length) }
    const failed = () => { setIsPlaying(false); setError('This track could not be loaded. Please try another track.') }
    audio.addEventListener('timeupdate', updateTime); audio.addEventListener('loadedmetadata', updateDuration); audio.addEventListener('ended', ended); audio.addEventListener('error', failed)
    return () => { audio.removeEventListener('timeupdate', updateTime); audio.removeEventListener('loadedmetadata', updateDuration); audio.removeEventListener('ended', ended); audio.removeEventListener('error', failed) }
  }, [])
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0); setDuration(0); setError(''); audio.load()
    if (isPlaying) audio.play().catch(() => { setIsPlaying(false); setError('Playback was blocked. Press play to try again.') })
  }, [track.audio])
  const togglePlay = async () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) { try { await audio.play(); setIsPlaying(true); setError('') } catch { setError('Playback was blocked. Press play to try again.') } } else { audio.pause(); setIsPlaying(false) } }
  const changeTrack = (next: number) => { setExternalTrack(null); setIndex((next + tracks.length) % tracks.length); setIsPlaying(true) }
  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    setIsSearching(true); setSearchError('')
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=12`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json() as { results: ITunesSong[] }
      const found = data.results.filter((song) => song.previewUrl).map((song) => ({ id: song.trackId, title: song.trackName, artist: song.artistName, album: song.collectionName ?? 'Single', cover: song.artworkUrl100?.replace('100x100', '600x600') ?? '/placeholder.jpg', audio: song.previewUrl as string }))
      setResults(found)
      if (!found.length) setSearchError('No playable previews found. Try another artist or song.')
    } catch { setSearchError('Search is unavailable right now. Check your internet connection and try again.') }
    finally { setIsSearching(false) }
  }
  const playSearchResult = (result: Track) => { setExternalTrack(result); setIsPlaying(true); setError('') }
  const seek = (value: number) => { if (audioRef.current) { audioRef.current.currentTime = value; setCurrentTime(value) } }
  const time = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
  const progress = duration ? (currentTime / duration) * 100 : 0

  return <div className="flex min-h-screen bg-background text-foreground">
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-6 md:flex md:flex-col"><div className="text-2xl font-black text-[#1db954]">echora</div><nav className="mt-10 space-y-2 text-sm"><p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Menu</p><button className="w-full rounded-md bg-[#1db954]/15 px-3 py-2 text-left font-semibold text-[#1ed760]">Home</button><button className="w-full rounded-md px-3 py-2 text-left hover:bg-secondary">Explore</button><button className="w-full rounded-md px-3 py-2 text-left hover:bg-secondary">Your Library</button></nav><button onClick={onLogout} className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-white"><LogOut className="h-4 w-4" /> Log out</button></aside>
    <main className="flex min-w-0 flex-1 flex-col"><header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-8"><form onSubmit={search} className="relative w-full max-w-md"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artists or songs worldwide" className="w-full rounded-full border border-border bg-secondary/50 py-2 pl-9 pr-4 text-sm outline-none focus:border-[#1db954]" /></form><div className="flex items-center gap-3"><div className="hidden text-right text-sm sm:block"><p className="font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">Free account</p></div><button onClick={onLogout} className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:border-white hover:text-white"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Log out</span></button><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#1db954] font-bold text-black sm:flex">{user.name.charAt(0).toUpperCase()}</div></div></header>
      {results.length > 0 || isSearching || searchError ? <section className="border-b border-border bg-[#181818] px-5 py-5 md:px-8"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">Search results {query && `for “${query}”`}</h2><p className="text-xs text-muted-foreground">Worldwide music previews powered by iTunes</p></div><button onClick={() => { setResults([]); setSearchError('') }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white"><X className="h-4 w-4" /> Close</button></div>{isSearching && <p className="text-sm text-muted-foreground">Finding music…</p>}{searchError && <p className="text-sm text-red-400">{searchError}</p>}<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{results.map((result) => <button key={result.id} onClick={() => playSearchResult(result)} className="flex min-w-0 items-center gap-3 rounded-lg bg-secondary/60 p-2 text-left hover:bg-secondary"><img src={result.cover} alt="" className="h-12 w-12 rounded object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{result.title}</span><span className="block truncate text-xs text-muted-foreground">{result.artist}</span><span className="block truncate text-xs text-[#1ed760]">Play 30 sec preview</span></span></button>)}</div></section> : null}
      <div className="grid flex-1 gap-6 overflow-auto p-5 lg:grid-cols-3 lg:p-8"><section className="rounded-2xl bg-gradient-to-br from-[#263b30] to-card p-6 lg:col-span-1"><p className="text-sm font-semibold text-muted-foreground">FEATURED ALBUM</p><img src={track.cover} alt={track.album} className="mx-auto my-7 aspect-square w-48 rounded-xl object-cover shadow-2xl" /><h1 className="text-center text-2xl font-black">{track.album}</h1><p className="mt-2 text-center text-sm text-muted-foreground">{track.artist}</p><p className="mt-5 text-center text-xs text-muted-foreground">{externalTrack ? 'Search result' : `${tracks.length} tracks`}</p></section><section className="min-h-[380px] lg:col-span-1"><VinylVisualizer currentTrack={track} isPlaying={isPlaying} /></section><section className="rounded-2xl bg-card p-5 lg:col-span-1"><p className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Queue</p><div className="space-y-2">{tracks.map((item, itemIndex) => <button key={item.id} onClick={() => changeTrack(itemIndex)} className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${!externalTrack && itemIndex === index ? 'bg-[#1db954]/15 ring-1 ring-[#1db954]/60' : 'hover:bg-secondary'}`}><img src={item.cover} alt="" className="h-11 w-11 rounded object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.artist}</span></span>{!externalTrack && itemIndex === index && isPlaying && <span className="text-xs text-[#1ed760]">PLAYING</span>}</button>)}</div></section></div>
      <footer className="border-t border-border bg-card px-5 py-4 md:px-8"><audio ref={audioRef} src={track.audio} preload="metadata" /><div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground"><span>{time(currentTime)}</span><input aria-label="Seek through track" type="range" min="0" max={duration || 0} value={currentTime} onChange={(event) => seek(Number(event.target.value))} className="h-1 flex-1 cursor-pointer accent-[#1db954]" /><span>{time(duration)}</span></div>{error && <p className="mb-2 text-center text-xs text-red-400">{error}</p>}<div className="flex items-center justify-center gap-4"><button onClick={() => setLiked(!liked)} aria-label="Like track" className={liked ? 'text-[#1ed760]' : 'text-muted-foreground'}><Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} /></button><button onClick={() => changeTrack(index - 1)} aria-label="Previous track"><SkipBack /></button><button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1db954] text-black transition hover:scale-105">{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-0.5" />}</button><button onClick={() => changeTrack(index + 1)} aria-label="Next track"><SkipForward /></button><label className="hidden items-center gap-2 text-muted-foreground sm:flex"><Volume2 className="h-5 w-5" /><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-[#1db954]" /></label></div></footer>
    </main>
  </div>
}
