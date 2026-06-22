'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  z: number
  size: number
  opacity: number
  speed: number
  layer: number  // 0-2 for parallax depth
  color: string
}

const STAR_COLORS = [
  'rgba(255,255,255,',
  'rgba(200,220,255,',
  'rgba(255,220,200,',
  'rgba(180,200,255,',
  'rgba(0,245,255,0.6',  // occasional cyan star
]

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize stars
    const initStars = () => {
      const count = Math.min(10000, Math.floor((canvas.width * canvas.height) / 1200))
      starsRef.current = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(),
        size: Math.random() * 2 + 0.1,
        opacity: Math.random() * 0.8 + 0.1,
        speed: Math.random() * 0.02 + 0.005,
        layer: Math.floor(Math.random() * 3),
        color: STAR_COLORS[Math.floor(Math.random() * (i % 50 === 0 ? STAR_COLORS.length : 4))],
      }))
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    resize()
    window.addEventListener('resize', resize)

    // Mouse parallax
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', onMouseMove)

    // Twinkle offsets
    let time = 0

    const draw = () => {
      time += 0.005
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      starsRef.current.forEach((star) => {
        // Parallax offset by layer
        const parallaxStrength = (star.layer + 1) * 8
        const px = star.x + mx * parallaxStrength
        const py = star.y + my * parallaxStrength

        // Wrap around
        const drawX = ((px % canvas.width) + canvas.width) % canvas.width
        const drawY = ((py % canvas.height) + canvas.height) % canvas.height

        // Twinkle
        const twinkle = Math.sin(time * star.speed * 100 + star.x) * 0.3 + 0.7
        const opacity = star.opacity * twinkle

        // Draw star
        const size = star.size * (1 - star.layer * 0.2)

        ctx.beginPath()
        ctx.arc(drawX, drawY, size, 0, Math.PI * 2)
        ctx.fillStyle = `${star.color}${opacity.toFixed(2)})`
        ctx.fill()

        // Occasional cross-glow for brighter stars
        if (star.size > 1.5 && opacity > 0.7) {
          ctx.strokeStyle = `${star.color}${(opacity * 0.3).toFixed(2)})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(drawX - size * 3, drawY)
          ctx.lineTo(drawX + size * 3, drawY)
          ctx.moveTo(drawX, drawY - size * 3)
          ctx.lineTo(drawX, drawY + size * 3)
          ctx.stroke()
        }
      })

      // Subtle nebula clouds
      const nebulaPositions = [
        { x: canvas.width * 0.15, y: canvas.height * 0.3, r: 200, color: 'rgba(124,58,237,' },
        { x: canvas.width * 0.85, y: canvas.height * 0.7, r: 160, color: 'rgba(0,245,255,' },
        { x: canvas.width * 0.5,  y: canvas.height * 0.15, r: 120, color: 'rgba(168,85,247,' },
      ]

      nebulaPositions.forEach((n) => {
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        gradient.addColorStop(0, `${n.color}0.04)`)
        gradient.addColorStop(1, `${n.color}0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2)
      })

      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="starfield-canvas"
      aria-hidden="true"
    />
  )
}
