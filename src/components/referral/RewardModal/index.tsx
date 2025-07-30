"use client"

import type React from "react"
import { useState } from "react"
import styles from "./styles.module.scss"
import { Milestone } from "@/utils/referral/types"

interface RewardModalProps {
  milestone: Milestone
  onClaim: () => void
  onClose: () => void
}

const RewardModal: React.FC<RewardModalProps> = ({ milestone, onClaim, onClose }) => {
  const [isClaiming, setIsClaiming] = useState(false)

  const handleClaim = async () => {
    setIsClaiming(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onClaim()
    setIsClaiming(false)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.celebration}>
          <div className={styles.confetti}>
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`${styles.confettiPiece} ${styles[`confetti${(i % 4) + 1}`]}`}></div>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.trophy}>🏆</div>
          <h2 className={styles.title}>{"Milestone Achieved!"}</h2>
          <h3 className={styles.milestoneTitle}>{milestone.title}</h3>
          <p className={styles.description}>{milestone.description}</p>

          <div className={styles.rewards}>
            <h4>{"You've earned:"}</h4>
            <div className={styles.rewardsList}>
              {milestone.rewards.map((reward, index) => (
                <div key={index} className={styles.rewardItem}>
                  <span className={styles.rewardIcon}>{reward.icon}</span>
                  <span className={styles.rewardAmount}>{reward.amount}</span>
                  <span className={styles.rewardType}>{reward.type}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.claimButton} onClick={handleClaim} disabled={isClaiming}>
              {isClaiming ? (
                <>
                  <span className={styles.spinner}></span>
                  {"Claiming..."}
                </>
              ) : (
                <>
                  <span className={styles.claimIcon}>🎁</span>
                  {"Claim Rewards"}
                </>
              )}
            </button>
            <button className={styles.closeButton} onClick={onClose}>
              {"Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardModal
