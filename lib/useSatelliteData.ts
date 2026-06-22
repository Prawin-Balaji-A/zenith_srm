'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useZenithStore, SatelliteObject } from '@/store/zenith'
import { parseTLEText, propagateSatellite, classifySatellite, extractCountry } from '@/lib/celestrak'
import type { TLEEntry } from '@/lib/orbital'

const REFRESH_INTERVAL_MS = 5000   // propagate every 5s
const TLE_CACHE_MS        = 2 * 60 * 60 * 1000  // re-fetch TLEs every 2h

const tleCache: Record<string, { data: string; fetchedAt: number }> = {}

async function fetchTLEGroup(group: string): Promise<TLEEntry[]> {
  const now = Date.now()
  if (tleCache[group] && now - tleCache[group].fetchedAt < TLE_CACHE_MS) {
    return parseTLEText(tleCache[group].data)
  }

  try {
    const res = await fetch(`/api/tle?group=${group}`)
    if (!res.ok) throw new Error(`TLE fetch failed: ${res.status}`)
    const text = await res.text()
    tleCache[group] = { data: text, fetchedAt: now }
    return parseTLEText(text)
  } catch (err) {
    console.warn(`Could not fetch TLE group "${group}":`, err)
    return []
  }
}

export function useSatelliteData() {
  const { location, activeFilters, timeOffset, setSatellites, setIsLoading } = useZenithStore()

  const locationRef     = useRef(location)
  const filtersRef      = useRef(activeFilters)
  const timeOffsetRef   = useRef(timeOffset)
  const tlesRef         = useRef<TLEEntry[]>([])
  const timerRef        = useRef<NodeJS.Timeout>()

  useEffect(() => { locationRef.current   = location },   [location])
  useEffect(() => { filtersRef.current    = activeFilters }, [activeFilters])
  useEffect(() => { timeOffsetRef.current = timeOffset },  [timeOffset])

  /** Propagate all cached TLEs to current (or offset) time */
  const propagate = useCallback(() => {
    const { lat, lng } = locationRef.current
    const time = timeOffsetRef.current === 0
      ? new Date()
      : new Date(Date.now() + timeOffsetRef.current * 3600_000)

    const results: SatelliteObject[] = []

    for (const tle of tlesRef.current) {
      const pos = propagateSatellite(tle, lat, lng, time)
      if (!pos) continue
      if (pos.elevation < -10) continue   // well below horizon, skip

      const type = classifySatellite(tle.name)

      // Apply filter
      const filters = filtersRef.current
      if (type === 'iss'        && !filters.has('iss'))        continue
      if (type === 'station'    && !filters.has('iss'))         continue
      if (type === 'active'     && !filters.has('active'))      continue
      if (type === 'debris'     && !filters.has('debris'))      continue
      if (type === 'weather'    && !filters.has('weather'))     continue
      if (type === 'navigation' && !filters.has('navigation'))  continue

      // Parse NORAD ID from TLE line 1
      const noradId = parseInt(tle.line1.slice(2, 7).trim(), 10) || 0

      results.push({
        name:      tle.name,
        id:        noradId,
        lat:       pos.lat,
        lng:       pos.lng,
        alt:       pos.alt,
        vel:       pos.vel,
        elevation: pos.elevation,
        azimuth:   pos.azimuth,
        type,
        country:   extractCountry(tle.name),
        tle1:      tle.line1,
        tle2:      tle.line2,
      })
    }

    // Sort: overhead first (elevation > 0), then by elevation descending
    results.sort((a, b) => {
      if (a.elevation > 0 && b.elevation <= 0) return -1
      if (a.elevation <= 0 && b.elevation > 0) return 1
      return b.elevation - a.elevation
    })

    setSatellites(results.slice(0, 300))
  }, [setSatellites])

  /** Fetch TLE data and trigger propagation */
  const loadTLEs = useCallback(async () => {
    setIsLoading(true)
    const groups = ['stations', 'active', 'visual']
    const allTLEs: TLEEntry[] = []

    for (const g of groups) {
      const tles = await fetchTLEGroup(g)
      allTLEs.push(...tles)
    }

    // Deduplicate by name
    const seen = new Set<string>()
    tlesRef.current = allTLEs.filter((t) => {
      if (seen.has(t.name)) return false
      seen.add(t.name)
      return true
    })

    setIsLoading(false)
    propagate()
  }, [propagate, setIsLoading])

  /** Start propagation loop */
  const startLoop = useCallback(() => {
    clearInterval(timerRef.current)
    propagate()
    timerRef.current = setInterval(propagate, REFRESH_INTERVAL_MS)
  }, [propagate])

  /** Initial load + TLE refresh every 2h */
  useEffect(() => {
    loadTLEs()
    const tleRefresh = setInterval(loadTLEs, TLE_CACHE_MS)
    return () => clearInterval(tleRefresh)
  }, [loadTLEs])

  /** Restart propagation loop when location or filters change */
  useEffect(() => {
    startLoop()
    return () => clearInterval(timerRef.current)
  }, [location, activeFilters, timeOffset, startLoop])
}
