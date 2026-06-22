'use client'

import { useEffect } from 'react'
import { useZenithStore } from '@/store/zenith'
import styles from './SkyScore.module.css'

export default function SkyScore() {
  const { location, cloudCover, skyScore, setWeather } = useZenithStore()

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${location.lat}&lng=${location.lng}`)
        const data = await res.json()
        setWeather(data.cloudCover || 0)
      } catch {
        setWeather(10)
      }
    }
    fetchWeather()
    const interval = setInterval(fetchWeather, 30 * 60 * 1000)  // every 30 min
    return () => clearInterval(interval)
  }, [location, setWeather])

  const scoreColor = skyScore >= 7 ? '#10b981' : skyScore >= 4 ? '#f59e0b' : '#f43f5e'
  const scoreLabel = skyScore >= 7 ? 'Excellent' : skyScore >= 4 ? 'Moderate' : 'Poor'
  const bortleScale = cloudCover < 20 ? 3 : cloudCover < 50 ? 5 : cloudCover < 80 ? 7 : 9

  return (
    <div className={styles.wrapper} id="sky-score-panel">
      <div className={styles.title}>Sky Visibility</div>

      {/* Score ring */}
      <div className={styles.scoreRing}>
        <svg viewBox="0 0 100 100" className={styles.scoreCircle}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={scoreColor}
            strokeWidth="8"
            strokeDasharray={`${(skyScore / 10) * 251.2} 251.2`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 1s ease, stroke 0.5s ease' }}
          />
        </svg>
        <div className={styles.scoreCenter}>
          <div className={styles.scoreNum} style={{ color: scoreColor }}>{skyScore.toFixed(1)}</div>
          <div className={styles.scoreMax}>/10</div>
          <div className={styles.scoreLabel} style={{ color: scoreColor }}>{scoreLabel}</div>
        </div>
      </div>

      {/* Factors */}
      <div className={styles.factors}>
        <div className={styles.factor}>
          <span className={styles.factorIcon}>☁️</span>
          <div className={styles.factorBar}>
            <div className={styles.factorLabel}>Cloud Cover</div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${cloudCover}%`, background: cloudCover < 30 ? '#10b981' : cloudCover < 60 ? '#f59e0b' : '#f43f5e' }}
              />
            </div>
          </div>
          <span className={styles.factorVal}>{cloudCover}%</span>
        </div>

        <div className={styles.factor}>
          <span className={styles.factorIcon}>🌃</span>
          <div className={styles.factorBar}>
            <div className={styles.factorLabel}>Bortle Scale</div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${(bortleScale / 9) * 100}%`, background: bortleScale <= 3 ? '#10b981' : bortleScale <= 6 ? '#f59e0b' : '#f43f5e' }}
              />
            </div>
          </div>
          <span className={styles.factorVal}>{bortleScale}/9</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className={styles.recommendation} style={{ borderColor: `${scoreColor}30`, background: `${scoreColor}0a` }}>
        <span style={{ color: scoreColor }}>
          {skyScore >= 7
            ? '✨ Great conditions for stargazing tonight!'
            : skyScore >= 4
            ? '🌤 Partial visibility — check again later.'
            : '☁️ Heavy cloud cover — visibility poor.'}
        </span>
      </div>
    </div>
  )
}
