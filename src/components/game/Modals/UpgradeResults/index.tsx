// src/components/game/Modals/UpgradeResults/index.tsx
import React from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import { Horse } from '@/domain/models/Horse';

export interface Upgrades {
  level: number;
  currentPower: number;
  currentSprint: number;
  currentSpeed: number;
  currentEnergy: number;
  maxEnergy: number;
  exp: number;
  upgradable: boolean;
  userPhorse: number;
  userMedals: number;
}

interface Props {
  horse: Horse;
  upgrades: Upgrades;
  onClose: () => void;
}

const UpgradeResults: React.FC<Props> = ({ horse, upgrades, onClose }) => {
  // Build the profile‐image URL:
  const profileSrc = `/assets/game/upgrade/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-profile.webp`;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Close “X” button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Image src={closeIcon} alt="Close" width={24} height={24} />
        </button>

        {/* Background “page” image */}
        <div className={styles.pageBackground} />

        <div className={styles.content}>
          {/* ─────────── Profile / Header Section ─────────── */}
          <div className={styles.profileSection}>
            <div className={styles.profileWrapper}>
            {/* The actual circular profile */}
            <img
              src={profileSrc}
              alt={`Profile of ${horse.profile.name}`}
              className={styles.profileImage}
            />
            {/* The transparent “frame” PNG, exactly the same size */}
            <img
              src="/assets/game/upgrade/profile_external.png"
              alt="Profile Frame"
              className={styles.profileFrame}
            />
          </div>
            <div className={styles.headerInfo}>
              <div className={styles.headerRow}>
                <span className={styles.labelText}>HORSE #</span>
                <span className={styles.valueText}>{horse.id}</span>
              </div>
              <div className={styles.headerRow}>
                <span className={styles.labelText}>New Level:</span>
                <span className={styles.valueText}>{upgrades.level}</span>
              </div>
            </div>
          </div>

          {/* ─────────── Stats‐Upgrade Section ─────────── */}
          <div className={styles.statsSection}>
            <div className={styles.statsRow}>
              <span className={styles.statLabel}>New Level:</span>
              <span className={styles.statValueHighlight}>{upgrades.level}</span>
            </div>
            <div className={styles.statsRow}>
              <span className={styles.statLabel}>New Power:</span>
              <span className={styles.statValueHighlight}>{Math.floor(upgrades.currentPower)}</span>
            </div>
            <div className={styles.statsRow}>
              <span className={styles.statLabel}>New Sprint:</span>
              <span className={styles.statValueHighlight}>{Math.floor(upgrades.currentSprint)}</span>
            </div>
            <div className={styles.statsRow}>
              <span className={styles.statLabel}>New Speed:</span>
              <span className={styles.statValueHighlight}>{Math.floor(upgrades.currentSpeed)}</span>
            </div>
            <div className={styles.statsRow}>
              <span className={styles.statLabel}>Max Energy:</span>
              <span className={styles.statValueEnergy}>{upgrades.maxEnergy}</span>
            </div>
              <div className={styles.bonusText}>
                You got 3 Energy Bonus!
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeResults;
