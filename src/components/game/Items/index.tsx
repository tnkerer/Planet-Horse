import React, { useEffect, useState, useRef } from 'react'
import styles from './styles.module.scss'
import ShopChestCard from '../ShopChestCard'
import BalanceSwitcher, { BalanceItem } from '@/components/common/BalanceSwitcher';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medalIcon from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'
import ItemBag from '../Modals/ItemBag'
import wronIcon from '@/assets/icons/wron.gif'
import MineModal from '../Modals/MineModal'

interface Props {
  changeView: (view: string) => void
}

const Items: React.FC<Props> = ({ changeView }) => {
  const { phorse, medals, wron, shards } = useUser();
  const [modalItems, setModalItems] = useState(false);
  const [modalMine, setModalMine] = useState(false);

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
          <div className={styles.currencyContainer}>
            <BalanceSwitcher
              cookieKey="balances:primary"
              initialKey="PHORSE"
              balances={[
                { key: 'PHORSE', icon: phorseToken, iconW: 22, iconH: 22, alt: 'phorse', value: phorse, decimals: 0, id: 'phorse-balance' },
                { key: 'MEDALS', icon: medalIcon, iconW: 14, iconH: 20, alt: 'medal', value: medals, decimals: 0, id: 'medals-balance' },
                { key: 'WRON', icon: wronIcon, iconW: 22, iconH: 22, alt: 'wron', value: wron, decimals: 2, id: 'wron-balance' },
                { key: 'SHARDS', icon: '/assets/icons/shard.gif', iconW: 10, iconH: 20, alt: 'shards', value: shards, decimals: 0, id: 'shards-balance' },
              ] as BalanceItem[]}
              classes={{
                container: styles.countCurrency,
                button: styles.currencyButton,
                dropdown: styles.currencyDropdown,
                row: styles.currencyRow,
                chevUp: styles.chevUp,
                chevDown: styles.chevDown,
              }}
            />

            <BalanceSwitcher
              cookieKey="balances:secondary"
              initialKey="SHARDS"
              balances={[
                { key: 'PHORSE', icon: phorseToken, iconW: 22, iconH: 22, alt: 'phorse', value: phorse, decimals: 0, id: 'phorse-balance-2' },
                { key: 'MEDALS', icon: medalIcon, iconW: 14, iconH: 20, alt: 'medal', value: medals, decimals: 0, id: 'medals-balance-2' },
                { key: 'WRON', icon: wronIcon, iconW: 22, iconH: 22, alt: 'wron', value: wron, decimals: 2, id: 'wron-balance-2' },
                { key: 'SHARDS', icon: '/assets/icons/shard.gif', iconW: 10, iconH: 20, alt: 'shards', value: shards, decimals: 0, id: 'shards-balance-2' },
              ] as BalanceItem[]}
              classes={{
                container: styles.countCurrency,   // reuse same styling or create a variant
                button: styles.currencyButton,
                dropdown: styles.currencyDropdown,
                row: styles.currencyRow,
                chevUp: styles.chevUp,
                chevDown: styles.chevDown,
              }}
            />
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <span className={styles.title}>ITEMS SHOP</span>

        <div className={styles.cardItems}>
          {/* <PresaleList /> */}
          <ShopChestCard />
        </div>
      </div>
    </>
  )
}

export default Items
