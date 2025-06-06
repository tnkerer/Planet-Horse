import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import { Horse } from '@/domain/models/Horse'
import CountUp from 'react-countup'
import { HorseResults } from '../Modals/RaceStart'

interface Props {
  horse: Horse
  horseResult: HorseResults
  horseRacingFinish: () => void
}

const HorseRace: React.FC<Props> = ({ horse, horseResult, horseRacingFinish }) => {
  const [isRuning, setIsRuning] = useState(true)
  const [result, setResult] = useState(0)
  const [lastResult, setlastResult] = useState(0)
  const [counterQtd, setCounterQtd] = useState(0)
  const raceSpeed = 2;

  function randomizeHorsePlacar(): void {
    const randomNumber = getRandomNumber(1, 10)
    let lastResult = result

    /* Condition to keep CountUp from failing */
    if (randomNumber === lastResult) {
      lastResult = lastResult - 1
    }
    setlastResult(lastResult)
    setResult(randomNumber)
  }

  function getRandomNumber(min, max): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  useEffect(() => {
    if (counterQtd < raceSpeed) {
      randomizeHorsePlacar()
    } else if (counterQtd === raceSpeed) {
      setlastResult(result)
      setResult(horseResult.position)
      setIsRuning(false)
    }
  }, [counterQtd])

  useEffect(() => {
    if (!isRuning) {
      const timeout = setTimeout(() => {
        horseRacingFinish()
      }, raceSpeed * 1000)

      return () => clearTimeout(timeout)
    }
  }, [isRuning])

  return (
    <>
      <div className={`${styles.racingContent} ${counterQtd < raceSpeed ? styles.raceActive : styles.raceInactive}`}>
        <div className={styles.racingPlacar}>
          #<CountUp
            key={counterQtd}
            start={lastResult}
            end={result}
            duration={1}
            onEnd={() => setCounterQtd((prev) => prev + 1)}
          />/10
        </div>

        <div className={styles.racingHorseGif}>
          <img src={`/assets/game/horses/race/${horse.profile.type_horse_slug}/${horse.profile.name_slug}-race.gif`} />
        </div>

      </div>
    </>
  )
}

export default HorseRace
