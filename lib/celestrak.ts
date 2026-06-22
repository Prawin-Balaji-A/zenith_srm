// CelesTrak TLE data fetching, parsing, and classification utilities
import type { TLEEntry } from './orbital'

export type TLEGroup = 'stations' | 'active' | 'debris' | 'weather' | 'navigation' | 'visual'

// ISS NORAD ID
export const ISS_NORAD_ID = 25544

/**
 * Parse a raw TLE text block into an array of TLE entries.
 * Exported here so both client-side hooks and server-side code can use it.
 */
export function parseTLEText(raw: string): TLEEntry[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const entries: TLEEntry[] = []

  for (let i = 0; i < lines.length - 2; i++) {
    const name  = lines[i]
    const line1 = lines[i + 1]
    const line2 = lines[i + 2]

    if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
      entries.push({ name: name.replace(/^0 /, '').trim(), line1, line2 })
      i += 2
    }
  }
  return entries
}

/**
 * Re-export propagateSatellite so callers only need one import.
 */
export { propagateSatellite } from './orbital'

// Satellite type classification based on name patterns
export function classifySatellite(name: string): 'iss' | 'station' | 'active' | 'debris' | 'weather' | 'navigation' {
  const n = name.toUpperCase()
  if (n.includes('ISS') || n.includes('ZARYA'))                                   return 'iss'
  if (n.includes('CSS') || n.includes('TIANGONG'))                                return 'station'
  if (n.includes('DEB') || n.includes('R/B') || n.includes('DEBRIS'))             return 'debris'
  if (n.includes('NOAA') || n.includes('METEOSAT') || n.includes('GOES'))         return 'weather'
  if (n.includes('GPS') || n.includes('GLONASS') || n.includes('GALILEO') || n.includes('NAVSTAR')) return 'navigation'
  return 'active'
}

// Country code extraction from satellite name
export function extractCountry(satName: string): string {
  const n = satName.toUpperCase()
  if (n.includes('ISS') || n.includes('ZARYA'))    return 'International'
  if (n.includes('STARLINK'))                       return 'USA'
  if (n.includes('ONEWEB'))                         return 'UK/USA'
  if (n.includes('TIANGONG') || n.includes('CSS'))  return 'China'
  if (n.includes('NOAA') || n.includes('GPS'))      return 'USA'
  if (n.includes('METEOSAT'))                       return 'ESA'
  if (n.includes('IRIDIUM'))                        return 'USA'
  if (n.includes('SENTINEL'))                       return 'ESA'
  return 'Unknown'
}
