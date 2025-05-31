import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import HorseRace from '../../HorseRacing'
import RaceFinish from '../../RaceFinish'
import { Horse } from '@/domain/models/Horse'

import Image from 'next/image'

interface Props {
  setVisible: Dispatch<SetStateAction<boolean>>
  status: boolean
  horse: Horse
}

const ModalRaceStart: React.FC<Props> = ({ setVisible, status, horse }) => {
  const [startRace, setStartRace] = useState(null)
  const [racing, setRacing] = useState(null)
  const [raceFinish, setRaceFinish] = useState(null)
  const [horseResult, setHorseResult] = useState(getRandomNumber(1, 10))

  function triggerRace (): void {
      setHorseResult(getRandomNumber(1, 10))
      startingRace()
  }

  function startingRace (): void {
    setRacing(false)
    setRaceFinish(false)
    setStartRace(true)

    setTimeout(function () {
      raceRunning()
    }, 1500)
  }

  function raceRunning (): void {
    setStartRace(false)
    setRacing(true)

    setTimeout(function () {
      // finishRace()
    }, 5000)
  }

  function finishRace (): void {
    setStartRace(false)
    setRacing(false)
    setRaceFinish(true)
  }

  function getRandomNumber (min, max): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  useEffect((): void => {
    triggerRace()
  }, [horse])

  return (
        <div className={`${styles.modalRaceStart} ${status ? styles.modalActive : styles.modalInactive}`}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent}>
                    <div className={styles.modalClose} onClick={() => setVisible(false)}>
                        <Image width={'30px'} height={'30px'} src={close} />
                    </div>
                    <div className={styles.modalContainer}>
                        <div className={styles.modalInner}>
                            {startRace &&
                                <div className={styles.modalStartRace}></div>
                            }
                            {racing &&
                                <div className={styles.modalRacing}>
                                    <HorseRace horseRacingFinish={finishRace} horse={horse} horseResult={horseResult} />
                                </div>
                            }
                            {raceFinish &&
                                <RaceFinish horseResult={horseResult} horse={horse} />
                            }
                        </div>
                    </div>
                    <div className={styles.modalMask}></div>
                </div>
            </div>
        </div>
  )
}

export default ModalRaceStart
