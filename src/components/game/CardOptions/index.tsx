import React from 'react'
import styles from './styles.module.scss'
import chestGif from '@/assets/game/actions-cards/chest.gif'
import horseFusionGif from '@/assets/game/actions-cards/fusion.gif'
import upgradeStableGif from '@/assets/game/actions-cards/upgrade.gif'
import Image from 'next/image'


const CardOptions: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.cards}>
        <div className={styles.card}>
          <Image layout="fill" src={chestGif} alt="card-bau"/>
          <button
            className={styles.buyButton}
            /* onClick={setPopUp('chest')} */
          ></button>
        </div>
        <div className={styles.card}>
          <Image layout="fill" src={horseFusionGif} alt="card-fusion" />
          <button
            className={styles.fusionButton}
            /* onClick={setPopUp('fusion')} */
          ></button>
        </div>
        <div className={styles.card}>
          <Image layout="fill" src={upgradeStableGif} alt="card-upgrade" />
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
