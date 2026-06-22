'use client'

import { useState, useCallback } from 'react'
import { useZenithStore } from '@/store/zenith'
import styles from './LocationPicker.module.css'

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

const QUICK_LOCATIONS = [
  { name: 'New Delhi',     lat: 28.6139, lng: 77.2090  },
  { name: 'New York',      lat: 40.7128, lng: -74.0060 },
  { name: 'London',        lat: 51.5074, lng: -0.1278  },
  { name: 'Tokyo',         lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney',        lat: -33.8688, lng: 151.2093 },
  { name: 'São Paulo',     lat: -23.5505, lng: -46.6333 },
  { name: 'Dubai',         lat: 25.2048, lng: 55.2708  },
  { name: 'Cape Town',     lat: -33.9249, lng: 18.4241  },
]

export default function LocationPicker() {
  const { location, setLocation } = useZenithStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); return }
    setSearching(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      const data: SearchResult[] = await res.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    const timer = setTimeout(() => search(val), 400)
    return () => clearTimeout(timer)
  }

  const selectResult = (r: SearchResult) => {
    const name = r.display_name.split(',').slice(0, 2).join(', ')
    setLocation({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), name })
    setQuery('')
    setResults([])
  }

  const selectQuick = (loc: typeof QUICK_LOCATIONS[0]) => {
    setLocation({ lat: loc.lat, lng: loc.lng, name: loc.name })
  }

  return (
    <div className={styles.wrapper} id="location-picker">
      <div className={styles.currentLocation}>
        <div className={styles.locationIcon}>📍</div>
        <div className={styles.locationInfo}>
          <div className={styles.locationName}>{location.name}</div>
          <div className={styles.locationCoords}>
            {location.lat.toFixed(4)}°{location.lat >= 0 ? 'N' : 'S'}&nbsp;
            {Math.abs(location.lng).toFixed(4)}°{location.lng >= 0 ? 'E' : 'W'}
          </div>
        </div>
      </div>

      <div className={styles.searchWrapper}>
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search any city..."
            value={query}
            onChange={handleInput}
            id="location-search-input"
            aria-label="Search for a location"
            autoComplete="off"
          />
          {searching && <span className={styles.spinner} aria-label="Searching" />}
        </div>

        {results.length > 0 && (
          <div className={styles.results} role="listbox" aria-label="Location search results">
            {results.map((r, i) => (
              <button
                key={i}
                className={styles.result}
                onClick={() => selectResult(r)}
                role="option"
                id={`location-result-${i}`}
              >
                <span className={styles.resultIcon}>🌍</span>
                <span className={styles.resultName}>{r.display_name.split(',').slice(0, 3).join(', ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.quickLocations}>
        <div className={styles.quickLabel}>Quick pick</div>
        <div className={styles.quickGrid}>
          {QUICK_LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              className={`${styles.quickBtn} ${location.name === loc.name ? styles.quickBtnActive : ''}`}
              onClick={() => selectQuick(loc)}
              id={`quick-location-${loc.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {loc.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
