import React, { useState } from 'react'
import styles from './styles.module.scss'
import ModalReward from '../Modals/Reward'
import ModalRaceStart from '../Modals/RaceStart'
import RecoveryCenter from '../Modals/RecoveryCenter'
import SingleHorse from '../SingleHorse'
import { horses } from '@/utils/mocks/game'
import Image from 'next/image'

interface Props {
  changeView: (view: string) => void
}

const Horses: React.FC<Props> = ({ changeView }) => {
  const [modalReward, setToogleModalReward] = useState(false)
  const [modalRaceStart, setToogleModalRaceStart] = useState(false)
  const [modalRestore, setToogleModalRestore] = useState(false)
  const [horseId, sethorseId] = useState(0)

  const toogleModal = (modalType: string, horseId?: number) => {
    if (horseId) {
      sethorseId(horseId)
    } else {
      sethorseId(0)
    }

    if (modalType === 'reward') {
      setToogleModalReward(!modalReward)
    }

    if (modalType === 'raceStart') {
      setToogleModalRaceStart(!modalRaceStart)
    }

    if (modalType === 'restore') {
      setToogleModalRestore(!modalRestore)
    }
  }

  return (
    <>
      <ModalReward closeModal={toogleModal} status={modalReward} horseId={horseId} />
      <ModalRaceStart closeModal={toogleModal} status={modalRaceStart} horseId={horseId} />
      {modalRestore && (
        <RecoveryCenter
          status={modalRestore}
          horseId={horseId}
          cost={1000}
          closeModal={toogleModal}
        />
      )}
      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <div onClick={() => changeView('items')}>ITEMS <span className={styles.notificationBadge}></span></div>
              <div>CURE ALL HORSES</div>
              <div>QUICK RACE</div>
              <div>REWARDS OF SOLD HORSES</div>
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src='/assets/icons/coin.webp' alt="phorse coin" />
            <span>100000.00</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <span className={styles.countHorses}>{horses.length} Horses</span>

        <div className={styles.cardHorses}>

          {horses.map((horse) => (
            <SingleHorse openModal={toogleModal} key={horse.id} horse={horse} />
          ))}

          <div className={styles.addHorse}>
            <div className={styles.addHorseWrapper}>
              <div className={styles.plusHorse}>
                +
              </div>
              <div className={styles.addHorseText}>
                GET MORE HORSES, THIS IS THE FIRST STEP TO BECOMING A GREAT RUNNER
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default Horses
