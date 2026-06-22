'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './Astronaut.module.css'

const SPACE_FACTS = [
  "The ISS travels at 28,000 km/h — it orbits Earth every 90 minutes!",
  "There are over 27,000 pieces of orbital debris tracked by NASA.",
  "Light from the Sun takes 8 minutes 20 seconds to reach Earth.",
  "The Milky Way has 200-400 billion stars.",
  "A day on Venus is longer than a year on Venus.",
  "Saturn's rings are only about 10 meters thick on average.",
  "The footprints on the Moon will last millions of years — no wind!",
  "Neutron stars are so dense, a teaspoon weighs a billion tonnes.",
]

export default function Astronaut() {
  const [showBubble, setShowBubble] = useState(false)
  const [fact, setFact] = useState(SPACE_FACTS[0])
  const [waving, setWaving] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const handleClick = () => {
    setFact(SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)])
    setShowBubble(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShowBubble(false), 5000)
  }

  const handleHover = () => {
    setWaving(true)
    setTimeout(() => setWaving(false), 1500)
  }

  useEffect(() => {
    // Auto-show a fact every 30 seconds
    const interval = setInterval(() => {
      setFact(SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)])
      setShowBubble(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setShowBubble(false), 6000)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.astronautContainer} id="astronaut-character">
      {/* Speech bubble */}
      {showBubble && (
        <div className={styles.speechBubble} role="status" aria-live="polite">
          <div className={styles.bubbleTail} />
          <p>{fact}</p>
          <button
            className={styles.closeBubble}
            onClick={(e) => { e.stopPropagation(); setShowBubble(false) }}
            aria-label="Close fact bubble"
          >✕</button>
        </div>
      )}

      {/* Tether line */}
      <svg className={styles.tether} viewBox="0 0 4 80" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M 2 0 Q 3 20 2 40 Q 1 60 2 80"
          stroke="rgba(0,245,255,0.35)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 3"
        />
      </svg>

      {/* Astronaut SVG */}
      <button
        className={`${styles.astronaut} ${waving ? styles.waving : ''}`}
        onClick={handleClick}
        onMouseEnter={handleHover}
        aria-label="Astronaut — click for a space fact"
        title="Click me for a space fact!"
      >
        <svg
          viewBox="0 0 80 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.astronautSvg}
        >
          {/* Helmet */}
          <ellipse cx="40" cy="28" rx="22" ry="25" fill="#d0d8e8" />
          <ellipse cx="40" cy="28" rx="22" ry="25" fill="url(#helmetGrad)" />
          {/* Visor */}
          <ellipse cx="40" cy="30" rx="14" ry="13" fill="url(#visorGrad)" />
          {/* Visor shine */}
          <ellipse cx="33" cy="24" rx="5" ry="4" fill="rgba(255,255,255,0.3)" transform="rotate(-15 33 24)" />

          {/* Body suit */}
          <rect x="20" y="48" width="40" height="38" rx="14" fill="#c8d4e8" />
          <rect x="20" y="48" width="40" height="38" rx="14" fill="url(#suitGrad)" />

          {/* Chest panel */}
          <rect x="28" y="56" width="24" height="18" rx="5" fill="rgba(0,245,255,0.15)" stroke="rgba(0,245,255,0.4)" strokeWidth="1" />
          <circle cx="35" cy="63" r="2" fill="#10b981" />
          <circle cx="42" cy="63" r="2" fill="#f59e0b" />
          <rect x="31" y="68" width="18" height="2" rx="1" fill="rgba(0,245,255,0.4)" />

          {/* Left arm */}
          <rect x="4" y="50" width="14" height="28" rx="7" fill="#c8d4e8" className={styles.leftArm} />
          {/* Left glove */}
          <ellipse cx="11" cy="80" rx="7" ry="6" fill="#a8b8cc" />

          {/* Right arm (waving) */}
          <g className={styles.rightArm}>
            <rect x="62" y="50" width="14" height="28" rx="7" fill="#c8d4e8" />
            {/* Right glove */}
            <ellipse cx="69" cy="80" rx="7" ry="6" fill="#a8b8cc" />
          </g>

          {/* Legs */}
          <rect x="25" y="82" width="13" height="16" rx="6" fill="#b0c0d8" />
          <rect x="42" y="82" width="13" height="16" rx="6" fill="#b0c0d8" />
          {/* Boots */}
          <ellipse cx="31" cy="97" rx="8" ry="4" fill="#8898b0" />
          <ellipse cx="48" cy="97" rx="8" ry="4" fill="#8898b0" />

          {/* Backpack */}
          <rect x="58" y="52" width="10" height="20" rx="4" fill="#b0bfd4" />

          {/* Agency patch */}
          <circle cx="33" cy="55" r="4" fill="rgba(124,58,237,0.5)" />
          <text x="33" y="57.5" textAnchor="middle" fill="white" fontSize="4" fontFamily="sans-serif">Z</text>

          {/* Helmet reflection lines */}
          <line x1="30" y1="20" x2="28" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          <defs>
            <radialGradient id="helmetGrad" cx="35%" cy="30%">
              <stop stopColor="rgba(255,255,255,0.3)" />
              <stop offset="1" stopColor="rgba(200,212,230,0)" />
            </radialGradient>
            <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#1a3a6a" />
              <stop offset="0.5" stopColor="#0d2a5a" />
              <stop offset="1" stopColor="#1a4a8a" />
            </linearGradient>
            <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="rgba(255,255,255,0.15)" />
              <stop offset="1" stopColor="rgba(0,0,0,0.15)" />
            </linearGradient>
          </defs>
        </svg>
      </button>
    </div>
  )
}
