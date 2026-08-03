'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Check, Compass, Heart, Home, Library, ListMusic, LogOut, Pause, Play, Plus, Search, SkipBack, SkipForward, Trash2, Volume2, X } from 'lucide-react'
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
  const [queue, setQueue] = useState<Track[]>(tracks)
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [playlistReady, setPlaylistReady] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [history, setHistory] = useState<Track[]>([])
  const [historyReady, setHistoryReady] = useState(false)
  const [activeView, setActiveView] = useState<'home' | 'explore' | 'library'>('home')
  const audioRef = useRef<HTMLAudioElement>(null)
  const track = externalTrack ?? queue[index] ?? tracks[0]

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`echora-playlist-${user.email}`)
      if (saved) setPlaylist(JSON.parse(saved) as Track[])
    } catch {
      setPlaylist([])
    } finally {
      setPlaylistReady(true)
    }
  }, [user.email])
  useEffect(() => {
    if (playlistReady) window.localStorage.setItem(`echora-playlist-${user.email}`, JSON.stringify(playlist))
  }, [playlist, playlistReady, user.email])
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`echora-history-${user.email}`)
      if (saved) setHistory(JSON.parse(saved) as Track[])
    } catch {
      setHistory([])
    } finally {
      setHistoryReady(true)
    }
  }, [user.email])
  useEffect(() => {
    if (historyReady) window.localStorage.setItem(`echora-history-${user.email}`, JSON.stringify(history))
  }, [history, historyReady, user.email])
  useEffect(() => {
    if (isPlaying) setHistory((items) => [track, ...items.filter((item) => item.id !== track.id)].slice(0, 12))
  }, [isPlaying, track])

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
  const changeTrack = (next: number) => {
    if (!queue.length) return
    setExternalTrack(null); setIndex((next + queue.length) % queue.length); setIsPlaying(true)
  }
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
  const addToPlaylist = () => { if (!playlist.some((item) => item.id === track.id)) setPlaylist((items) => [...items, track]) }
  const removeFromPlaylist = (id: number) => setPlaylist((items) => items.filter((item) => item.id !== id))
  const clearHistory = () => setHistory([])
  const removeFromQueue = (id: number) => {
    const removedIndex = queue.findIndex((item) => item.id === id)
    const nextQueue = queue.filter((item) => item.id !== id)
    setQueue(nextQueue)
    if (!externalTrack && removedIndex === index) {
      setIsPlaying(false)
      setIndex(nextQueue.length ? Math.min(index, nextQueue.length - 1) : 0)
    } else if (!externalTrack && removedIndex < index) setIndex((value) => value - 1)
  }
  const seek = (value: number) => { if (audioRef.current) { audioRef.current.currentTime = value; setCurrentTime(value) } }
  const time = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
  const progress = duration ? (currentTime / duration) * 100 : 0

  return <div className="flex min-h-screen bg-[#090a0b] text-foreground">
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#101112] p-4 md:flex md:flex-col"><div className="flex items-center gap-2 px-3 pt-2 text-2xl font-black tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1db954] text-black"><ListMusic className="h-5 w-5" /></span>echora</div><nav className="mt-10 space-y-1.5 text-sm"><p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Discover</p>{([['home', 'Home', Home], ['explore', 'Explore', Compass], ['library', 'Your Library', Library]] as const).map(([view, label, Icon]) => <button key={view} onClick={() => setActiveView(view)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold transition ${activeView === view ? 'bg-[#1db954] text-black shadow-lg shadow-[#1db954]/15' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav><div className="mt-8 rounded-2xl border border-[#1db954]/20 bg-[#1db954]/[0.07] p-4"><p className="text-xs font-bold text-[#73e49b]">LISTEN WITHOUT LIMITS</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Discover music, build your queue, and make it yours.</p></div><button onClick={onLogout} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition hover:bg-white/[0.05] hover:text-white"><LogOut className="h-4 w-4" /> Log out</button></aside>
    <main className="flex min-w-0 flex-1 flex-col"><header className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#101112]/70 px-5 py-4 backdrop-blur-xl md:px-8"><form onSubmit={search} className="relative w-full max-w-xl"><Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artists, albums, or songs" className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-[#1db954] focus:ring-4 focus:ring-[#1db954]/10" /></form><div className="flex items-center gap-3"><div className="hidden text-right text-sm sm:block"><p className="font-semibold">{user.name}</p><p className="text-xs text-[#73e49b]">Free listener</p></div><div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#1db954] font-bold text-black sm:flex">{user.name.charAt(0).toUpperCase()}</div><button onClick={onLogout} className="rounded-xl border border-white/10 p-2.5 text-muted-foreground transition hover:border-white/30 hover:text-white" aria-label="Log out"><LogOut className="h-4 w-4" /></button></div></header>
      {activeView === 'explore' || results.length > 0 || isSearching || searchError ? <section className="border-b border-border bg-[#181818] px-5 py-5 md:px-8"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">{activeView === 'explore' && !query ? 'Explore music worldwide' : `Search results ${query && `for “${query}”`}`}</h2><p className="text-xs text-muted-foreground">Search any artist, song, or album to play previews</p></div>{results.length > 0 && <button onClick={() => { setResults([]); setSearchError('') }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white"><X className="h-4 w-4" /> Close</button>}</div>{isSearching && <p className="text-sm text-muted-foreground">Finding music…</p>}{searchError && <p className="text-sm text-red-400">{searchError}</p>}{activeView === 'explore' && !results.length && !isSearching && !searchError && <p className="text-sm text-muted-foreground">Use the search bar above to discover music from around the world.</p>}<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{results.map((result) => <button key={result.id} onClick={() => playSearchResult(result)} className="flex min-w-0 items-center gap-3 rounded-lg bg-secondary/60 p-2 text-left hover:bg-secondary"><img src={result.cover} alt="" className="h-12 w-12 rounded object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{result.title}</span><span className="block truncate text-xs text-muted-foreground">{result.artist}</span><span className="block truncate text-xs text-[#1ed760]">Play 30 sec preview</span></span></button>)}</div></section> : null}
      {activeView === 'library' ? <section className="flex flex-1 items-center justify-center p-8 text-center"><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10"><Library className="mx-auto mb-4 h-12 w-12 text-[#1db954]" /><h1 className="text-2xl font-black">Your Library</h1><p className="mt-2 max-w-sm text-sm text-muted-foreground">Your queue has {queue.length} {queue.length === 1 ? 'track' : 'tracks'}. Search for music and play it whenever you want.</p><button onClick={() => setActiveView('home')} className="mt-6 rounded-xl bg-[#1db954] px-6 py-2.5 text-sm font-bold text-black transition hover:bg-[#58d979]">Back to Home</button></div></section> : <div className="grid flex-1 gap-5 overflow-auto bg-[radial-gradient(circle_at_50%_0%,rgba(29,185,84,0.08),transparent_35%)] p-5 lg:grid-cols-3 lg:p-8"><section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#244e36] via-[#163622] to-[#101312] p-6 lg:col-span-1"><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#1db954]/15 blur-2xl" /><p className="relative text-[11px] font-bold tracking-[0.18em] text-[#75e8a0]">FEATURED ALBUM</p><img src={track.cover} alt={track.album} className="relative mx-auto my-7 aspect-square w-52 rounded-2xl object-cover shadow-2xl shadow-black/50 ring-1 ring-white/20" /><h1 className="relative text-center text-2xl font-black">{track.album}</h1><p className="relative mt-2 text-center text-sm text-muted-foreground">{track.artist}</p><p className="relative mt-5 text-center text-xs text-[#75e8a0]">{externalTrack ? 'Search result' : `${queue.length} tracks in queue`}</p></section><section className="min-h-[380px] lg:col-span-1"><VinylVisualizer currentTrack={track} isPlaying={isPlaying} /></section><section className="rounded-3xl border border-white/10 bg-[#121313] p-5 lg:col-span-1"><div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Up next</p><p className="mt-1 text-sm font-bold">Your queue</p></div>{queue.length > 0 && <button onClick={() => { setQueue([]); setIndex(0); setIsPlaying(false) }} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /> Clear</button>}</div>{queue.length ? <div className="space-y-2">{queue.map((item, itemIndex) => <div key={item.id} className={`flex items-center gap-2 rounded-xl p-2 transition ${!externalTrack && itemIndex === index ? 'bg-[#1db954]/15 ring-1 ring-[#1db954]/50' : 'hover:bg-white/[0.05]'}`}><button onClick={() => changeTrack(itemIndex)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><img src={item.cover} alt="" className="h-11 w-11 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.artist}</span></span></button><button onClick={() => removeFromQueue(item.id)} aria-label={`Remove ${item.title} from queue`} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"><X className="h-4 w-4" /></button></div>)}</div> : <p className="py-10 text-center text-sm text-muted-foreground">Your queue is empty.</p>}</section></div>}
      <div className="border-t border-white/10 bg-[#0d0e0f] px-5 py-3 md:px-8"><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setShowPlaylist((visible) => !visible)} className="text-left text-xs font-semibold text-muted-foreground transition hover:text-white"><span className="text-[#75e8a0]">My Playlist</span> · {playlist.length} {playlist.length === 1 ? 'song' : 'songs'} saved <span className="ml-1 text-[10px] text-muted-foreground">{showPlaylist ? '▲ Hide' : '▼ View'}</span></button><button onClick={addToPlaylist} disabled={playlist.some((item) => item.id === track.id)} className="flex shrink-0 items-center gap-2 rounded-lg border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-2 text-xs font-bold text-[#75e8a0] transition hover:bg-[#1db954]/20 disabled:cursor-default disabled:opacity-70">{playlist.some((item) => item.id === track.id) ? <><Check className="h-4 w-4" /> Saved</> : <><Plus className="h-4 w-4" /> Add current song</>}</button></div>{showPlaylist && <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">{playlist.length ? playlist.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2"><button onClick={() => playSearchResult(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><img src={item.cover} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.artist}</span></span></button><button onClick={() => removeFromPlaylist(item.id)} aria-label={`Remove ${item.title} from playlist`} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"><X className="h-4 w-4" /></button></div>) : <p className="py-3 text-sm text-muted-foreground">No saved songs yet. Add the song currently playing to start your playlist.</p>}</div>}</div>
      <footer className="border-t border-white/10 bg-[#101112]/95 px-5 py-3 backdrop-blur-xl md:px-8"><audio ref={audioRef} src={track.audio} preload="metadata" /><div className="mb-3 flex items-center gap-3 text-[11px] text-muted-foreground"><span>{time(currentTime)}</span><input aria-label="Seek through track" type="range" min="0" max={duration || 0} value={currentTime} onChange={(event) => seek(Number(event.target.value))} className="h-1 flex-1 cursor-pointer accent-[#1db954]" /><span>{time(duration)}</span></div>{error && <p className="mb-2 text-center text-xs text-red-400">{error}</p>}<div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><img src={track.cover} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="hidden min-w-0 sm:block"><span className="block truncate text-sm font-bold">{track.title}</span><span className="block truncate text-xs text-muted-foreground">{track.artist}</span></span></div><div className="flex items-center justify-center gap-3 sm:gap-4"><button onClick={() => setLiked(!liked)} aria-label="Like track" className={`transition hover:scale-110 ${liked ? 'text-[#1ed760]' : 'text-muted-foreground hover:text-white'}`}><Heart className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} /></button><button onClick={() => changeTrack(index - 1)} aria-label="Previous track" className="text-muted-foreground transition hover:text-white"><SkipBack /></button><button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1db954] text-black shadow-lg shadow-[#1db954]/20 transition hover:scale-105 hover:bg-[#58d979]">{isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-0.5" />}</button><button onClick={() => changeTrack(index + 1)} aria-label="Next track" className="text-muted-foreground transition hover:text-white"><SkipForward /></button></div><label className="hidden items-center gap-2 text-muted-foreground lg:flex"><Volume2 className="h-5 w-5" /><input aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-20 accent-[#1db954]" /></label></div></footer>
    </main>
    {activeView === 'library' && <aside className="fixed bottom-24 right-4 z-20 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#141516]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl md:bottom-6 md:right-6"><div className="mb-3 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#75e8a0]">Listening history</p><p className="mt-1 text-sm font-bold">Recently played</p></div><span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-muted-foreground">{history.length} songs</span></div>{history.length ? <div className="max-h-56 space-y-1 overflow-y-auto">{history.map((item) => <button key={item.id} onClick={() => playSearchResult(item)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]"><img src={item.cover} alt="" className="h-9 w-9 rounded-lg object-cover" /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.artist}</span></span></button>)}</div> : <p className="py-4 text-sm leading-5 text-muted-foreground">Play a song and it will appear here. Your history is restored after refresh.</p>}</aside>}
    {activeView === 'library' && history.length > 0 && <button type="button" onClick={clearHistory} className="fixed bottom-[4.5rem] right-6 z-30 rounded-lg border border-red-400/20 bg-[#141516] px-3 py-2 text-xs font-bold text-red-300 shadow-lg shadow-black/30 transition hover:border-red-400/50 hover:bg-red-500/10">Clear history</button>}
  </div>
}
