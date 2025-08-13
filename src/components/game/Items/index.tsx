import React, { useState } from 'react'
import styles from './styles.module.scss'
import ShopChestCard from '../ShopChestCard'
import Image from 'next/image'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medal from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'
import ItemBag from '../Modals/ItemBag'
import PresaleCard from '../PresaleCard'
import MineModal from '../Modals/MineModal'

interface Props {
  changeView: (view: string) => void
}

const Items: React.FC<Props> = ({ changeView }) => {
  const { phorse, medals } = useUser();
  const [modalItems, setModalItems] = useState(false)
  const [modalMine, setModalMine] = useState(false)

  const toogleModal = (modalType: string, id?: number) => {
    switch (modalType) {
      case 'items': return setModalItems(r => !r)
    }
  }

  return (
    <>
      <ItemBag status={modalItems} closeModal={toogleModal} />
      {modalMine && (
        <MineModal
          setVisible={setModalMine}
          status={modalMine}
        />
      )}
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
              <button
                className={styles.upgradeButton}
                onClick={() => { setModalMine(true); }}
              />
            </div>
          </div>
          <div className={styles.countCurrency}>
            <div className={styles.currencyGroup}>
              <Image width={25} height={25} src={phorseToken} alt="phorse coin" />
              <span id='phorse-balance'>{phorse | 0}</span>
            </div>
            <div className={styles.currencyGroup}>
              <Image width={14} height={20} src={medal} alt="medals" />
              <span id='medals-balance'>{medals | 0}</span>
            </div>
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
