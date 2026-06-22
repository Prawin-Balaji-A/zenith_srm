'use client'

import { useState, useEffect } from 'react'
import { useZenithStore } from '@/store/zenith'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { activeView, setActiveView } = useZenithStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const views = [
    { id: 'radar',       label: 'Radar',        icon: '📡' },
    { id: 'globe',       label: 'Globe',         icon: '🌍' },
    { id: 'solarsystem', label: 'Solar System',  icon: '🪐' },
  ] as const

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon} aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="url(#logoGrad)" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="6" fill="url(#logoGrad)" opacity="0.8"/>
            <ellipse cx="20" cy="20" rx="18" ry="6" stroke="url(#logoGrad)" strokeWidth="1" opacity="0.5" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#00f5ff" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>ZENITH</span>
          <span className={styles.logoSub}>The Celestial Eye</span>
        </div>
      </div>

      {/* View switcher */}
      <div className={styles.viewSwitcher} role="tablist" aria-label="View mode">
        {views.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={activeView === v.id}
            className={`${styles.viewBtn} ${activeView === v.id ? styles.viewBtnActive : ''}`}
            onClick={() => setActiveView(v.id)}
            id={`nav-view-${v.id}`}
          >
            <span aria-hidden="true">{v.icon}</span>
            <span className={styles.viewLabel}>{v.label}</span>
          </button>
        ))}
      </div>

      {/* Status */}
      <div className={styles.status}>
        <div className={styles.liveIndicator}>
          <span className="live-dot" aria-label="Live data indicator" />
          <span className={styles.liveText}>LIVE</span>
        </div>
        <div className={styles.utcTime} id="nav-utc-clock">
          <LiveClock />
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        className={styles.menuBtn}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        id="nav-menu-toggle"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {views.map((v) => (
            <button
              key={v.id}
              className={`${styles.mobileViewBtn} ${activeView === v.id ? styles.mobileViewBtnActive : ''}`}
              onClick={() => { setActiveView(v.id); setMenuOpen(false) }}
              id={`nav-mobile-view-${v.id}`}
            >
              <span>{v.icon}</span> {v.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}

function LiveClock() {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Force Indian format (with AM/PM and short timezone name like IST)
      const local = now.toLocaleTimeString('en-IN', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZoneName: 'short'
      })
      const utc = now.toISOString().slice(11, 19) + ' UTC'
      setTimeStr(`${local}  ·  ${utc}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return <span style={{ whiteSpace: 'pre' }}>{timeStr || 'Syncing clock...'}</span>
}
