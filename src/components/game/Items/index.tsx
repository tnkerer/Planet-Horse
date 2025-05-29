import React from 'react'
import styles from './styles.module.scss'
import SingleItem from '../SingleItem'
import ShopChestCard from '../ShopChestCard'
import { mock_items } from '@/utils/mocks/game'
import Image from 'next/image'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medal from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'

interface Props {
  changeView: (view: string) => void
}

const Items: React.FC<Props> = ({ changeView }) => {
  const { phorse, medals } = useUser();

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
            <Image width={50} height={50} src={phorseToken} alt="phorse coin" />
            <span>{phorse | 0}</span>
            <Image width={29} height={40} src={medal} alt="medals" />
            <span>{medals | 0}</span>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <span className={styles.title}>SHOP</span>

        <div className={styles.cardItems}>

          <ShopChestCard />

        </div>
      </div>
    </>
  )
}

export default Items
