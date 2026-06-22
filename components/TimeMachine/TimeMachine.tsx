'use client'

import { useZenithStore } from '@/store/zenith'
import styles from './TimeMachine.module.css'

export default function TimeMachine() {
  const { timeOffset, setTimeOffset, currentTime } = useZenithStore()

  const formatOffset = (hours: number) => {
    if (hours === 0) return 'NOW'
    const sign = hours > 0 ? '+' : ''
    const h = Math.floor(Math.abs(hours))
    const m = Math.round((Math.abs(hours) - h) * 60)
    return `${sign}${hours < 0 ? '-' : ''}${h}h${m > 0 ? ` ${m}m` : ''}`
  }

  const timeStr = currentTime.toUTCString().replace('GMT', 'UTC')

  return (
    <div className={styles.wrapper} id="time-machine-panel">
      <div className={styles.header}>
        <div className={styles.title}>⏱ Zenith Time Machine</div>
        <div className={styles.offsetBadge}>
          {formatOffset(timeOffset)}
        </div>
      </div>

      <div className={styles.timeDisplay} aria-live="polite" id="time-machine-display">
        {timeStr}
      </div>

      <div className={styles.sliderWrapper}>
        <span className={styles.sliderMin}>-12h</span>
        <input
          type="range"
          min={-12}
          max={24}
          step={0.25}
          value={timeOffset}
          onChange={(e) => setTimeOffset(parseFloat(e.target.value))}
          className={styles.slider}
          id="time-machine-slider"
          aria-label="Time offset slider"
        />
        <span className={styles.sliderMax}>+24h</span>
      </div>

      <div className={styles.quickTimes}>
        {[-12, -6, -3, 0, 3, 6, 12, 24].map((h) => (
          <button
            key={h}
            className={`${styles.quickBtn} ${timeOffset === h ? styles.quickBtnActive : ''}`}
            onClick={() => setTimeOffset(h)}
            id={`time-machine-quick-${h}`}
          >
            {h === 0 ? 'NOW' : `${h > 0 ? '+' : ''}${h}h`}
          </button>
        ))}
      </div>

      <div className={styles.hint}>
        {timeOffset !== 0
          ? `Predicting satellite positions for ${formatOffset(timeOffset)} from now`
          : 'Showing live real-time positions'}
      </div>
    </div>
  )
}
