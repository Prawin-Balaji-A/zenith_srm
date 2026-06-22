'use client'

import { useZenithStore } from '@/store/zenith'
import styles from './ObjectPanel.module.css'

export default function ObjectPanel() {
  const { selectedObject, setSelectedObject } = useZenithStore()

  if (!selectedObject) {
    return (
      <div className={styles.emptyPanel} id="object-info-panel">
        <div className={styles.emptyIcon}>📡</div>
        <p className={styles.emptyText}>Click any blip on the radar<br />to view object details</p>
      </div>
    )
  }

  const typeLabel: Record<string, { label: string; icon: string; color: string }> = {
    iss:        { label: 'Space Station', icon: '🛸', color: '#00f5ff' },
    station:    { label: 'Space Station', icon: '🛸', color: '#00f5ff' },
    active:     { label: 'Active Satellite', icon: '🛰️', color: '#10b981' },
    debris:     { label: 'Orbital Debris', icon: '⚠️', color: '#f59e0b' },
    navigation: { label: 'Navigation Sat', icon: '🧭', color: '#a855f7' },
    weather:    { label: 'Weather Sat', icon: '☁️', color: '#60a5fa' },
  }

  const info = typeLabel[selectedObject.type] || typeLabel.active

  return (
    <div className={styles.panel} id="object-info-panel">
      <button
        className={styles.closeBtn}
        onClick={() => setSelectedObject(null)}
        aria-label="Close object info"
      >✕</button>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.typeIcon}>{info.icon}</div>
        <div>
          <div className={styles.objectName}>{selectedObject.name}</div>
          <div className={styles.typeLabel} style={{ color: info.color }}>{info.label}</div>
        </div>
        <div className={styles.liveChip}>
          <span className="live-dot" />
          <span>LIVE</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <StatBox label="Altitude" value={`${selectedObject.alt.toFixed(0)} km`} sub="above Earth" color="#00f5ff" id="stat-altitude" />
        <StatBox label="Velocity" value={`${selectedObject.vel.toFixed(2)} km/s`} sub={`${(selectedObject.vel * 3600).toFixed(0)} km/h`} color="#10b981" id="stat-velocity" />
        <StatBox label="Elevation" value={`${selectedObject.elevation.toFixed(1)}°`} sub="above horizon" color="#a855f7" id="stat-elevation" />
        <StatBox label="Azimuth" value={`${selectedObject.azimuth.toFixed(1)}°`} sub={getCompassDir(selectedObject.azimuth)} color="#f59e0b" id="stat-azimuth" />
      </div>

      {/* Details */}
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>NORAD ID</span>
          <span className={styles.detailVal}>{selectedObject.id}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Country</span>
          <span className={styles.detailVal}>{selectedObject.country || 'Unknown'}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Latitude</span>
          <span className={styles.detailVal}>{selectedObject.lat.toFixed(3)}°</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Longitude</span>
          <span className={styles.detailVal}>{selectedObject.lng.toFixed(3)}°</span>
        </div>
      </div>

      {/* Orbit period estimate */}
      <div className={styles.orbitInfo}>
        <div className={styles.orbitLabel}>Est. Orbital Period</div>
        <div className={styles.orbitValue}>{estimateOrbitalPeriod(selectedObject.alt)}</div>
      </div>
    </div>
  )
}

function StatBox({ label, value, sub, color, id }: { label: string; value: string; sub: string; color: string; id: string }) {
  return (
    <div className={styles.statBox} id={id}>
      <div className={styles.statVal} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  )
}

function getCompassDir(azimuth: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(azimuth / 22.5) % 16]
}

function estimateOrbitalPeriod(altKm: number): string {
  const earthRadius = 6371  // km
  const mu = 398600.4418  // km³/s²
  const a = earthRadius + altKm
  const period = 2 * Math.PI * Math.sqrt(a ** 3 / mu)
  const minutes = Math.round(period / 60)
  return `~${minutes} min`
}
