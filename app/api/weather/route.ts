import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = searchParams.get('lat') || '28.6139'
  const lng = searchParams.get('lng') || '77.2090'

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=cloud_cover,weather_code,visibility&hourly=cloud_cover&forecast_days=1`

  try {
    const response = await fetch(url, { next: { revalidate: 1800 } })  // 30 min cache
    if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`)

    const data = await response.json()
    const cloudCover = data.current?.cloud_cover ?? 0
    const visibility = data.current?.visibility ?? 10000

    return Response.json({
      cloudCover,
      visibility,
      weatherCode: data.current?.weather_code ?? 0,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  } catch (error) {
    return Response.json({ cloudCover: 0, visibility: 10000, weatherCode: 0 }, { status: 200 })
  }
}
