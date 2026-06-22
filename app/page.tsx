'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useZenithStore } from '@/store/zenith'
import { useSatelliteData } from '@/lib/useSatelliteData'
import styles from './page.module.css'

// Dynamic imports for Three.js / browser-only components
const Starfield      = dynamic(() => import('@/components/Starfield/Starfield'),          { ssr: false })
const Globe          = dynamic(() => import('@/components/Globe/Globe'),                  { ssr: false })
const SolarSystem    = dynamic(() => import('@/components/SolarSystem/SolarSystem'),      { ssr: false })
const RadarHUD       = dynamic(() => import('@/components/RadarHUD/RadarHUD'),            { ssr: false })
const Navbar         = dynamic(() => import('@/components/Navbar/Navbar'),                { ssr: false })
const Astronaut      = dynamic(() => import('@/components/Astronaut/Astronaut'),          { ssr: false })
const LocationPicker = dynamic(() => import('@/components/LocationPicker/LocationPicker'),{ ssr: false })
const ObjectPanel    = dynamic(() => import('@/components/ObjectPanel/ObjectPanel'),      { ssr: false })
const SkyScore       = dynamic(() => import('@/components/SkyScore/SkyScore'),            { ssr: false })
const FilterBar      = dynamic(() => import('@/components/FilterBar/FilterBar'),          { ssr: false })
const TimeMachine    = dynamic(() => import('@/components/TimeMachine/TimeMachine'),      { ssr: false })

export default function Home() {
  const { activeView, satellites, isLoading } = useZenithStore()

  // 🚀 Wire up live satellite data (fetches TLEs + propagates every 5s)
  useSatelliteData()

  const overheadCount = satellites.filter(s => s.elevation > 0).length

  return (
    <main className={styles.main}>
      {/* Starfield background */}
      <Starfield />

      {/* Navbar */}
      <Navbar />

      {/* Hero banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroBannerInner}>
          <div className={styles.heroLabel}>
            <span className="live-dot" />
            <span>REAL-TIME COSMIC RADAR</span>
          </div>
          <h1 className={styles.heroTitle}>
            The <span className="gradient-text">Celestial</span> Eye
          </h1>
          <p className={styles.heroSubtitle}>
            Pick any point on Earth. See what's above you right now — satellites, the ISS, planets, and more.
          </p>

          {/* Live stats bar */}
          <div className={styles.statsBar}>
            <div className={styles.statChip} id="stat-overhead-count">
              <span className="live-dot" />
              <span>{isLoading ? '...' : overheadCount} overhead</span>
            </div>
            <div className={styles.statChip} id="stat-total-tracked">
              <span>🛰️</span>
              <span>{satellites.length} tracked</span>
            </div>
            <div className={styles.statChip} id="stat-iss-chip">
              <span>🛸</span>
              <span>ISS: {satellites.find(s => s.type === 'iss') ? `${satellites.find(s => s.type === 'iss')!.alt.toFixed(0)} km` : 'tracking...'}</span>
            </div>
            {isLoading && (
              <div className={styles.statChip} style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                <span>Loading TLEs...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main dashboard */}
      <div className={styles.dashboard}>

        {/* LEFT SIDEBAR */}
        <aside className={styles.sidebar} aria-label="Controls sidebar">

          <section className={`${styles.panel} aurora-card`} aria-labelledby="section-location">
            <h2 className={styles.panelTitle} id="section-location">
              <span>📍</span> Observer Location
            </h2>
            <LocationPicker />
          </section>

          <section className={`${styles.panel} aurora-card`} aria-labelledby="section-filters">
            <h2 className={styles.panelTitle} id="section-filters">
              <span>🎯</span> Filter Objects
            </h2>
            <FilterBar />
          </section>

          <section className={`${styles.panel} aurora-card`} aria-labelledby="section-sky">
            <h2 className={styles.panelTitle} id="section-sky">
              <span>🌌</span> Sky Score
            </h2>
            <SkyScore />
          </section>

          <div className={styles.astronautWrapper}>
            <Astronaut />
          </div>

        </aside>

        {/* CENTER — Main visualization */}
        <section className={styles.center} aria-label="Main visualization">

          {activeView === 'radar' && (
            <div className={styles.radarLayout}>
              <div className={`${styles.vizPanel} aurora-card`}>
                <RadarHUD />
              </div>
              <div className={`${styles.panel} aurora-card`}>
                <h2 className={styles.panelTitle}><span>⏱</span> Time Machine</h2>
                <TimeMachine />
              </div>
            </div>
          )}

          {activeView === 'globe' && (
            <div className={`${styles.vizPanelFull} aurora-card`}>
              <Globe />
            </div>
          )}

          {activeView === 'solarsystem' && (
            <div className={`${styles.vizPanelFull} aurora-card`}>
              <SolarSystem />
            </div>
          )}

        </section>

        {/* RIGHT SIDEBAR */}
        <aside className={styles.rightSidebar} aria-label="Object information">

          <section className={`${styles.panel} aurora-card`} aria-labelledby="section-object">
            <h2 className={styles.panelTitle} id="section-object">
              <span>🛰️</span> Object Details
            </h2>
            <ObjectPanel />
          </section>

          <section className={`${styles.panel} aurora-card`} aria-labelledby="section-iss">
            <h2 className={styles.panelTitle} id="section-iss">
              <span>🛸</span> ISS Live
            </h2>
            <ISSLivePanel />
          </section>

          <section className={`${styles.panel} aurora-card`} aria-labelledby="section-history">
            <h2 className={styles.panelTitle} id="section-history">
              <span>📡</span> Cosmic Comm-Link
            </h2>
            <CosmicCommLink />
          </section>

        </aside>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span>Project Zenith: The Celestial Eye</span>
          <span className={styles.footerDivider}>·</span>
          <span>Data: CelesTrak · Open-Meteo · NASA Horizons</span>
        </div>
      </footer>
    </main>
  )
}

/* ── ISS Live Panel with real satellite data ── */
function ISSLivePanel() {
  const { satellites } = useZenithStore()
  const [showLive, setShowLive] = useState(false)
  const iss = satellites.find(s => s.type === 'iss')

  return (
    <div className={styles.issStats}>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Altitude</span>
        <span className={styles.issVal}>{iss ? `${iss.alt.toFixed(0)} km` : '~420 km'}</span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Speed</span>
        <span className={styles.issVal}>{iss ? `${iss.vel.toFixed(2)} km/s` : '7.66 km/s'}</span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Elevation</span>
        <span className={styles.issVal} style={{ color: iss && iss.elevation > 0 ? '#10b981' : '#f59e0b' }}>
          {iss ? `${iss.elevation.toFixed(1)}°` : 'below horizon'}
        </span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Azimuth</span>
        <span className={styles.issVal}>{iss ? `${iss.azimuth.toFixed(1)}°` : '--'}</span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Latitude</span>
        <span className={styles.issVal}>{iss ? `${iss.lat.toFixed(2)}°` : '--'}</span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Longitude</span>
        <span className={styles.issVal}>{iss ? `${iss.lng.toFixed(2)}°` : '--'}</span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>Crew</span>
        <span className={styles.issVal}>7 astronauts</span>
      </div>
      <div className={styles.issRow}>
        <span className={styles.issLabel}>NORAD ID</span>
        <span className={styles.issVal}>25544</span>
      </div>
      <div className={styles.issProgress}>
        <div className={styles.issProgressLabel}>Orbit Progress</div>
        <div className={styles.issProgressTrack}>
          <div className={styles.issProgressFill} />
        </div>
      </div>

      <button 
        onClick={() => setShowLive(true)}
        className="aurora-btn"
        style={{ width: '100%', marginTop: '1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
      >
        <span style={{ color: '#ef4444' }}>🔴</span> WATCH LIVE CAMERA
      </button>

      {iss && iss.elevation > 0 && (
        <div className={styles.issVisible}>
          ✨ ISS visible overhead right now!
        </div>
      )}

      {showLive && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <button onClick={() => setShowLive(false)} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'transparent', color: '#fff', border: 'none', fontSize: '3rem', cursor: 'pointer' }}>×</button>
          <h2 style={{ color: '#fff', marginBottom: '1rem', fontWeight: 'normal' }}><span style={{ color: '#ef4444' }}>🔴</span> LIVE: ISS Exterior Cameras</h2>
          <iframe width="853" height="480" src="https://www.youtube.com/embed/FuuC4dpSQ1M?autoplay=1&mute=1" title="NASA Live" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}></iframe>
        </div>
      )}
    </div>
  )
}

function CosmicCommLink() {
  const [news, setNews] = useState<any[]>([])
  const [launch, setLaunch] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/news').then(r => r.json()).catch(() => []),
      fetch('/api/launches').then(r => r.json()).catch(() => null)
    ]).then(([newsData, launchData]) => {
      setNews(newsData || [])
      setLaunch(launchData)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className={styles.cosmicCards} style={{ padding: '1rem', color: '#88a' }}>Establishing Comm-Link...</div>

  return (
    <div className={styles.cosmicCards}>
      {/* Next Launch Countdown */}
      {launch && (
        <div className={styles.cosmicCard} style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className={styles.cosmicIcon}>🚀</div>
          <div className={styles.cosmicContent}>
            <div className={styles.cosmicDate} style={{ color: '#10b981' }}>NEXT LAUNCH</div>
            <div className={styles.cosmicTitle}>{launch.name}</div>
            <div className={styles.cosmicDesc}>
              {new Date(launch.net).toLocaleString()} <br/>
              {launch.pad?.location?.name}
            </div>
          </div>
        </div>
      )}
      
      {/* Space News */}
      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="live-dot" /> LIVE SPACE NEWS
      </div>
      {news.slice(0, 3).map((item, i) => (
        <a key={i} href={item.url} target="_blank" rel="noreferrer" className={styles.cosmicCard} style={{ textDecoration: 'none' }}>
          <div className={styles.cosmicIcon}>📰</div>
          <div className={styles.cosmicContent}>
            <div className={styles.cosmicDate}>{new Date(item.published_at).toLocaleDateString()}</div>
            <div className={styles.cosmicTitle} style={{ color: 'var(--text-primary)' }}>{item.title}</div>
            <div className={styles.cosmicDesc}>{item.news_site}</div>
          </div>
        </a>
      ))}
    </div>
  )
}
