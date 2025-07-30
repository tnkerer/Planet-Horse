"use client";

import type React from "react";
import styles from "./styles.module.scss";
import { levels } from "@/utils/referral/level";

interface BonusSectionProps {
  referralLevel: number;
  xp: number;
}

const BonusSection: React.FC<BonusSectionProps> = ({ referralLevel, xp }) => {
  const currentLevel = levels.find((lvl) => lvl.level === referralLevel) || levels[0];
  const nextLevel = levels.find((lvl) => lvl.level === referralLevel + 1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{"🎁 Referral Bonuses"}</h2>
      </div>

      {/* Current Level */}
      <div className={styles.currentBonus}>
        <div className={styles.currentBadge}>
          <div className={styles.badgeContent}>
            <div className={styles.badgeLevel}>
              {"Level "}
              {currentLevel.level}
            </div>
            <div className={styles.badgeTitle}>{currentLevel.title || "No Title"}</div>
          </div>
        </div>
        <div className={styles.bonusDetails}>
          <div className={styles.bonusAmount}>
            <span className={styles.amount}>{currentLevel.percentReward}%</span>
            <span className={styles.currency}>{" of referee spending"}</span>
          </div>
          <p className={styles.description}>
            {currentLevel.title
              ? `You've reached "${currentLevel.title}" status.`
              : "Keep referring to unlock a title!"}
          </p>
        </div>
      </div>

      {/* Next Level */}
      {nextLevel && (
        <div className={styles.nextBonus}>
          <div className={styles.nextHeader}>
            <h3>{"🚀 Next Level Rewards"}</h3>
            <span className={styles.requirement}>
              {nextLevel.cumulativeXP - xp} XP more to reach Level {nextLevel.level}
            </span>
          </div>

          <div className={styles.nextBonusCard}>
            <div className={styles.nextBadge}>
              <div className={styles.badgeContent}>
                <div className={styles.badgeLevel}>
                  {"Level "}
                  {nextLevel.level}
                </div>
                <div className={styles.badgeTitle}>{nextLevel.title || "No Title"}</div>
              </div>
            </div>
            <div className={styles.nextBonusDetails}>
              <div className={styles.bonusAmount}>
                <span className={styles.amount}>{nextLevel.percentReward}%</span>
                <span className={styles.currency}>{" of referee spending"}</span>
              </div>
              <p className={styles.description}>
                {nextLevel.title
                  ? `Unlock "${nextLevel.title}" with more referrals!`
                  : "Unlock a new reward tier!"}
              </p>
            </div>
          </div>

          <div className={styles.progressToNext}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min((xp / nextLevel.cumulativeXP) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <div className={styles.progressText}>
              {xp}/{nextLevel.cumulativeXP} XP
            </div>
          </div>
        </div>
      )}

      {/* All Levels */}
      <div className={styles.allLevels}>
        <h3>{"🏆 All Bonus Levels"}</h3>
        <div className={styles.levelsList}>
          {levels.map((lvl) => (
            <div
              key={lvl.level}
              className={`${styles.levelItem} ${
                lvl.level === referralLevel
                  ? styles.current
                  : lvl.level < referralLevel
                  ? styles.completed
                  : ""
              }`}
            >
              <div className={styles.levelBadge}>{lvl.level}</div>
              <div className={styles.levelInfo}>
                <div className={styles.levelTitle}>{lvl.title || "No Title"}</div>
                <div className={styles.levelReward}>{lvl.percentReward}%</div>
              </div>
              <div className={styles.levelRequirement}>{lvl.cumulativeXP} XP required</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BonusSection;
