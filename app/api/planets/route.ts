import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// NASA Horizons API wrapper for planet positions
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = searchParams.get('lat') || '28.6139'
  const lng = searchParams.get('lng') || '77.2090'

  const planets = [
    { name: 'Mercury', target: '199' },
    { name: 'Venus',   target: '299' },
    { name: 'Mars',    target: '499' },
    { name: 'Jupiter', target: '599' },
    { name: 'Saturn',  target: '699' },
    { name: 'Uranus',  target: '799' },
    { name: 'Neptune', target: '899' },
  ]

  const now = new Date()
  const startTime = now.toISOString().split('T')[0]
  const endTime = new Date(now.getTime() + 86400000).toISOString().split('T')[0]

  const results = await Promise.allSettled(
    planets.map(async (planet) => {
      const params = new URLSearchParams({
        format: 'json',
        COMMAND: `'${planet.target}'`,
        OBJ_DATA: 'NO',
        MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'OBSERVER',
        CENTER: `'coord@399'`,
        COORD_TYPE: 'GEODETIC',
        SITE_COORD: `'${lng},${lat},0'`,
        START_TIME: `'${startTime}'`,
        STOP_TIME: `'${endTime}'`,
        STEP_SIZE: `'1 d'`,
        QUANTITIES: `'4,20,9'`,  // RA/Dec, Elev/Az, Visual magnitude
      })

      const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`
      const response = await fetch(url, { next: { revalidate: 3600 } })
      const data = await response.json()

      // Parse the result
      const lines: string[] = data.result?.split('\n') || []
      const dataIdx = lines.findIndex((l: string) => l.includes('$$SOE'))
      if (dataIdx === -1) return null

      const dataLine = lines[dataIdx + 1]
      if (!dataLine) return null

      // Extract elevation and azimuth from the data line
      const parts = dataLine.trim().split(/\s+/)

      return {
        name: planet.name,
        elevation: parseFloat(parts[5] || '0'),
        azimuth: parseFloat(parts[4] || '0'),
        magnitude: parseFloat(parts[6] || '0'),
        ra: parts[2] || '00:00:00',
        dec: parts[3] || '+00:00:00',
        distance: parseFloat(parts[7] || '1'),
      }
    })
  )

  const planetData = results
    .map((r) => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean)

  return Response.json({ planets: planetData }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
}
