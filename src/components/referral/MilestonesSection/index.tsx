"use client"

import type React from "react"
import styles from "./styles.module.scss"
import { Milestone } from "@/utils/referral/types"

interface MilestonesSectionProps {
  totalReferrals: number
  milestones: Milestone[]
  onClaimReward: (milestoneId: string) => void
}

const MilestonesSection: React.FC<MilestonesSectionProps> = ({ totalReferrals, milestones, onClaimReward }) => {
  const getMilestoneStatus = (milestone: Milestone) => {
    if (milestone.claimed) return "claimed"
    if (totalReferrals >= milestone.requiredReferrals) return "available"
    return "locked"
  }

  const getProgressPercentage = (milestone: Milestone) => {
    return Math.min((totalReferrals / milestone.requiredReferrals) * 100, 100)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{"🏆 Referral Milestones"}</h2>
        <p className={styles.subtitle}>{"Unlock exclusive rewards as you reach new milestones!"}</p>
      </div>

      <div className={styles.milestonesList}>
        {milestones.map((milestone) => {
          const status = getMilestoneStatus(milestone)
          const progress = getProgressPercentage(milestone)

          return (
            <div key={milestone.id} className={`${styles.milestoneCard} ${styles[status]}`}>
              <div className={styles.milestoneIcon}>
                <div className={styles.trophy}>
                  {status === "claimed" ? "✅" : status === "available" ? "🏆" : "🔒"}
                </div>
                {status === "available" && <div className={styles.glow}></div>}
              </div>

              <div className={styles.milestoneContent}>
                <div className={styles.milestoneHeader}>
                  <h3 className={styles.milestoneTitle}>{milestone.title}</h3>
                  <div className={styles.requirement}>{milestone.requiredReferrals} referrals</div>
                </div>

                <p className={styles.description}>{milestone.description}</p>

                <div className={styles.rewards}>
                  <h4>{"Rewards:"}</h4>
                  <ul>
                    {milestone.rewards.map((reward, index) => (
                      <li key={index} className={styles.reward}>
                        <span className={styles.rewardIcon}>{reward.icon}</span>
                        <span className={styles.rewardText}>
                          {reward.amount} {reward.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {status !== "claimed" && (
                  <div className={styles.progress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className={styles.progressText}>
                      {totalReferrals}/{milestone.requiredReferrals}
                    </div>
                  </div>
                )}

                {status === "available" && (
                  <button className={styles.claimButton} onClick={() => onClaimReward(milestone.id)}>
                    <span className={styles.claimIcon}>🎁</span>
                    {"Claim Rewards"}
                  </button>
                )}

                {status === "claimed" && (
                  <div className={styles.claimedBadge}>
                    <span className={styles.claimedIcon}>✨</span>
                    {"Claimed"}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MilestonesSection
