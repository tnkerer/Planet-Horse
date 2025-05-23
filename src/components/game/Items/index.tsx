import React from 'react'
import styles from './styles.module.scss'
import SingleItem from '../SingleItem'
import { items } from '@/utils/mocks/game'
import Image from 'next/image'

interface Props {
  changeView: (view: string) => void
}

const Items: React.FC<Props> = ({ changeView }) => {

  return (
    <>
      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={styles.racingButton}
                onClick={() => changeView('horses')}
                aria-label="Go to racing"
              >
                <span className={styles.notificationBadge}></span>
              </button>
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src='/assets/icons/coin.webp' alt="phorse coin" />
            <span>100000.00</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <span className={styles.title}>CHESTS</span>

        <div className={styles.cardItems}>

          {items.map((item) => (
            <SingleItem key={item.id} item={item} />
          ))}

        </div>
      </div>
    </>
  )
}

export default Items
