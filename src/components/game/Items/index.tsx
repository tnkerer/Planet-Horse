import React, { useState } from 'react'
import styles from './styles.module.scss'
import ShopChestCard from '../ShopChestCard'
import Image from 'next/image'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medal from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'
import ItemBag from '../Modals/ItemBag'

interface Props {
  changeView: (view: string) => void
}

const Items: React.FC<Props> = ({ changeView }) => {
  const { phorse, medals } = useUser();
  const [modalItems, setModalItems] = useState(false)

  const toogleModal = (modalType: string, id?: number) => {
    switch (modalType) {
      case 'items': return setModalItems(r => !r)
    }
  }

  return (
    <>
      <ItemBag status={modalItems} closeModal={toogleModal} />
      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                onClick={() => toogleModal('items')}
                aria-label="Open Bag"
              >
                <span className={styles.notificationBadge}></span>
              </button>
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
        <span className={styles.title}>ITEMS SHOP</span>

        <div className={styles.cardItems}>

          <ShopChestCard />

        </div>
      </div>
    </>
  )
}

export default Items
