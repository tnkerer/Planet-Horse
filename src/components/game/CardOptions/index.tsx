import React from 'react'
import styles from './styles.module.scss'
import chestGif from '@/assets/game/actions-cards/chest.gif'
import horseFusionGif from '@/assets/game/actions-cards/fusion.gif'
import upgradeStableGif from '@/assets/game/actions-cards/upgrade.gif'

const CardOptions: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div className={styles.card}>
          <img src={chestGif.src} alt="card-bau"/>
          <button
            className={styles.buyButton}
            /* onClick={setPopUp('chest')} */
          ></button>
        </div>
        <div className={styles.card}>
          <img src={horseFusionGif.src} alt="card-fusion" />
          <button
            className={styles.fusionButton}
            /* onClick={setPopUp('fusion')} */
          ></button>
        </div>
        <div className={styles.card}>
          <img src={upgradeStableGif.src} alt="card-upgrade" />
          <button
            className={styles.upgradeButton}
            /* onClick={setPopUp('upgrade')} */
          ></button>
        </div>
      </div>
    </div>
  )
}

export default CardOptions
