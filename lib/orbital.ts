// Orbital calculation utilities using satellite.js
// Wraps SGP4/SDP4 propagation and elevation angle calculation

import * as satellite from 'satellite.js'

export interface TLEEntry {
  name: string
  line1: string
  line2: string
}

export interface OrbitalPosition {
  lat: number
  lng: number
  alt: number   // km
  vel: number   // km/s
  elevation: number   // degrees above horizon (negative = below horizon)
  azimuth: number     // degrees clockwise from north
  range: number       // km from observer
}

/**
 * Parse a raw TLE text block into an array of TLE entries
 */
export function parseTLEText(raw: string): TLEEntry[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const entries: TLEEntry[] = []

  for (let i = 0; i < lines.length - 2; i++) {
    const name = lines[i]
    const line1 = lines[i + 1]
    const line2 = lines[i + 2]

    // TLE line 1 starts with '1' and line 2 starts with '2'
    if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
      entries.push({ name: name.replace(/^0 /, ''), line1, line2 })
      i += 2
    }
  }

  return entries
}

/**
 * Calculate the current position and look angles of a satellite
 * relative to an observer on Earth
 */
export function propagateSatellite(
  tle: TLEEntry,
  observerLat: number,
  observerLng: number,
  time: Date = new Date()
): OrbitalPosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2)

    // Propagate
    const positionAndVelocity = satellite.propagate(satrec, time)
    if (!positionAndVelocity.position || positionAndVelocity.position === false) return null

    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>

    // Get GMST for coordinate conversion
    const gmst = satellite.gstime(time)

    // Convert ECI to geodetic
    const geodetic = satellite.eciToGeodetic(positionEci, gmst)
    const lat = satellite.radiansToDegrees(geodetic.latitude)
    const lng = satellite.radiansToDegrees(geodetic.longitude)
    const alt = geodetic.height  // km

    // Calculate velocity magnitude
    const vel = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    )

    // Observer position
    const observerGd = {
      longitude: satellite.degreesToRadians(observerLng),
      latitude: satellite.degreesToRadians(observerLat),
      height: 0.01  // km (10 m above sea level)
    }

    // Calculate look angles (elevation, azimuth, range)
    const observerEcf = satellite.geodeticToEcf(observerGd)
    const positionEcf = satellite.eciToEcf(positionEci, gmst)

    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf)

    const elevation = satellite.radiansToDegrees(lookAngles.elevation)
    const azimuth = satellite.radiansToDegrees(lookAngles.azimuth)
    const range = lookAngles.rangeSat

    return { lat, lng, alt, vel, elevation, azimuth, range }
  } catch {
    return null
  }
}

/**
 * Filter satellites that are currently above the horizon (elevation > 0)
 */
export function getOverheadSatellites(
  tles: TLEEntry[],
  observerLat: number,
  observerLng: number,
  time: Date = new Date(),
  minElevation: number = 0
) {
  return tles
    .map((tle) => {
      const pos = propagateSatellite(tle, observerLat, observerLng, time)
      if (!pos) return null
      if (pos.elevation < minElevation) return null
      return { tle, pos }
    })
    .filter(Boolean) as { tle: TLEEntry; pos: OrbitalPosition }[]
}

/**
 * Generate future pass times for a satellite (next 24 hours)
 */
export function predictPasses(
  tle: TLEEntry,
  observerLat: number,
  observerLng: number,
  startTime: Date = new Date(),
  hoursAhead: number = 24,
  stepMinutes: number = 1
): { time: Date; elevation: number; azimuth: number }[] {
  const passes: { time: Date; elevation: number; azimuth: number }[] = []
  const stepMs = stepMinutes * 60 * 1000
  const endTime = new Date(startTime.getTime() + hoursAhead * 3600000)

  let currentTime = new Date(startTime)

  while (currentTime < endTime) {
    const pos = propagateSatellite(tle, observerLat, observerLng, currentTime)
    if (pos && pos.elevation > 0) {
      passes.push({ time: new Date(currentTime), elevation: pos.elevation, azimuth: pos.azimuth })
    }
    currentTime = new Date(currentTime.getTime() + stepMs)
  }

  return passes
}

/**
 * Generate orbit path points (one full orbit)
 */
export function generateOrbitPath(
  tle: TLEEntry,
  startTime: Date = new Date(),
  points: number = 180
): { lat: number; lng: number; alt: number }[] {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2)
    const period = (2 * Math.PI) / satrec.no  // minutes
    const stepMs = (period * 60000) / points

    const path: { lat: number; lng: number; alt: number }[] = []

    for (let i = 0; i < points; i++) {
      const time = new Date(startTime.getTime() + i * stepMs)
      const pv = satellite.propagate(satrec, time)
      if (!pv.position || pv.position === false) continue

      const gmst = satellite.gstime(time)
      const geo = satellite.eciToGeodetic(pv.position as satellite.EciVec3<number>, gmst)

      path.push({
        lat: satellite.radiansToDegrees(geo.latitude),
        lng: satellite.radiansToDegrees(geo.longitude),
        alt: geo.height,
      })
    }

    return path
  } catch {
    return []
  }
}
