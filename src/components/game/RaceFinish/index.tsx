import React from 'react'
import styles from './styles.module.scss'
import getResultImage from '@/utils/hooks/race-result-image'
import getResultHorseImage from '@/utils/hooks/race-result-image-horse'
import { Horse } from '@/domain/models/Horse'
import CountUp from 'react-countup'

interface Props {
  horseResult: number
  horse: Horse | boolean
}

const RaceFinish: React.FC<Props> = ({ horseResult, horse }) => {
  const { loading, image } = getResultImage(horseResult)
  const { loadingHorse, imageHorse } = getResultHorseImage(horseResult)

  return (
    <div className={styles.raceResultContent}>
        {!loadingHorse &&
            <div className={styles.raceResultImageHorse}>
                <img src={imageHorse.src} />
            </div>
        }
        {!loading &&
            <div className={styles.raceResultImageMask}>
              <div className={styles.raceResultConeMask}>
                <div className={styles.raceResultConeMaskInside}>
                </div>
              </div>
              <div className={styles.raceResultBlock}>
                  <div className={styles.raceResultImage}>
                    <img src={image.src} />
                  </div>
                  <div className={styles.raceResultTokens}>
                    + <CountUp start={0} end={0.1589} decimals={4} /> PHORSE
                  </div>
              </div>
            </div>
        }
    </div>
  )
}

export default RaceFinish
