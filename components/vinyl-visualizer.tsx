'use client'

import { useEffect, useRef } from 'react'
import { Disc3, Music2, Radio } from 'lucide-react'

interface Track {
  title: string
  artist: string
  cover: string
}

export default function VinylVisualizer({
  currentTrack,
  isPlaying,
}: {
  currentTrack: Track
  isPlaying: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const rotationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(centerX, centerY) * 0.85

      // Background gradient
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        maxRadius * 1.3,
      )
      bgGrad.addColorStop(0, '#13161c')
      bgGrad.addColorStop(1, '#090a0c')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Rotate if playing
      if (isPlaying) {
        rotationRef.current += 0.75
      }

      ctx.save()
      ctx.translate(centerX, centerY)

      // Ambient Outer Glow when playing
      if (isPlaying) {
        const glowGrad = ctx.createRadialGradient(
          0,
          0,
          maxRadius * 0.7,
          0,
          0,
          maxRadius * 1.1,
        )
        glowGrad.addColorStop(0, 'rgba(29, 185, 84, 0.25)')
        glowGrad.addColorStop(0.5, 'rgba(29, 185, 84, 0.08)')
        glowGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(0, 0, maxRadius * 1.15, 0, Math.PI * 2)
        ctx.fill()
      }

      // Vinyl Disc Base Shadow & Rim
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
      ctx.shadowBlur = 30
      ctx.shadowOffsetY = 10
      ctx.fillStyle = '#0b0c0e'
      ctx.beginPath()
      ctx.arc(0, 0, maxRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowColor = 'transparent'

      // Rotate vinyl surface
      ctx.rotate((rotationRef.current * Math.PI) / 180)

      // Grooves pattern
      const ringCount = 45
      for (let i = 0; i < ringCount; i++) {
        const radius = (maxRadius / ringCount) * (i + 1)
        if (radius < maxRadius * 0.35 || radius > maxRadius * 0.96) continue

        const opacity = 0.18 + Math.sin(i * 0.3) * 0.08
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Vinyl Sheen (Light Reflection Beam)
      const sheenGrad = ctx.createLinearGradient(
        -maxRadius,
        -maxRadius,
        maxRadius,
        maxRadius,
      )
      sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.03)')
      sheenGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.12)')
      sheenGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)')
      sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.03)')
      ctx.fillStyle = sheenGrad
      ctx.beginPath()
      ctx.arc(0, 0, maxRadius * 0.95, 0, Math.PI * 2)
      ctx.fill()

      // Vinyl Center Label Outer Border
      const labelRadius = maxRadius * 0.36
      ctx.fillStyle = '#1db954'
      ctx.beginPath()
      ctx.arc(0, 0, labelRadius + 2, 0, Math.PI * 2)
      ctx.fill()

      // Center Spindle Hole Base
      ctx.fillStyle = '#14171a'
      ctx.beginPath()
      ctx.arc(0, 0, labelRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()

      // Album Artwork Clip (Center)
      const albumRadius = maxRadius * 0.32
      const img = new Image()
      img.src = currentTrack.cover
      img.crossOrigin = 'anonymous'

      if (img.complete && img.naturalWidth !== 0) {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate((rotationRef.current * Math.PI) / 180)
        ctx.beginPath()
        ctx.arc(0, 0, albumRadius, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(
          img,
          -albumRadius,
          -albumRadius,
          albumRadius * 2,
          albumRadius * 2,
        )
        ctx.restore()
      }

      // Center Metallic Spindle Pin
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.fillStyle = '#e2e8f0'
      ctx.beginPath()
      ctx.arc(0, 0, maxRadius * 0.06, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(0, 0, maxRadius * 0.03, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Reactive Audio Equalizer Waveform Lines around Vinyl Edge
      if (isPlaying) {
        const bars = 36
        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2
          const baseRadius = maxRadius + 6
          const varVal = Math.sin(rotationRef.current * 0.08 + i * 0.4) * 0.5 + 0.5
          const height = 4 + varVal * 14

          const x1 = centerX + Math.cos(angle) * baseRadius
          const y1 = centerY + Math.sin(angle) * baseRadius
          const x2 = centerX + Math.cos(angle) * (baseRadius + height)
          const y2 = centerY + Math.sin(angle) * (baseRadius + height)

          const barGrad = ctx.createLinearGradient(x1, y1, x2, y2)
          barGrad.addColorStop(0, 'rgba(29, 185, 84, 0.8)')
          barGrad.addColorStop(1, 'rgba(117, 232, 160, 0.2)')

          ctx.strokeStyle = barGrad
          ctx.lineWidth = 2.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, currentTrack.cover])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121418] via-[#0d0e11] to-[#07080a] p-6 shadow-2xl backdrop-blur-xl">
      {/* Top Header Badge */}
      <div className="z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#1db954] shadow-[0_0_8px_#1db954]">
            {isPlaying && (
              <span className="h-full w-full animate-ping rounded-full bg-[#1db954] opacity-75" />
            )}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#75e8a0]">
            {isPlaying ? 'Now Playing' : 'Playback Paused'}
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-400">
          <Radio className="h-3.5 w-3.5 text-[#1db954]" /> Hi-Fi Deck
        </span>
      </div>

      {/* Center Vinyl Canvas */}
      <div className="relative my-4 flex-1 min-h-[240px] w-full items-center justify-center">
        <canvas ref={canvasRef} className="h-full w-full rounded-2xl" />
      </div>

      {/* Bottom Track Title Info */}
      <div className="z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1db954]/15 text-[#1db954]">
            <Music2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-extrabold text-white">
              {currentTrack.title}
            </h4>
            <p className="truncate text-xs text-zinc-400">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {isPlaying && (
          <div className="flex items-end gap-1 h-4 px-2">
            <span className="w-1 bg-[#1db954] rounded-full animate-bar-1" />
            <span className="w-1 bg-[#1db954] rounded-full animate-bar-2" />
            <span className="w-1 bg-[#1db954] rounded-full animate-bar-3" />
            <span className="w-1 bg-[#1db954] rounded-full animate-bar-4" />
          </div>
        )}
      </div>
    </div>
  )
}
