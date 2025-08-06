// src/components/game/RaceFinish/index.tsx
import React from 'react';
import styles from './styles.module.scss';
import getResultImage from '@/utils/hooks/race-result-image';
import getResultHorseImage from '@/utils/hooks/race-result-image-horse';
import { Horse } from '@/domain/models/Horse';
import CountUp from 'react-countup';
import { HorseResults } from '../Modals/RaceStart';
import { items as itemsConst } from '@/utils/constants/items';

interface Props {
  horseResult: HorseResults;
  horse: any;
}

const chestIcons: Record<number, string> = {
  1: '/assets/items/normal_chest.webp',
  2: '/assets/items/champion_chest.webp',
};

const RaceFinish: React.FC<Props> = ({ horseResult, horse }) => {
  const { loading, image } = getResultImage(horseResult.position);
  const { loadingHorse, imageHorse } = getResultHorseImage(horseResult.position);

  // Use the field your API actually returns:
  const finalReward = horseResult.tokenReward;

  const hasDrops =
    horseResult.droppedItems.length > 0 ||
    horseResult.droppedChests.length > 0;

  return (
    <div className={styles.raceResultContent}>
      {/* 1) Horse‐placement animation (behind everything) */}
      {!loadingHorse && (
        <div className={styles.raceResultImageHorse}>
          <img src={imageHorse.src} alt="Horse placement" />
        </div>
      )}

      {/* 2) Overlay‐mask + cone effect + result block */}
      {!loading && (
        <div className={styles.raceResultImageMask}>
          <div className={styles.raceResultConeMask}>
            <div className={styles.raceResultConeMaskInside}></div>
          </div>

          <div className={styles.raceResultBlock}>
            {/* 2a) The result icon (e.g. trophy, etc.) */}
            <div className={styles.raceResultImage}>
              <img src={image.src} alt="Result icon" />
            </div>

            {/* 2b) The “+ X PHORSE” text, with medal if earned */}
            <div className={styles.raceResultTokens}>
              + <CountUp start={0} end={finalReward} decimals={2} /> PHORSE
              {horseResult.medalReward > 0 ? (
                <img
                  src={'/assets/icons/medal.gif'}
                  alt="Medal"
                  style={{
                    display: 'inline-block',
                    width: '25px',
                    height: '35px',
                    marginLeft: '0.3vw',
                    verticalAlign: 'middle',
                  }}
                />
              ) : null}
            </div>

            {hasDrops && (
              <div className={styles.dropsSection}>
                <div className={styles.dropsMessage}>
                  You got new items!
                </div>
                <div className={styles.raceResultDrops}>
                  {horseResult.droppedItems.map(name => {
                    const def = itemsConst[name];
                    const webpSrc = `/assets/items/${String(def.src)}.webp`;
                    const gifSrc = `/assets/items/${String(def.src)}.gif`;
                    return (
                      <img
                        key={name}
                        src={webpSrc}
                        onError={e => {
                          const img = e.currentTarget;
                          img.onerror = null;      // prevent loops
                          img.src = gifSrc;
                        }}
                        alt={name}
                        className={styles.dropIcon}
                      />
                    );
                  })}
                  {horseResult.droppedChests.map(type => (
                    <img
                      key={`chest-${type}`}
                      src={chestIcons[type] || chestIcons[1]}
                      alt={`Chest ${type}`}
                      className={styles.dropIcon}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceFinish;
