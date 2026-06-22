'use client'

import { useZenithStore, FilterType } from '@/store/zenith'
import styles from './FilterBar.module.css'

const FILTERS: { id: FilterType; label: string; icon: string; color: string }[] = [
  { id: 'iss',           label: 'ISS',          icon: '🛸', color: '#00f5ff' },
  { id: 'active',        label: 'Satellites',   icon: '🛰️', color: '#10b981' },
  { id: 'debris',        label: 'Debris',       icon: '⚠️', color: '#f59e0b' },
  { id: 'weather',       label: 'Weather',      icon: '☁️', color: '#60a5fa' },
  { id: 'navigation',    label: 'Navigation',   icon: '🧭', color: '#a855f7' },
  { id: 'planets',       label: 'Planets',      icon: '🪐', color: '#f97316' },
  { id: 'constellations',label: 'Stars',        icon: '✨', color: '#fbbf24' },
]

export default function FilterBar() {
  const { activeFilters, toggleFilter, showDebrisLens, toggleDebrisLens, showConstellations, toggleConstellations } = useZenithStore()

  return (
    <div className={styles.wrapper} id="filter-bar" role="group" aria-label="Object filters">
      <div className={styles.label}>Filter Objects</div>
      <div className={styles.filters}>
        {FILTERS.map((f) => {
          const active = activeFilters.has(f.id)
          return (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${active ? styles.filterBtnActive : ''}`}
              onClick={() => toggleFilter(f.id)}
              style={active ? {
                borderColor: `${f.color}50`,
                boxShadow: `0 0 12px ${f.color}20`,
                background: `${f.color}12`,
                color: f.color,
              } : {}}
              aria-pressed={active}
              id={`filter-${f.id}`}
            >
              <span className={styles.filterIcon}>{f.icon}</span>
              <span className={styles.filterLabel}>{f.label}</span>
            </button>
          )
        })}
      </div>

      {/* Special toggles */}
      <div className={styles.specials}>
        <button
          className={`${styles.specialBtn} ${showDebrisLens ? styles.specialBtnActive : ''}`}
          onClick={toggleDebrisLens}
          aria-pressed={showDebrisLens}
          id="toggle-debris-lens"
        >
          🔭 Debris Lens {showDebrisLens ? 'ON' : 'OFF'}
        </button>
        <button
          className={`${styles.specialBtn} ${showConstellations ? styles.specialBtnActive : ''}`}
          onClick={toggleConstellations}
          aria-pressed={showConstellations}
          id="toggle-constellations"
        >
          ⭐ Constellations {showConstellations ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  )
}
