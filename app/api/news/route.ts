import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // cache for 5 minutes

export async function GET() {
  try {
    const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=3', {
      next: { revalidate: 300 }
    })
    if (!res.ok) throw new Error('Failed to fetch news')
    const data = await res.json()
    return NextResponse.json(data.results)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch space news' }, { status: 500 })
  }
}
