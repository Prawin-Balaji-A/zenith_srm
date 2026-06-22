import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // cache for 1 hour

export async function GET() {
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=1', {
      next: { revalidate: 3600 }
    })
    if (!res.ok) throw new Error('Failed to fetch launches')
    const data = await res.json()
    return NextResponse.json(data.results[0])
  } catch (err) {
    // Mock data fallback if dev API rate limit is exceeded
    return NextResponse.json({
      name: "Falcon 9 Block 5 | Starlink Group 8-2",
      net: new Date(Date.now() + 86400000).toISOString(),
      pad: { location: { name: "Cape Canaveral, FL, USA" } },
      launch_service_provider: { name: "SpaceX" }
    })
  }
}
