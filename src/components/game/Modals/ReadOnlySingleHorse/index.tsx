// frontend/components/ReadOnlySingleHorse/index.tsx
import React from 'react';
import type { ReadOnlyHorse } from '@/domain/models/ReadOnlyHorse';
import styles from './styles.module.scss';

interface Props {
  horse: ReadOnlyHorse;
}

const ReadOnlySingleHorse: React.FC<Props> = ({ horse }) => {
  const displayName =
    horse.nickname && horse.nickname.trim().length > 0
      ? horse.nickname
      : horse.name || `Horse #${horse.tokenId}`;

  return (
    <div className={styles.readOnlyHorseRoot}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.horseTitle}>{displayName}</div>
          <div className={styles.horseSubtitle}>
            #{horse.tokenId} • {horse.rarity} • Lv {horse.level} • MMR {horse.mmr}
          </div>
        </div>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>{horse.sex}</span>
          <span className={styles.badge}>{horse.status}</span>
          {horse.legacy && <span className={styles.badgeLegacy}>Legacy</span>}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Stats</div>
          <div className={styles.statRow}>
            <span>Power</span>
            <span>
              {horse.currentPower} <small>({horse.basePower} base)</small>
            </span>
          </div>
          <div className={styles.statRow}>
            <span>Sprint</span>
            <span>
              {horse.currentSprint} <small>({horse.baseSprint} base)</small>
            </span>
          </div>
          <div className={styles.statRow}>
            <span>Speed</span>
            <span>
              {horse.currentSpeed} <small>({horse.baseSpeed} base)</small>
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Progress</div>
          <div className={styles.statRow}>
            <span>Level</span>
            <span>{horse.level}</span>
          </div>
          <div className={styles.statRow}>
            <span>EXP</span>
            <span>{horse.exp}</span>
          </div>
          <div className={styles.statRow}>
            <span>Energy</span>
            <span>
              {horse.currentEnergy} / {horse.maxEnergy}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Breeding</div>
          <div className={styles.statRow}>
            <span>Gen</span>
            <span>{horse.gen}</span>
          </div>
          <div className={styles.statRow}>
            <span>Breeds</span>
            <span>
              {horse.currentBreeds}
              {horse.maxBreeds != null ? ` / ${horse.maxBreeds}` : ''}
            </span>
          </div>
          <div className={styles.statRow}>
            <span>Growth Potential</span>
            <span>
              {horse.growthPotential != null
                ? horse.growthPotential.toFixed(2)
                : '—'}
            </span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Career</div>
          <div className={styles.statRow}>
            <span>Career Factor</span>
            <span>{horse.careerfactor.toFixed(2)}</span>
          </div>
          <div className={styles.statRow}>
            <span>Trait Slots</span>
            <span>{horse.traitSlotsUnlocked}</span>
          </div>
        </div>
      </div>

      {/* Equipment – visual only, NO interactions */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Equipments</div>
        {horse.equipments.length === 0 ? (
          <div className={styles.emptyText}>No equipment attached.</div>
        ) : (
          <div className={styles.equipmentList}>
            {horse.equipments.map((eq) => (
              <div
                key={eq.name}
                className={`${styles.equipmentSlot} ${styles.equipmentSlotDisabled}`}
              >
                {eq.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadOnlySingleHorse;
