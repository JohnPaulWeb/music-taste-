"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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

const DEFAULT_COVER_FALLBACK =
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop";

const EMPTY_TRACK: Track = {
  id: 0,
  title: "Select a Song",
  artist: "No Track Playing",
  album: "echora Studio",
  cover: DEFAULT_COVER_FALLBACK,
  audio: "",
  durationSeconds: 0,
};

const defaultTracks: Track[] = [
  {
    id: 1,
    title: "Neon Horizon",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    durationSeconds: 372,
  },
  {
    id: 2,
    title: "Silica Waves",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    durationSeconds: 423,
  },
  {
    id: 3,
    title: "Fractal Dream",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    durationSeconds: 345,
  },
  {
    id: 4,
    title: "Velocity Zero",
    artist: "Lumina Collective",
    album: "Digital Ethereal",
    cover:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop",
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
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState("");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [externalTrack, setExternalTrack] = useState<Track | null>(null);

  const [queue, setQueue] = useState<Track[]>([]);
  const [queueReady, setQueueReady] = useState(false);
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

  const track = externalTrack ?? queue[index] ?? EMPTY_TRACK;

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
      // Close suggestions if clicking outside the search area
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete fetch
  const fetchSuggestions = useCallback(async (term: string) => {
    if (!term.trim() || term.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=6`
      );
      if (!response.ok) return;
      const data = (await response.json()) as { results: ITunesSong[] };
      const found = data.results
        .filter((song) => song.previewUrl)
        .slice(0, 6)
        .map((song) => ({
          id: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          album: song.collectionName ?? "Single",
          cover:
            song.artworkUrl100?.replace("100x100", "300x300") ??
            "/placeholder.jpg",
          audio: song.previewUrl as string,
          durationSeconds: 30,
        }));
      setSuggestions(found);
      setShowSuggestions(found.length > 0);
      setActiveSuggestion(-1);
    } catch {
      // silently fail — suggestions are optional
    }
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

  // Sync queue with localStorage (restore on login, skip for guest)
  useEffect(() => {
    if (user.email === "guest@echora.local") {
      setQueueReady(true);
      return;
    }
    try {
      const saved = window.localStorage.getItem(`echora-queue-${user.email}`);
      if (saved) {
        const parsed = JSON.parse(saved) as { queue: Track[]; index: number };
        if (parsed.queue?.length) {
          setQueue(parsed.queue);
          setIndex(parsed.index ?? 0);
        }
      }
    } catch {
      setQueue([]);
    }
    setQueueReady(true);
  }, [user.email]);

  useEffect(() => {
    if (!queueReady || user.email === "guest@echora.local") return;
    window.localStorage.setItem(
      `echora-queue-${user.email}`,
      JSON.stringify({ queue, index })
    );
  }, [queue, index, queueReady, user.email]);

  // Sync playlist with localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`echora-playlist-${user.email}`);
      if (saved) setPlaylist(JSON.parse(saved) as Track[]);
    } catch {
      setPlaylist([]);
    }
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
    }
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
    if (isPlaying && track && track.id !== 0) {
      setHistory((items) =>
        [track, ...items.filter((item) => item.id !== track.id)].slice(0, 15)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, track.id]);

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
        setIsPlaying(true);
      } else if (queue.length > 1) {
        // Always advance to next track when queue has more songs
        setExternalTrack(null);
        setIndex((value) => (value + 1) % queue.length);
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
        setExternalTrack(null);
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
  }, [isRepeat, isShuffle, queue.length]);

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

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionSelect = (suggestion: Track) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setActiveSuggestion(-1);
    playSearchResult(suggestion);
    setQuery(suggestion.title + " " + suggestion.artist);
    setResults([suggestion]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setShowSuggestions(false);
    setSuggestions([]);
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

  const pendingPlayRef = useRef<number | null>(null);

  const playSearchResult = (result: Track) => {
    setError("");
    setExternalTrack(null);
    setQueue((prev) => {
      const alreadyInQueue = prev.some((item) => item.id === result.id);
      const nextQueue = alreadyInQueue ? prev : [...prev, result];
      pendingPlayRef.current = nextQueue.findIndex((item) => item.id === result.id);
      return nextQueue;
    });
  };

  // When queue updates and there's a pending play request, switch to that index
  useEffect(() => {
    if (pendingPlayRef.current !== null && queue.length > 0) {
      setIndex(pendingPlayRef.current);
      setIsPlaying(true);
      pendingPlayRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue]);

  const addToPlaylist = () => {
    if (!playlist.some((item) => item.id === track.id)) {
      setPlaylist((items) => [...items, track]);
    }
  };

  const addToQueue = (trackToAdd: Track) => {
    if (!queue.some((item) => item.id === trackToAdd.id)) {
      setQueue((items) => [...items, trackToAdd]);
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
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white antialiased">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col shrink-0 bg-black w-64 p-2 gap-2">
        {/* Sidebar Header */}
        <div className="flex flex-col gap-2 p-4 bg-[#121212] rounded-lg">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1ed760] text-black">
              <Disc3 className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">echora</span>
              <span className="text-[10px] font-semibold text-[#1ed760] uppercase tracking-wider">Music</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 bg-[#121212] rounded-lg p-2 overflow-y-auto">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
            Menu
          </p>
          {navItems.map(([view, label, Icon]) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#282828] text-white"
                    : "text-[#b3b3b3] hover:text-white"
                }`}
              >
                <Icon className={`h-6 w-6 shrink-0 ${isActive ? "text-[#1ed760]" : ""}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
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
      <div className="flex flex-1 flex-col min-w-0 h-full pb-[112px] md:pb-0 relative z-0 bg-gradient-to-b from-[#1ed760]/10 to-black">
        {/* HEADER TOP BAR */}
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-3 bg-black/40 px-4 sm:px-6 backdrop-blur-xl">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/60 text-white md:hidden hover:bg-black/80 hover:scale-105 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Instant Search Bar */}
          <form onSubmit={search} className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#b3b3b3]" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="What do you want to listen to?"
              autoComplete="off"
              className="w-full rounded-full border-0 bg-white/10 py-2 pl-10 pr-9 text-sm text-white placeholder:text-[#b3b3b3] outline-none transition hover:bg-white/[0.12] focus:bg-[#282828] focus:ring-2 focus:ring-white/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearchError("");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full mt-2 z-[200] rounded-2xl border border-white/15 bg-[#111318]/95 shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                <p className="px-4 pt-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                  Suggestions
                </p>
                <ul role="listbox" aria-label="Search suggestions">
                  {suggestions.map((s, i) => (
                    <li
                      key={s.id}
                      role="option"
                      aria-selected={i === activeSuggestion}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionSelect(s);
                      }}
                      onMouseEnter={() => setActiveSuggestion(i)}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition ${
                        i === activeSuggestion
                          ? "bg-[#1db954]/20 text-[#75e8a0]"
                          : "hover:bg-white/[0.06] text-white"
                      }`}
                    >
                      <img
                        src={s.cover}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{s.title}</p>
                        <p className="truncate text-[11px] text-zinc-400">{s.artist}</p>
                      </div>
                      <Play className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                    </li>
                  ))}
                </ul>
                <div className="border-t border-white/10 px-4 py-2.5">
                  <button
                    type="submit"
                    className="text-xs font-semibold text-[#75e8a0] hover:underline"
                  >
                    Press Enter to see all results for &ldquo;{query}&rdquo;
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* User Profile Badge with Interactive Dropdown Menu */}
          <div className="relative z-50" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-black/60 p-1 pr-2 transition hover:bg-black/80"
            >
              {/* Avatar Icon / Image */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1ed760] font-bold text-black">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm font-bold text-white hidden sm:block">{user.name}</span>
              <ChevronDown className="h-4 w-4 text-[#b3b3b3] hidden sm:block" />
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
                  className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2 transition hover:border-[#1db954]/50 hover:bg-white/[0.08]"
                >
                  <button
                    onClick={() => playSearchResult(result)}
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                    aria-label={`Play ${result.title}`}
                  >
                    <img
                      src={result.cover}
                      alt={result.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-[#75e8a0]">
                      {result.title}
                    </p>
                    <p className="truncate text-[11px] sm:text-xs text-zinc-400">
                      {result.artist}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToQueue(result); }}
                    title="Add to queue"
                    className={`shrink-0 rounded-lg p-1.5 transition ${
                      queue.some((q) => q.id === result.id)
                        ? "text-[#1db954]"
                        : "text-zinc-500 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {queue.some((q) => q.id === result.id) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DASHBOARD CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#121212] rounded-t-lg mt-2 mx-2">
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
            <div className="space-y-5">

              {/* GREETING + STATS ROW */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#75e8a0]">Welcome back</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {user.name} 
                  </h1>
                </div>
                <div className="flex gap-3">
                  {[
                    { label: "In Queue", value: queue.length, icon: ListMusic },
                    { label: "Saved", value: playlist.length, icon: Heart },
                    { label: "Played", value: history.length, icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 min-w-[72px]">
                      <Icon className="h-3.5 w-3.5 text-[#1db954] mb-1" />
                      <span className="text-lg font-black text-white leading-none">{value}</span>
                      <span className="text-[10px] font-semibold text-zinc-500 mt-0.5">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEATURED HERO BANNER */}
              <section className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
                {/* Blurred album art background */}
                <div
                  className="absolute inset-0 scale-110 blur-2xl opacity-30"
                  style={{ backgroundImage: `url(${track.cover})`, backgroundSize: "cover", backgroundPosition: "center" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#090a0c]/95 via-[#0d0e12]/80 to-[#090a0c]/60" />

                <div className="relative flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6 lg:p-8">
                  {/* Album Art */}
                  <div className="relative shrink-0 h-28 w-28 sm:h-36 sm:w-36 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/20">
                    <img src={track.cover || undefined} alt={track.album} className="h-full w-full object-cover" />
                    {isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="flex items-end gap-0.5 h-5">
                          <span className="w-1 bg-[#1db954] rounded-full animate-bar-1" />
                          <span className="w-1 bg-[#1db954] rounded-full animate-bar-2" />
                          <span className="w-1 bg-[#1db954] rounded-full animate-bar-3" />
                          <span className="w-1 bg-[#1db954] rounded-full animate-bar-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Info & Controls */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1db954]/30 bg-[#1db954]/10 px-3 py-1 text-[11px] font-bold text-[#75e8a0]">
                      <Sparkles className="h-3 w-3" />
                      {isPlaying ? "Now Playing" : "Featured Track"}
                    </span>
                    <div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight truncate">
                        {track.title}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-zinc-300 truncate">
                        {track.artist}
                        {track.album && track.album !== "echora Studio" && (
                          <span className="text-zinc-500 font-normal"> — {track.album}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <button
                        onClick={togglePlay}
                        className="flex items-center gap-2 rounded-xl bg-[#1db954] px-5 py-2.5 text-xs sm:text-sm font-extrabold text-black hover:bg-[#58d979] hover:scale-105 transition shadow-lg shadow-[#1db954]/25"
                      >
                        {isPlaying ? (
                          <><Pause className="h-4 w-4 fill-black" /> Pause</>
                        ) : (
                          <><Play className="h-4 w-4 fill-black ml-0.5" /> Play</>
                        )}
                      </button>
                      <button
                        onClick={addToPlaylist}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition"
                      >
                        {playlist.some((item) => item.id === track.id) ? (
                          <><Check className="h-4 w-4 text-[#1db954]" /> Saved</>
                        ) : (
                          <><Plus className="h-4 w-4" /> Save</>
                        )}
                      </button>
                      <button
                        onClick={() => addToQueue(track)}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-white/10 transition"
                      >
                        {queue.some((item) => item.id === track.id) ? (
                          <><Check className="h-4 w-4 text-[#1db954]" /> Queued</>
                        ) : (
                          <><ListMusic className="h-4 w-4" /> Queue</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* MAIN GRID: VINYL + QUEUE */}
              <div className="grid gap-5 lg:grid-cols-12">
                {/* Vinyl Visualizer */}
                <div className="lg:col-span-7 h-[320px] sm:h-[380px] lg:h-[400px]">
                  <VinylVisualizer currentTrack={track} isPlaying={isPlaying} />
                </div>

                {/* Up Next Queue */}
                <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0d0e12]/90 p-4 sm:p-5 backdrop-blur-xl lg:col-span-5 h-[320px] sm:h-[380px] lg:h-[400px]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Playlist Queue</span>
                      <h3 className="text-base sm:text-lg font-black text-white">Up Next</h3>
                    </div>
                    {queue.length > 0 && (
                      <button
                        onClick={() => { setQueue([]); setIndex(0); setIsPlaying(false); }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
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
                            <button onClick={() => changeTrack(itemIndex)} className="flex flex-1 items-center gap-2.5 text-left min-w-0">
                              <span className="w-5 text-center text-xs font-bold text-zinc-500 shrink-0">
                                {isCurrent && isPlaying
                                  ? <span className="text-[#1db954]">▶</span>
                                  : <span className="group-hover:text-white">{itemIndex + 1}</span>
                                }
                              </span>
                              <img src={item.cover} alt="" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0">
                                <p className={`truncate text-xs sm:text-sm font-bold ${isCurrent ? "text-[#75e8a0]" : "text-white"}`}>
                                  {item.title}
                                </p>
                                <p className="truncate text-[11px] sm:text-xs text-zinc-400">{item.artist}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => removeFromQueue(item.id)}
                              className="rounded-lg p-1.5 text-zinc-500 opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center gap-2 text-zinc-500">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <Music className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs font-bold text-zinc-400">Queue is empty</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">Search a song to get started</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RECENTLY PLAYED */}
              {history.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#1db954]" />
                      <h3 className="text-base font-black text-white">Recently Played</h3>
                    </div>
                    <span className="text-xs text-zinc-500">{history.length} tracks</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {history.slice(0, 6).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => playSearchResult(item)}
                        className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center transition hover:border-[#1db954]/40 hover:bg-white/[0.07]"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-xl">
                          <img src={item.cover} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                            <Play className="h-6 w-6 fill-white text-white" />
                          </div>
                        </div>
                        <div className="w-full min-w-0">
                          <p className="truncate text-xs font-bold text-white group-hover:text-[#75e8a0]">{item.title}</p>
                          <p className="truncate text-[10px] text-zinc-500">{item.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM FIXED AUDIO PLAYER BAR */}
        <footer className="fixed bottom-14 left-0 right-0 z-40 md:bottom-0 md:relative bg-[#181818] border-t border-[#282828] px-3 sm:px-4 py-3 sm:py-3">
          <audio ref={audioRef} src={track.audio || undefined} preload="metadata" />

          {/* Progress Seek Bar */}
          <div className="mb-2 flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-[#b3b3b3]">
            <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
            <input
              aria-label="Seek track"
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none bg-[#4d4d4d] rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#1ed760]"
              style={{
                background: `linear-gradient(to right, #1ed760 ${(currentTime / (duration || 1)) * 100}%, #4d4d4d ${(currentTime / (duration || 1)) * 100}%)`
              }}
            />
            <span className="w-10 tabular-nums">{formatTime(duration)}</span>
          </div>

          {error && (
            <p className="mb-1 text-center text-[11px] text-red-400 font-semibold">{error}</p>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Track Cover & Info */}
            <div className="flex min-w-0 items-center gap-3 flex-1 sm:w-[30%]">
              <img
                src={track.cover || undefined}
                alt=""
                className="h-14 w-14 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white leading-tight hover:underline cursor-pointer">
                  {track.title}
                </p>
                <p className="truncate text-xs text-[#b3b3b3] hover:underline hover:text-white cursor-pointer">
                  {track.artist}
                </p>
              </div>
              <button
                onClick={() => setLiked(!liked)}
                className={`shrink-0 transition hover:scale-110 ${
                  liked ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
                }`}
              >
                <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  title="Shuffle"
                  className={`transition hover:scale-110 ${
                    isShuffle ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => changeTrack(index - 1)}
                  className="text-[#b3b3b3] hover:text-white transition hover:scale-110"
                >
                  <SkipBack className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-white/90"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-black" />
                  ) : (
                    <Play className="h-4 w-4 fill-black ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => changeTrack(index + 1)}
                  className="text-[#b3b3b3] hover:text-white transition hover:scale-110"
                >
                  <SkipForward className="h-5 w-5" fill="currentColor" />
                </button>
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  title="Repeat"
                  className={`transition hover:scale-110 ${
                    isRepeat ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"
                  }`}
                >
                  <Repeat className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Volume Control — desktop only */}
            <div className="hidden sm:flex items-center gap-2 w-[30%] justify-end">
              <button
                onClick={toggleMute}
                className="text-[#b3b3b3] hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
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
                className="w-24 h-1 cursor-pointer appearance-none bg-[#4d4d4d] rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-[#1ed760]"
                style={{
                  background: `linear-gradient(to right, #fff ${volume}%, #4d4d4d ${volume}%)`
                }}
              />
            </div>
          </div>
        </footer>

        {/* MOBILE BOTTOM NAVIGATION TAB BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around bg-[#000] border-t border-[#282828] md:hidden">
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
