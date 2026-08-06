"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Disc3,
  Heart,
  Home,
  Image as ImageIcon,
  Library,
  ListMusic,
  LogOut,
  Menu,
  Music,
  Music2,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import VinylVisualizer from "./vinyl-visualizer";

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  audio: string;
  durationSeconds?: number;
}
interface UserAccount {
  name: string;
  email: string;
}
interface ITunesSong {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

const defaultTracks: Track[] = [
  {
    id: 1,
    title: "Neon Horizon",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1611339555312-e607c4352fd7?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    durationSeconds: 372,
  },
  {
    id: 2,
    title: "Silica Waves",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1614613535308-eb5fbd8f2c91?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    durationSeconds: 423,
  },
  {
    id: 3,
    title: "Fractal Dream",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    durationSeconds: 345,
  },
  {
    id: 4,
    title: "Velocity Zero",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    durationSeconds: 310,
  },
];

const PRESET_AVATARS = [
  {
    name: "Vinyl Glow",
    url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
  },
  {
    name: "Headphones Studio",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
  },
  {
    name: "DJ Lights",
    url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
  },
  {
    name: "Cyberpunk Beats",
    url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&h=200&fit=crop",
  },
  {
    name: "Guitar Acoustic",
    url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&h=200&fit=crop",
  },
  {
    name: "Concert Stage",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop",
  },
];

export default function MusicPlayer({
  user,
  onLogout,
}: {
  user: UserAccount;
  onLogout: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [prevVolume, setPrevVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [error, setError] = useState("");

  // Profile & Custom Avatar State
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [customUrlInput, setCustomUrlInput] = useState<string>("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Settings State
  const [audioQuality, setAudioQuality] = useState("320kbps");
  const [eqPreset, setEqPreset] = useState("Bass Boost");
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [externalTrack, setExternalTrack] = useState<Track | null>(null);

  const [queue, setQueue] = useState<Track[]>(defaultTracks);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [playlistReady, setPlaylistReady] = useState(false);
  const [history, setHistory] = useState<Track[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "explore" | "library" | "playlist">(
    "home"
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const track = externalTrack ?? queue[index] ?? defaultTracks[0];

  // Load avatar & settings from localStorage
  useEffect(() => {
    try {
      const savedAvatar = window.localStorage.getItem(`echora-avatar-${user.email}`);
      if (savedAvatar) setAvatarUrl(savedAvatar);
      const savedSettings = window.localStorage.getItem(`echora-settings-${user.email}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.audioQuality) setAudioQuality(parsed.audioQuality);
        if (parsed.eqPreset) setEqPreset(parsed.eqPreset);
        if (typeof parsed.autoplayNext === "boolean") setAutoplayNext(parsed.autoplayNext);
      }
    } catch {
      // fallback defaults
    }
  }, [user.email]);

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save Avatar logic
  const handleSelectAvatar = (url: string) => {
    setAvatarUrl(url);
    try {
      window.localStorage.setItem(`echora-avatar-${user.email}`, url);
    } catch {
      // ignore
    }
    setShowAvatarModal(false);
  };

  const handleCustomAvatarSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    handleSelectAvatar(customUrlInput.trim());
    setCustomUrlInput("");
  };

  // Save Settings logic
  const handleSaveSettings = () => {
    try {
      window.localStorage.setItem(
        `echora-settings-${user.email}`,
        JSON.stringify({ audioQuality, eqPreset, autoplayNext })
      );
    } catch {
      // ignore
    }
    setSettingsSavedMessage("Settings saved successfully!");
    setTimeout(() => {
      setSettingsSavedMessage("");
      setShowSettingsModal(false);
    }, 1200);
  };

  // Sync playlist with localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`echora-playlist-${user.email}`);
      if (saved) setPlaylist(JSON.parse(saved) as Track[]);
    } catch {
      setPlaylist([]);
    } flex:
    setPlaylistReady(true);
  }, [user.email]);

  useEffect(() => {
    if (playlistReady) {
      window.localStorage.setItem(
        `echora-playlist-${user.email}`,
        JSON.stringify(playlist)
      );
    }
  }, [playlist, playlistReady, user.email]);

  // Sync history with localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`echora-history-${user.email}`);
      if (saved) setHistory(JSON.parse(saved) as Track[]);
    } catch {
      setHistory([]);
    } flex:
    setHistoryReady(true);
  }, [user.email]);

  useEffect(() => {
    if (historyReady) {
      window.localStorage.setItem(
        `echora-history-${user.email}`,
        JSON.stringify(history)
      );
    }
  }, [history, historyReady, user.email]);

  useEffect(() => {
    if (isPlaying && track) {
      setHistory((items) =>
        [track, ...items.filter((item) => item.id !== track.id)].slice(0, 15)
      );
    }
  }, [isPlaying, track]);

  // Audio volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Audio listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);

    const ended = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        void audio.play();
      } else if (isShuffle && queue.length > 1) {
        const randomIndex = Math.floor(Math.random() * queue.length);
        setExternalTrack(null);
        setIndex(randomIndex);
      } else if (autoplayNext) {
        setExternalTrack(null);
        setIndex((value) => (value + 1) % (queue.length || 1));
      } else {
        setIsPlaying(false);
      }
    };

    const failed = () => {
      setIsPlaying(false);
      setError("This audio track could not be loaded. Please select another track.");
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", failed);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", failed);
    };
  }, [isRepeat, isShuffle, autoplayNext, queue.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setDuration(0);
    setError("");
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
        setError("Playback was blocked. Click play to listen.");
      });
    }
  }, [track.audio]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        setError("");
      } catch {
        setError("Playback was blocked. Click play to resume.");
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const changeTrack = (next: number) => {
    if (!queue.length) return;
    setExternalTrack(null);
    setIndex((next + queue.length) % queue.length);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume || 50);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setIsSearching(true);
    setSearchError("");
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=16`
      );
      if (!response.ok) throw new Error("Search request failed");
      const data = (await response.json()) as { results: ITunesSong[] };
      const found = data.results
        .filter((song) => song.previewUrl)
        .map((song) => ({
          id: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          album: song.collectionName ?? "Single",
          cover:
            song.artworkUrl100?.replace("100x100", "600x600") ??
            "/placeholder.jpg",
          audio: song.previewUrl as string,
          durationSeconds: 30,
        }));
      setResults(found);
      if (!found.length) {
        setSearchError("No playable audio preview found for this query.");
      }
    } catch {
      setSearchError(
        "Unable to connect to search service. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const playSearchResult = (result: Track) => {
    setExternalTrack(result);
    setIsPlaying(true);
    setError("");
  };

  const addToPlaylist = () => {
    if (!playlist.some((item) => item.id === track.id)) {
      setPlaylist((items) => [...items, track]);
    }
  };

  const removeFromPlaylist = (id: number) => {
    setPlaylist((items) => items.filter((item) => item.id !== id));
  };

  const removeFromQueue = (id: number) => {
    const removedIndex = queue.findIndex((item) => item.id === id);
    const nextQueue = queue.filter((item) => item.id !== id);
    setQueue(nextQueue);
    if (!externalTrack && removedIndex === index) {
      setIsPlaying(false);
      setIndex(nextQueue.length ? Math.min(index, nextQueue.length - 1) : 0);
    } else if (!externalTrack && removedIndex < index) {
      setIndex((value) => value - 1);
    }
  };

  const seek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const navItems = [
    ["home", "Home Dashboard", Home],
    ["explore", "Explore Songs", Compass],
    ["library", "Your Library", Library],
    ["playlist", "My Playlist", ListMusic],
  ] as const;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090a0c] text-white antialiased">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col shrink-0 border-r border-white/10 bg-[#0d0e12]/95 backdrop-blur-2xl w-64">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center px-5 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-[#1db954] to-[#10b981] text-black shadow-lg shadow-[#1db954]/25">
              <Disc3 className="h-6 w-6 animate-spin-slow" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                echora
              </span>
              <span className="text-[10px] font-semibold text-[#75e8a0] tracking-widest uppercase">
                Studio HD
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500">
            Menu
          </p>
          {navItems.map(([view, label, Icon]) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#1db954] to-[#10b981] text-black font-bold shadow-lg shadow-[#1db954]/20 scale-[1.02]"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-black" : ""}`} />
                <span className="truncate">{label}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-black" />
                )}
              </button>
            );
          })}

          <div className="mt-8 rounded-2xl border border-[#1db954]/30 bg-gradient-to-br from-[#1db954]/15 via-black/40 to-transparent p-4 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#75e8a0]">
              <Sparkles className="h-4 w-4 text-[#1db954]" /> UNLIMITED AUDIO
            </div>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              Enjoy high-fidelity sound, zero audio ads, and custom visualizer.
            </p>
          </div>
        </nav>
      </aside>

      {/* MOBILE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative z-10 flex w-72 flex-col bg-[#0d0e12] border-r border-white/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2 font-black text-lg">
                <Disc3 className="h-6 w-6 text-[#1db954] animate-spin-slow" /> echora
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1db954] to-[#10b981] font-black text-black">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{user.name}</p>
                <p className="truncate text-xs text-[#75e8a0]">{user.email}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAvatarModal(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-white hover:bg-white/10"
              >
                <Camera className="h-3.5 w-3.5 text-[#1db954]" /> Avatar
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSettingsModal(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-white hover:bg-white/10"
              >
                <Settings className="h-3.5 w-3.5 text-[#1db954]" /> Settings
              </button>
            </div>

            <nav className="mt-6 space-y-1.5 flex-1">
              {navItems.map(([view, label, Icon]) => {
                const isActive = activeView === view;
                return (
                  <button
                    key={view}
                    onClick={() => {
                      setActiveView(view);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-[#1db954] text-black shadow-lg shadow-[#1db954]/20"
                        : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={onLogout}
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex flex-1 flex-col min-w-0 h-full pb-28 md:pb-0 relative z-0">
        {/* HEADER TOP BAR */}
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0d0e12]/95 px-4 sm:px-6 backdrop-blur-2xl">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 md:hidden hover:bg-white/10"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Instant Search Bar */}
          <form onSubmit={search} className="relative flex-1 max-w-lg">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search songs, artists..."
              className="w-full rounded-full border border-white/10 bg-white/[0.05] py-2 pl-10 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-[#1db954] focus:bg-black/60 focus:ring-4 focus:ring-[#1db954]/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearchError("");
                }}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          {/* User Profile Badge with Interactive Dropdown Menu */}
          <div className="relative z-50" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pl-3 transition hover:border-[#1db954]/50 hover:bg-white/[0.08]"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-[#75e8a0] font-medium">
                  {user.email}
                </p>
              </div>

              {/* Avatar Icon / Image */}
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-[#1db954] to-[#10b981] font-black text-black shadow-md shadow-[#1db954]/20 ring-2 ring-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0d0e12] bg-[#1db954]" />
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 hidden sm:block" />
            </button>

            {/* PROFILE DROPDOWN MENU */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-[100] w-64 rounded-2xl border border-white/20 bg-[#12141c] p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm font-extrabold text-white truncate">{user.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-[#1db954]/10 border border-[#1db954]/30 px-2 py-0.5 text-[10px] font-bold text-[#75e8a0]">
                    PRO LISTENER
                  </span>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setShowAvatarModal(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <Camera className="h-4 w-4 text-[#1db954]" />
                    <span>Change Avatar</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setShowSettingsModal(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <Settings className="h-4 w-4 text-[#1db954]" />
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* SEARCH RESULTS OVERLAY */}
        {(activeView === "explore" || results.length > 0 || isSearching || searchError) && (
          <section className="shrink-0 border-b border-white/10 bg-[#12141a]/95 px-4 py-4 sm:px-6 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Compass className="h-5 w-5 text-[#1db954]" />
                  {activeView === "explore" && !query
                    ? "Discover Global Music"
                    : `Search Results ${query ? `for "${query}"` : ""}`}
                </h2>
              </div>
              {results.length > 0 && (
                <button
                  onClick={() => {
                    setResults([]);
                    setSearchError("");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" /> Close
                </button>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center gap-2 py-3 text-xs sm:text-sm text-[#75e8a0]">
                <Disc3 className="h-4 w-4 animate-spin" /> Searching music library...
              </div>
            )}
            {searchError && (
              <p className="py-2 text-xs sm:text-sm text-red-400">{searchError}</p>
            )}

            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-56 overflow-y-auto pr-1">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => playSearchResult(result)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 transition hover:border-[#1db954]/50 hover:bg-white/[0.08]"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={result.cover}
                      alt={result.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-[#75e8a0]">
                      {result.title}
                    </p>
                    <p className="truncate text-[11px] sm:text-xs text-zinc-400">
                      {result.artist}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DASHBOARD CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === "playlist" ? (
            /* PLAYLIST VIEW */
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-[#1db954]/20 via-black/40 to-transparent p-5 sm:p-6 backdrop-blur-xl">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#75e8a0]">
                    Your Collection
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">My Playlist</h1>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                    {playlist.length} saved {playlist.length === 1 ? "track" : "tracks"}
                  </p>
                </div>
                <button
                  onClick={() => setActiveView("home")}
                  className="rounded-xl bg-[#1db954] px-4 py-2 text-xs sm:text-sm font-bold text-black hover:bg-[#58d979] transition"
                >
                  Dashboard
                </button>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {playlist.length ? (
                  playlist.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-[#1db954]/40 hover:bg-white/[0.06]"
                    >
                      <button
                        onClick={() => playSearchResult(item)}
                        className="flex flex-1 items-center gap-3 text-left min-w-0"
                      >
                        <img
                          src={item.cover}
                          alt=""
                          className="h-11 w-11 rounded-xl object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white group-hover:text-[#75e8a0]">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-zinc-400">
                            {item.artist}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => removeFromPlaylist(item.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center text-zinc-400">
                    <ListMusic className="mx-auto mb-3 h-10 w-10 text-[#1db954]" />
                    <p className="text-base font-bold text-white">No saved tracks yet</p>
                    <p className="mt-1 text-xs sm:text-sm">Add tracks while playing to build your custom playlist.</p>
                  </div>
                )}
              </div>
            </section>
          ) : activeView === "library" ? (
            /* LIBRARY VIEW */
            <section className="flex h-full items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 sm:p-8 text-center backdrop-blur-xl">
                <Library className="mx-auto mb-4 h-12 w-12 text-[#1db954]" />
                <h1 className="text-xl sm:text-2xl font-black text-white">Your Music Library</h1>
                <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  You have {queue.length} ready-to-play tracks in your queue.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveView("home")}
                    className="rounded-xl bg-[#1db954] px-6 py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-[#58d979] transition"
                  >
                    Go to Home
                  </button>
                </div>
              </div>
            </section>
          ) : (
            /* HOME DASHBOARD VIEW */
            <div className="space-y-6">
              {/* FEATURED HERO BANNER */}
              <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#163622] via-[#0e1f14] to-[#0a0c0e] p-5 sm:p-6 lg:p-8 shadow-2xl">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#1db954]/20 blur-3xl" />
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
                  <div className="space-y-2.5 max-w-lg">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-1 text-[11px] sm:text-xs font-bold text-[#75e8a0]">
                      <Sparkles className="h-3.5 w-3.5" /> Featured Track
                    </span>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                      {track.title}
                    </h1>
                    <p className="text-sm sm:text-base font-semibold text-zinc-300">
                      {track.artist} — <span className="text-zinc-400 font-normal">{track.album}</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                      <button
                        onClick={togglePlay}
                        className="flex items-center gap-2 rounded-xl bg-[#1db954] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-black hover:bg-[#58d979] hover:scale-105 transition shadow-lg shadow-[#1db954]/25"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-4 w-4 fill-black" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 fill-black ml-0.5" /> Listen Now
                          </>
                        )}
                      </button>
                      <button
                        onClick={addToPlaylist}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.05] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition"
                      >
                        {playlist.some((item) => item.id === track.id) ? (
                          <>
                            <Check className="h-4 w-4 text-[#1db954]" /> In Playlist
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" /> Add to Playlist
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="relative h-32 w-32 sm:h-40 sm:w-40 shrink-0 overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/15">
                    <img
                      src={track.cover}
                      alt={track.album}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </section>

              {/* DASHBOARD GRID: VINYL VISUALIZER & UP NEXT QUEUE */}
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Vinyl Turntable Visualizer Deck */}
                <div className="lg:col-span-7 h-[340px] sm:h-[400px] lg:h-[420px]">
                  <VinylVisualizer currentTrack={track} isPlaying={isPlaying} />
                </div>

                {/* Up Next Queue */}
                <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0d0e12]/90 p-4 sm:p-5 backdrop-blur-xl lg:col-span-5 h-[340px] sm:h-[400px] lg:h-[420px]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                        Playlist Queue
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white">Up Next</h3>
                    </div>
                    {queue.length > 0 && (
                      <button
                        onClick={() => {
                          setQueue([]);
                          setIndex(0);
                          setIsPlaying(false);
                        }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3 w-3" /> Clear Queue
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {queue.length ? (
                      queue.map((item, itemIndex) => {
                        const isCurrent = !externalTrack && itemIndex === index;
                        return (
                          <div
                            key={item.id}
                            className={`group flex items-center justify-between gap-2.5 rounded-2xl p-2 sm:p-2.5 transition-all duration-200 ${
                              isCurrent
                                ? "border border-[#1db954]/50 bg-[#1db954]/15 shadow-md shadow-[#1db954]/10"
                                : "border border-transparent hover:bg-white/[0.04]"
                            }`}
                          >
                            <button
                              onClick={() => changeTrack(itemIndex)}
                              className="flex flex-1 items-center gap-2.5 text-left min-w-0"
                            >
                              <span className="w-4 text-center text-xs font-bold text-zinc-500 group-hover:text-white">
                                {isCurrent && isPlaying ? (
                                  <span className="text-[#1db954] font-black">▶</span>
                                ) : (
                                  itemIndex + 1
                                )}
                              </span>
                              <img
                                src={item.cover}
                                alt=""
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p
                                  className={`truncate text-xs sm:text-sm font-bold ${
                                    isCurrent ? "text-[#75e8a0]" : "text-white"
                                  }`}
                                >
                                  {item.title}
                                </p>
                                <p className="truncate text-[11px] sm:text-xs text-zinc-400">
                                  {item.artist}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={() => removeFromQueue(item.id)}
                              className="rounded-lg p-1.5 text-zinc-500 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                        <Music className="mb-2 h-7 w-7 text-zinc-600" />
                        <p className="text-xs sm:text-sm font-medium">Queue is empty</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FIXED AUDIO PLAYER BAR */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 md:relative border-t border-white/10 bg-[#0b0c0f]/95 px-4 sm:px-6 py-2.5 backdrop-blur-2xl">
          <audio ref={audioRef} src={track.audio} preload="metadata" />

          {/* Progress Seek Bar */}
          <div className="mb-1.5 flex items-center gap-2.5 text-[11px] font-medium text-zinc-400">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <input
              aria-label="Seek track"
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-1 flex-1 cursor-pointer accent-[#1db954]"
            />
            <span className="w-8">{formatTime(duration)}</span>
          </div>

          {error && (
            <p className="mb-1 text-center text-[11px] text-red-400 font-semibold">{error}</p>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Track Cover & Info */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3.5 flex-1 sm:w-1/4">
              <img
                src={track.cover}
                alt=""
                className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-xl object-cover shadow-md ring-1 ring-white/10"
              />
              <div className="min-w-0 max-w-[110px] sm:max-w-none">
                <p className="truncate text-xs sm:text-sm font-bold text-white">
                  {track.title}
                </p>
                <p className="truncate text-[10px] sm:text-xs text-zinc-400">
                  {track.artist}
                </p>
              </div>
              <button
                onClick={() => setLiked(!liked)}
                className={`ml-1 transition hover:scale-110 ${
                  liked ? "text-[#1db954]" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5" fill={liked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                title="Shuffle"
                className={`hidden sm:block transition ${
                  isShuffle ? "text-[#1db954]" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                onClick={() => changeTrack(index - 1)}
                className="text-zinc-400 hover:text-white transition"
              >
                <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={togglePlay}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#1db954] text-black shadow-lg shadow-[#1db954]/25 transition hover:scale-105 hover:bg-[#58d979]"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-black" />
                ) : (
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-black ml-0.5" />
                )}
              </button>
              <button
                onClick={() => changeTrack(index + 1)}
                className="text-zinc-400 hover:text-white transition"
              >
                <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => setIsRepeat(!isRepeat)}
                title="Repeat"
                className={`hidden sm:block transition ${
                  isRepeat ? "text-[#1db954]" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Repeat className="h-4 w-4" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center justify-end gap-3 w-1/4">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                ) : (
                  <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
              <input
                aria-label="Volume"
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(event) => {
                  setIsMuted(false);
                  setVolume(Number(event.target.value));
                }}
                className="w-16 sm:w-24 accent-[#1db954]"
              />
            </div>
          </div>
        </footer>

        {/* MOBILE BOTTOM NAVIGATION TAB BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-white/10 bg-[#0d0e12]/95 backdrop-blur-2xl md:hidden">
          {navItems.map(([view, label, Icon]) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex flex-col items-center gap-1 text-[10px] font-extrabold transition ${
                  isActive ? "text-[#1db954]" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHANGE AVATAR MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowAvatarModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0e1014] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#1db954]" />
                <h3 className="text-lg font-black text-white">Choose Your Avatar</h3>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Select Preset Avatar
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectAvatar(preset.url)}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-[#1db954] ring-4 ring-[#1db954]/20 scale-105"
                        : "border-white/10 hover:border-white/40 hover:scale-105"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Check className="h-6 w-6 text-[#1db954]" />
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Or Paste Custom Image URL
            </p>
            <form onSubmit={handleCustomAvatarSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-[#1db954]"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#1db954] px-4 py-2 text-xs font-bold text-black hover:bg-[#58d979] transition"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowSettingsModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in"
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0e1014] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#1db954]" />
                <h3 className="text-lg font-black text-white">Account & Audio Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Audio Quality
                </label>
                <select
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs font-bold text-white outline-none focus:border-[#1db954]"
                >
                  <option value="320kbps" className="bg-[#0e1014]">
                    Ultra HD (320 kbps High Fidelity)
                  </option>
                  <option value="256kbps" className="bg-[#0e1014]">
                    High Quality (256 kbps)
                  </option>
                  <option value="128kbps" className="bg-[#0e1014]">
                    Standard (128 kbps Data Saver)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Equalizer Mode
                </label>
                <select
                  value={eqPreset}
                  onChange={(e) => setEqPreset(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs font-bold text-white outline-none focus:border-[#1db954]"
                >
                  <option value="Bass Boost" className="bg-[#0e1014]">
                    Bass Boost
                  </option>
                  <option value="Balanced" className="bg-[#0e1014]">
                    Balanced Studio
                  </option>
                  <option value="Vocal Enhancer" className="bg-[#0e1014]">
                    Vocal Enhancer
                  </option>
                  <option value="Acoustic" className="bg-[#0e1014]">
                    Acoustic & Live
                  </option>
                  <option value="Electronic" className="bg-[#0e1014]">
                    Electronic & Dance
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div>
                  <p className="text-xs font-bold text-white">Autoplay Next Track</p>
                  <p className="text-[11px] text-zinc-400">Play next song when current track ends</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoplayNext((prev) => !prev)}
                  className={`h-6 w-11 rounded-full transition-colors p-0.5 ${
                    autoplayNext ? "bg-[#1db954]" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-black shadow-md transition-transform ${
                      autoplayNext ? "translate-x-5 bg-black" : "translate-x-0 bg-white"
                    }`}
                  />
                </button>
              </div>
            </div>

            {settingsSavedMessage && (
              <p className="mt-4 text-center text-xs font-bold text-[#75e8a0]">
                {settingsSavedMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="rounded-xl bg-[#1db954] px-5 py-2.5 text-xs font-extrabold text-black hover:bg-[#58d979] transition shadow-lg shadow-[#1db954]/20"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
