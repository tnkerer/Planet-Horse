import React, { useState } from 'react'
import styles from './styles.module.scss'
import phorseCoin from '@/assets/icons/coin.webp'
import ModalReward from '../Modals/Reward'
import SingleHorse from '../SingleHorse'
import { horses } from '@/utils/mocks/game'

const Horses: React.FC = () => {
  const [modalReward, setToogleModalReward] = useState(false)
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
  }

  return (
    <>
    <ModalReward closeModal={toogleModal} status={modalReward} horseId={horseId} />
    <div className={styles.secondBar}>
      <div className={styles.containerBar}>
        <div className={styles.actionsOptions}>
          <span>FEED ALL HORSES</span>
          <span>ALL QUICK RACE</span>
          <span>REWARDS OF SOLD HORSES</span>
        </div>
        <div className={styles.countCurrency}>
          <img src={phorseCoin} alt="phorse coin" />
          <span>100000.00</span>
        </div>
      </div>
    </div>

    <div className={styles.container}>
      <span className={styles.countHorses}>{horses.length}/15</span>

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
              GET MORE FIRST HORSE, THIS IS THE FIRST STEP TO BECOMING A GREAT RUNNER
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  )
}

export default Horses
