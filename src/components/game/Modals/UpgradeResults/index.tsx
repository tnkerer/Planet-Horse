// src/components/game/Modals/UpgradeResults/index.tsx
import React from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import { Horse } from '@/domain/models/Horse';

// ── Existing level-up shape
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

// ── New ascension shape (API response)
export interface AscendResult {
  tokenId: string;     // "439"
  level: number;       // 1
  exp: number;         // 0
  legacy: true;
  basePower: number;
  baseSprint: number;
  baseSpeed: number;
  currentPower: number;
  currentSprint: number;
  currentSpeed: number;
  growthPotential: number;     // e.g., 2.4768
  clearedHistoryCount: number; // e.g., 22
  unequippedItemsCount: number;// e.g., 2
}

// Discriminated union to reuse a single component
type ResultPayload =
  | ({ kind: 'levelup' } & Upgrades)
  | ({ kind: 'ascend' } & AscendResult);

interface Props {
  horse: Horse;
  result: ResultPayload; // <-- unified prop
  onClose: () => void;
}

const UpgradeResults: React.FC<Props> = ({ horse, result, onClose }) => {
  const profileSrc = `/assets/game/upgrade/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-profile.webp`;
  const isAscend = result.kind === 'ascend';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Image src={closeIcon} alt="Close" width={24} height={24} />
        </button>

        <div className={styles.pageBackground} />

        <div className={styles.content}>
          {/* ─────────── Header / Profile ─────────── */}
          <div className={styles.profileSection}>
            <div className={styles.profileWrapper}>
              <img
                src={profileSrc}
                alt={`Profile of ${horse.profile.name}`}
                className={styles.profileImage}
              />
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

              {/* Title row changes depending on mode */}
              <div className={styles.headerRow}>
                <span className={styles.labelText}>
                  {isAscend ? 'Ascended To Level:' : 'New Level:'}
                </span>
                <span className={styles.valueText}>{result.level}</span>
              </div>

              {/* Optional subline for ascension */}
              {isAscend && (
                <div className={styles.headerRow}>
                  <span className={styles.labelText}>Legacy:</span>
                  <span className={styles.valueText}>ENABLED</span>
                </div>
              )}
            </div>
          </div>

          {/* ─────────── Stats Section ─────────── */}
          <div className={styles.statsSection}>
            {/* Shared rows */}
            <div className={styles.statsRow}>
              <span className={styles.statLabel}>Power:</span>
              <span className={styles.statValueHighlight}>
                {Math.ceil(result.currentPower)}
              </span>
              {isAscend && (
                <span className={styles.statBaseNote}>
                  (base {Math.ceil((result as AscendResult).basePower)})
                </span>
              )}
            </div>

            <div className={styles.statsRow}>
              <span className={styles.statLabel}>Sprint:</span>
              <span className={styles.statValueHighlight}>
                {Math.ceil(result.currentSprint)}
              </span>
              {isAscend && (
                <span className={styles.statBaseNote}>
                  (base {Math.ceil((result as AscendResult).baseSprint)})
                </span>
              )}
            </div>

            <div className={styles.statsRow}>
              <span className={styles.statLabel}>Speed:</span>
              <span className={styles.statValueHighlight}>
                {Math.ceil(result.currentSpeed)}
              </span>
              {isAscend && (
                <span className={styles.statBaseNote}>
                  (base {Math.ceil((result as AscendResult).baseSpeed)})
                </span>
              )}
            </div>

            {/* Level-up specific rows */}
            {result.kind === 'levelup' && (
              <>
                <div className={styles.statsRow}>
                  <span className={styles.statLabel}>Max Energy:</span>
                  <span className={styles.statValueEnergy}>{result.maxEnergy}</span>
                </div>
                <div className={styles.bonusText}>You got 4 Energy Bonus!</div>
              </>
            )}

            {/* Ascend specific rows */}
            {isAscend && (
              <>
                <div className={styles.statsRow}>
                  <span className={styles.statLabel}>Growth Potential:</span>
                  <span className={styles.statValueHighlight}>
                    {(result as AscendResult).growthPotential.toFixed(4)}
                  </span>
                </div>

                <div className={styles.statsRow}>
                  <span className={styles.statLabel}>Cleared Race History:</span>
                  <span className={styles.statValueHighlight}>
                    {(result as AscendResult).clearedHistoryCount}
                  </span>
                </div>

                <div className={styles.statsRow}>
                  <span className={styles.statLabel}>Unequipped Items:</span>
                  <span className={styles.statValueHighlight}>
                    {(result as AscendResult).unequippedItemsCount}
                  </span>
                </div>

                <div className={styles.bonusText}>
                  Ascension complete! Career reset to Legacy with a fresh slate.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeResults;
