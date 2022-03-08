import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import getHorseRacingImage from '@/utils/hooks/horse-racing-image'
import { Horse } from '@/domain/models/Horse'

interface Props {
  horse: Horse | boolean
  horseResult: number
}

const HorseRace: React.FC<Props> = ({ horse, horseResult }) => {
  const { loading, image } = getHorseRacingImage(horse)
  const [result, setResult] = useState(0)

  function randomizeHorsePlacar (): void {
    setResult(getRandomNumber(1, 10))
  }

  function getRandomNumber (min, max): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  useEffect((): void => {
    setTimeout(function () {
      randomizeHorsePlacar()
    }, 750)
    setTimeout(function () {
      randomizeHorsePlacar()
    }, 2000)
    setTimeout(function () {
      randomizeHorsePlacar()
    }, 3000)
    setTimeout(function () {
      randomizeHorsePlacar()
    }, 3500)
    setTimeout(function () {
      randomizeHorsePlacar()
    }, 4000)
    setTimeout(function () {
      setResult(horseResult)
    }, 5000)
  }, [horse])

  return (
        <>
        <div className={styles.racingContent}>
            <div className={styles.racingPlacar}>#{result}</div>
            {!loading &&
              <div className={styles.racingHorseGif}>
                {image &&
                  <img src={image.src} />
                }
              </div>
            }
        </div>
        </>
  )
}

export default HorseRace
