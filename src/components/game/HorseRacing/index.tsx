import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import getHorseRacingImage from '@/utils/hooks/horse-racing-image'
import { Horse } from '@/domain/models/Horse'
import CountUp from 'react-countup'

interface Props {
  horse: Horse
  horseResult: number
  horseRacingFinish: () => void
}

const HorseRace: React.FC<Props> = ({ horse, horseResult, horseRacingFinish }) => {
  const { loading, image } = getHorseRacingImage(horse)
  const [isRuning, setIsRuning] = useState(true)
  const [result, setResult] = useState(0)
  const [lastResult, setlastResult] = useState(0)
  const [counterQtd, setCounterQtd] = useState(0)

  function randomizeHorsePlacar (): void {
    const randomNumber = getRandomNumber(1, 10)
    let lastResult = result

    /* FOI NECESSÁRIO ESSA CONDICIONAL PARA NÃO CAIR COM NUMEROS IGUAL POIS BUGAVA O CountUp */
    if (randomNumber === lastResult) {
      lastResult = lastResult - 1
    }
    setlastResult(lastResult)
    setResult(randomNumber)
  }

  function getRandomNumber (min, max): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  useEffect((): void => {
    if (counterQtd < 5) {
      randomizeHorsePlacar()
    } else if (counterQtd === 5) {
      setlastResult(result)
      setResult(horseResult)
      setIsRuning(false)
      setTimeout(function () {
        horseRacingFinish()
      }, 3000)
    }
  }, [counterQtd])

  return (
        <>
        <div className={`${styles.racingContent} ${counterQtd < 5 ? styles.raceActive : styles.raceInactive}`}>
            <div className={styles.racingPlacar}>
              #<CountUp start={lastResult} end={result} onEnd={() => setCounterQtd(counterQtd + 1)} />/10
            </div>
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
