"use client"

import type React from "react"
import { useState, useEffect } from "react"
import styles from "./styles.module.scss"
import { ReferralData } from "@/utils/referral/types"

interface ReferralStatsProps {
  data: ReferralData
}

const ReferralStats: React.FC<ReferralStatsProps> = ({ data }) => {
  const [animatedStats, setAnimatedStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
  })

  useEffect(() => {
    const animateNumbers = () => {
      const duration = 2000
      const steps = 60
      const stepDuration = duration / steps

      let currentStep = 0
      const interval = setInterval(() => {
        currentStep++
        const progress = currentStep / steps

        setAnimatedStats({
          totalReferrals: Math.floor(data.totalReferrals * progress),
          activeReferrals: Math.floor(data.activeReferrals * progress),
          totalEarned: Math.floor(data.totalEarned * progress),
        })

        if (currentStep >= steps) {
          clearInterval(interval)
          setAnimatedStats({
            totalReferrals: data.totalReferrals,
            activeReferrals: data.activeReferrals,
            totalEarned: data.totalEarned,
          })
        }
      }, stepDuration)

      return () => clearInterval(interval)
    }

    animateNumbers()
  }, [data])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toFixed(2).toString()
  }

  const progressPct = Math.min(
    (data.xp / data.xpForNextLevel) * 100,
    100
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>📊 Your Referral Stats</h2>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{animatedStats.totalReferrals}</div>
            <div className={styles.statLabel}>Total Referrals</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}>🟢</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{animatedStats.activeReferrals}</div>
            <div className={styles.statLabel}>Active Players</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.gold}`}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{formatNumber(animatedStats.totalEarned)}</div>
            <div className={styles.statLabel}>PHORSE Earned</div>
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className={styles.levelProgress}>
        <div className={styles.levelInfo}>
          <span className={styles.currentLevel}>Level {data.level}</span>
          <span className={styles.nextLevel}>Next: Level {data.level + 1}</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
        <div className={styles.progressText}>
          {data.xp}/{data.xpForNextLevel} XP to next level
        </div>
      </div>

      {/* Referred Players List */}
      {data.referredPlayers && data.referredPlayers.length > 0 && (
        <div className={styles.referredPlayers}>
          <h3>Referred Players</h3>
          <ul>
            {data.referredPlayers.map((player, idx) => (
              <li key={idx}>
                <span className={styles.displayName}>{`${player.displayName}`}</span>
                <span
                  className={`${styles.statusIcon} ${
                    player.active ? styles.active : styles.inactive
                  }`}
                >
                  ●
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ReferralStats
