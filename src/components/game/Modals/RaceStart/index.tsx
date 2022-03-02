import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import { horses } from '@/utils/mocks/game'
import HorseRace from '../../HorseRacing'
import RaceFinish from '../../RaceFinish'

import Image from 'next/image'

interface Props {
  closeModal: (modalType: string, horseId?: number) => void
  status: boolean
  horseId: number
}

const ModalRaceStart: React.FC<Props> = ({ closeModal, status, horseId }) => {
  const [horse, setHorse] = useState(false)
  const [startRace, setStartRace] = useState(false)
  const [racing, setRacing] = useState(false)
  const [raceFinish, setRaceFinish] = useState(false)
  const [horseResult, setHorseResult] = useState(getRandomNumber(1, 10))

  function getHorseData (): void {
    const horse = horses.find(horse => horse.id === horseId)
    if (horse) {
      setHorse(horse)
      setHorseResult(getRandomNumber(1, 10))
      startingRace()
    }
  }

  function startingRace (): void {
    setRacing(false)
    setRaceFinish(false)
    setStartRace(true)

    setTimeout(function () {
      raceRunning()
    }, 2500)
  }

  function raceRunning (): void {
    setStartRace(false)
    setRacing(true)

    setTimeout(function () {
      finishRace()
    }, 7000)
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
    getHorseData()
  }, [horseId])

  return (
        <div className={`${styles.modalRaceStart} ${status ? styles.modalActive : styles.modalInactive}`}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent}>
                    <div className={styles.modalClose} onClick={() => closeModal('raceStart')}>
                        <Image width={'30px'} height={'30px'} src={close} />
                    </div>
                    <div className={styles.modalContainer}>
                        <div className={styles.modalInner}>
                            {startRace &&
                                <div className={styles.modalStartRace}></div>
                            }
                            {racing &&
                                <div className={styles.modalRacing}>
                                    <HorseRace horse={horse} horseResult={horseResult} />
                                </div>
                            }
                            {raceFinish &&
                                <RaceFinish horseResult={horseResult} />
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
