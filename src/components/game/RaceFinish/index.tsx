// src/components/game/RaceFinish/index.tsx
import React from 'react';
import styles from './styles.module.scss';
import getResultImage from '@/utils/hooks/race-result-image';
import getResultHorseImage from '@/utils/hooks/race-result-image-horse';
import { Horse } from '@/domain/models/Horse';
import CountUp from 'react-countup';
import { HorseResults } from '../Modals/RaceStart';

interface Props {
  horseResult: HorseResults;
  horse: Horse | boolean;
}

const RaceFinish: React.FC<Props> = ({ horseResult, horse }) => {
  const { loading, image } = getResultImage(horseResult.position);
  const { loadingHorse, imageHorse } = getResultHorseImage(horseResult.position);

  // Use the field your API actually returns:
  const finalReward = horseResult.tokenReward;

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
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceFinish;
