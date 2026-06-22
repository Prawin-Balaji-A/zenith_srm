import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache TLE data for 2 hours
const cache = new Map<string, { data: string; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 60 * 1000  // 2 hours

const TLE_SOURCES: Record<string, string> = {
  stations:   'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
  active:     'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
  debris:     'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle',
  weather:    'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
  navigation: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gnss&FORMAT=tle',
  visual:     'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle',
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const group = searchParams.get('group') || 'stations'

  const url = TLE_SOURCES[group]
  if (!url) {
    return Response.json({ error: 'Invalid TLE group' }, { status: 400 })
  }

  // Check cache
  const cached = cache.get(group)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(cached.data, {
      headers: {
        'Content-Type': 'text/plain',
        'X-Cache': 'HIT',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ProjectZenith/1.0 (educational project)' },
      next: { revalidate: 7200 },  // Next.js cache for 2 hours
    })

    if (!response.ok) {
      throw new Error(`CelesTrak returned ${response.status}`)
    }

    const text = await response.text()

    // Update cache
    cache.set(group, { data: text, timestamp: Date.now() })

    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain',
        'X-Cache': 'MISS',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    // Return cached data even if stale on error
    if (cached) {
      return new Response(cached.data, {
        headers: {
          'Content-Type': 'text/plain',
          'X-Cache': 'STALE',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return Response.json(
      { error: 'Failed to fetch TLE data', details: String(error) },
      { status: 502 }
    )
  }
}
