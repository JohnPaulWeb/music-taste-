'use client'

import { useEffect, useRef } from 'react'

interface Track {
  title: string
  artist: string
  cover: string
}

export default function VinylVisualizer({ currentTrack, isPlaying }: { currentTrack: Track; isPlaying: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const rotationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxRadius = Math.min(centerX, centerY) - 20

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(18, 18, 24, 1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Rotate if playing
      if (isPlaying) {
        rotationRef.current += 0.5
      }

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate((rotationRef.current * Math.PI) / 180)

      // Draw vinyl record rings
      const ringCount = 60
      for (let i = 0; i < ringCount; i++) {
        const radius = (maxRadius / ringCount) * (i + 1)
        const opacity = 0.15 - (i / ringCount) * 0.12

        ctx.strokeStyle = `rgba(209, 113, 50, ${opacity})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.restore()

      // Draw center label circle
      ctx.fillStyle = 'rgba(30, 30, 35, 1)'
      ctx.beginPath()
      ctx.arc(centerX, centerY, maxRadius * 0.25, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(209, 113, 50, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw album art in center
      const img = new Image()
      img.src = currentTrack.cover
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        const size = maxRadius * 0.22
        ctx.save()
        ctx.translate(centerX, centerY)

        // Draw circular clipping path
        ctx.beginPath()
        ctx.arc(0, 0, size, 0, Math.PI * 2)
        ctx.clip()

        ctx.drawImage(img, -size, -size, size * 2, size * 2)
        ctx.restore()

        // Draw circle border around album art
        ctx.strokeStyle = 'rgba(209, 113, 50, 0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw dynamic lines for now playing effect
      if (isPlaying) {
        const lines = 12
        for (let i = 0; i < lines; i++) {
          const angle = (i / lines) * Math.PI * 2
          const innerRadius = maxRadius * 0.3
          const outerRadius = maxRadius * 0.5

          const x1 = centerX + Math.cos(angle) * innerRadius
          const y1 = centerY + Math.sin(angle) * innerRadius
          const x2 = centerX + Math.cos(angle) * outerRadius
          const y2 = centerY + Math.sin(angle) * outerRadius

          // Create height variation based on rotation
          const heightVariation = Math.sin((rotationRef.current + i * 30) * 0.05) * 0.5 + 0.5
          const lineLength = innerRadius + (outerRadius - innerRadius) * heightVariation

          const x2Final = centerX + Math.cos(angle) * lineLength
          const y2Final = centerY + Math.sin(angle) * lineLength

          ctx.strokeStyle = `rgba(209, 113, 50, ${0.6 * heightVariation})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2Final, y2Final)
          ctx.stroke()
        }
      }

      // Draw playing indicator text
      ctx.fillStyle = 'rgba(209, 113, 50, 0.8)'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (isPlaying) {
        const bars = ['▮', '▮', '▮']
        ctx.fillText(bars.join('  '), centerX, centerY + maxRadius * 0.65)
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

    // Handle canvas resize
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
    <div className="h-full bg-gradient-to-br from-card to-secondary rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Now Playing</h3>
        <h2 className="text-xl font-bold text-balance">{currentTrack.title}</h2>
        <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
      </div>
      <div className="flex-1">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}
