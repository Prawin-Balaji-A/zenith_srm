'use client'

import { useEffect, useRef, useState } from 'react'
import { useZenithStore } from '@/store/zenith'
import styles from './RadarHUD.module.css'

interface BlipObject {
  id: number | string
  name: string
  elevation: number
  azimuth: number
  type: string
  alt?: number
  vel?: number
}

export default function RadarHUD() {
  const { satellites, selectedObject, setSelectedObject, location, activeFilters } = useZenithStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const sweepAngleRef = useRef(0)

  // Static example blips for demo when no real data
  const [blips, setBlips] = useState<BlipObject[]>([])

  useEffect(() => {
    // Use real satellite data if available, else demo blips
    if (satellites.length > 0) {
      setBlips(
        satellites
          .filter((s) => {
            if (!activeFilters.has('iss') && s.type === 'iss') return false
            if (!activeFilters.has('active') && s.type === 'active') return false
            if (!activeFilters.has('debris') && s.type === 'debris') return false
            return true
          })
          .slice(0, 30)
          .map((s) => ({ id: s.id, name: s.name, elevation: s.elevation, azimuth: s.azimuth, type: s.type, alt: s.alt, vel: s.vel }))
      )
    } else {
      // Demo blips
      setBlips([
        { id: 'iss',     name: 'ISS (ZARYA)',  elevation: 65, azimuth: 220, type: 'iss',    alt: 420, vel: 7.66 },
        { id: 'sl1',     name: 'STARLINK-123', elevation: 42, azimuth: 70,  type: 'active', alt: 550, vel: 7.61 },
        { id: 'sl2',     name: 'STARLINK-456', elevation: 28, azimuth: 145, type: 'active', alt: 550, vel: 7.61 },
        { id: 'css',     name: 'CSS (TIANHE)', elevation: 18, azimuth: 310, type: 'station',alt: 389, vel: 7.68 },
        { id: 'gps1',    name: 'GPS IIR-10',   elevation: 55, azimuth: 90,  type: 'navigation', alt: 20200, vel: 3.87 },
        { id: 'deb1',    name: 'COSMOS DEB',   elevation: 8,  azimuth: 260, type: 'debris', alt: 780, vel: 7.45 },
        { id: 'noaa',    name: 'NOAA-19',      elevation: 33, azimuth: 185, type: 'weather', alt: 870, vel: 7.40 },
      ])
    }
  }, [satellites, activeFilters])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const maxR = size / 2 - 10

    const blipColors: Record<string, string> = {
      iss:        '#00f5ff',
      station:    '#00f5ff',
      active:     '#10b981',
      debris:     '#f59e0b',
      navigation: '#a855f7',
      weather:    '#60a5fa',
    }

    const draw = () => {
      ctx.clearRect(0, 0, size, size)

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
      bgGrad.addColorStop(0, 'rgba(0, 40, 60, 0.8)')
      bgGrad.addColorStop(1, 'rgba(2, 8, 24, 0.9)')
      ctx.fillStyle = bgGrad
      ctx.beginPath()
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2)
      ctx.fill()

      // Grid rings
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (maxR / 4) * r, 0, Math.PI * 2)
        ctx.strokeStyle = r === 4 ? 'rgba(0,245,255,0.2)' : 'rgba(0,245,255,0.08)'
        ctx.lineWidth = r === 4 ? 1.5 : 0.8
        ctx.stroke()

        // Elevation labels
        const elevLabel = (90 / 4) * (4 - r)
        ctx.fillStyle = 'rgba(0,245,255,0.35)'
        ctx.font = '9px Space Mono, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`${Math.round(elevLabel)}°`, cx + (maxR / 4) * r + 3, cy - 3)
      }

      // Cross-hair lines
      ctx.strokeStyle = 'rgba(0,245,255,0.1)'
      ctx.lineWidth = 0.7
      for (let a = 0; a < 8; a++) {
        const angle = (a * Math.PI) / 4
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR)
        ctx.stroke()
      }

      // Compass labels
      const compassLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
      ctx.font = 'bold 10px Outfit, sans-serif'
      compassLabels.forEach((label, i) => {
        const angle = (i * Math.PI) / 4 - Math.PI / 2
        const r2 = maxR - 12
        const lx = cx + Math.cos(angle) * r2
        const ly = cy + Math.sin(angle) * r2
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = label === 'N' ? '#00f5ff' : 'rgba(148,163,184,0.7)'
        ctx.fillText(label, lx, ly)
      })

      // Sweep
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2)
      const sweep = sweepAngleRef.current

      const sweepGrad = ctx.createConicalGradient
        ? null  // not widely supported, use manual arc
        : null

      // Manual sweep trail
      for (let i = 0; i < 40; i++) {
        const trailAngle = sweep - (i * Math.PI) / 60
        const alpha = (1 - i / 40) * 0.12
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, maxR - 10, trailAngle, trailAngle + Math.PI / 60)
        ctx.closePath()
        ctx.fillStyle = `rgba(0,245,255,${alpha})`
        ctx.fill()
      }

      // Sweep line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR)
      ctx.strokeStyle = 'rgba(0,245,255,0.9)'
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 8
      ctx.shadowColor = '#00f5ff'
      ctx.stroke()
      ctx.shadowBlur = 0

      // Center dot
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#00f5ff'
      ctx.shadowBlur = 12
      ctx.shadowColor = '#00f5ff'
      ctx.fill()
      ctx.shadowBlur = 0

      // Blips
      blips.forEach((blip) => {
        // Convert elevation (0-90) and azimuth (0-360) to canvas coords
        // elevation 90 = center, elevation 0 = edge
        const r2 = ((90 - blip.elevation) / 90) * (maxR - 20)
        const azRad = (blip.azimuth - 90) * (Math.PI / 180)  // rotate so N=up
        const bx = cx + Math.cos(azRad) * r2
        const by = cy + Math.sin(azRad) * r2

        const color = blipColors[blip.type] || '#10b981'

        // Blip glow
        ctx.beginPath()
        ctx.arc(bx, by, blip.type === 'iss' ? 8 : 5, 0, Math.PI * 2)
        ctx.fillStyle = `${color}22`
        ctx.fill()

        // Blip core
        ctx.beginPath()
        ctx.arc(bx, by, blip.type === 'iss' ? 5 : 3, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.shadowBlur = 10
        ctx.shadowColor = color
        ctx.fill()
        ctx.shadowBlur = 0

        // ISS cross marker
        if (blip.type === 'iss' || blip.type === 'station') {
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(bx - 10, by)
          ctx.lineTo(bx + 10, by)
          ctx.moveTo(bx, by - 10)
          ctx.lineTo(bx, by + 10)
          ctx.stroke()
        }

        // Name label
        ctx.fillStyle = `${color}cc`
        ctx.font = '8px Space Mono, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(blip.name.slice(0, 12), bx + 8, by - 4)

        // Elevation label
        ctx.fillStyle = `${color}88`
        ctx.font = '7px Space Mono, monospace'
        ctx.fillText(`${Math.round(blip.elevation)}°`, bx + 8, by + 6)
      })

      // Outer ring
      ctx.beginPath()
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,245,255,0.3)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [blips])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const maxR = canvas.width / 2 - 10
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    let closest: BlipObject | null = null
    let closestDist = 20

    blips.forEach((blip) => {
      const r2 = ((90 - blip.elevation) / 90) * (maxR - 20)
      const azRad = (blip.azimuth - 90) * (Math.PI / 180)
      const bx = cx + Math.cos(azRad) * r2
      const by = cy + Math.sin(azRad) * r2
      const dist = Math.hypot(x - bx, y - by)
      if (dist < closestDist) {
        closestDist = dist
        closest = blip
      }
    })

    if (closest) {
      const sat = satellites.find((s) => s.id === (closest as BlipObject).id)
      if (sat) setSelectedObject(sat)
    }
  }

  return (
    <div className={styles.radarWrapper} id="radar-hud-wrapper">
      <canvas
        ref={canvasRef}
        className={styles.radarCanvas}
        width={480}
        height={480}
        onClick={handleCanvasClick}
        role="img"
        aria-label="Overhead radar showing satellite positions"
      />
      <div className={styles.radarLabel}>
        <span className="live-dot" />
        <span className="text-mono text-xs" style={{ color: 'rgba(0,245,255,0.7)' }}>ZENITH RADAR — {location.name}</span>
      </div>
      <div className={styles.blipCount}>
        <span style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: 'rgba(0,245,255,0.6)' }}>
          {blips.length} objects tracked overhead
        </span>
      </div>
    </div>
  )
}
