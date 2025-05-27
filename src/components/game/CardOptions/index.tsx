import React from 'react'
import styles from './styles.module.scss'
import levelGif from '@/assets/game/actions-cards/level.gif'
import chestGif from '@/assets/game/actions-cards/chest.gif'
import horseFusionGif from '@/assets/game/actions-cards/fusion.gif'
import upgradeStableGif from '@/assets/game/actions-cards/upgrade.gif'
import Image from 'next/image'

interface Props {
  changeView: (view: string) => void
}

const CardOptions: React.FC<Props> = ({ changeView }) => {
  return (
    <div className={styles.container}>
      <div className={styles.cardsWrapper}>
        <div className={styles.cards}>
          <div className={styles.card}>
            <Image layout="fill" src={levelGif} alt="card-level" width={200} height={200} />
            <button
              className={styles.buyButton}
            >LEVEL UP</button>
          </div>
          <div className={styles.card}>
            <Image layout="fill" src={chestGif} alt="card-chest" width={200} height={200} />
            <button
              className={styles.buyButton}
              /* onClick={setPopUp('chest')} */
              onClick={() => changeView('items')}
            >BUY CHESTS</button>
          </div>
          <div className={styles.card}>
            <Image layout="fill" src={horseFusionGif} alt="card-breed" width={200} height={200} />
            <button
              className={styles.fusionButton}
            /* onClick={setPopUp('fusion')} */
            >Coming Soon...</button>
          </div>
          <div className={styles.card}>
            <Image layout="fill" src={upgradeStableGif} alt="card-upgrade" width={200} height={200} />
            <button
              className={styles.upgradeButton}
            /* onClick={setPopUp('upgrade')} */
            >Coming Soon...</button>
          </div>
        </div>
        <img
          src="/cursor/luva.png"
          alt="Swipe to see more"
          className={styles.swipeHint}
        />
      </div>
    </div>
  )
}

export default CardOptions