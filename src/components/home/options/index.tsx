import React from 'react'
import styles from './styles.module.scss'
import carteiraStatus from '@/assets/game/home-tab/carteira-status.png'
import volumeStatus from '@/assets/game/home-tab/volume-status.png'
import cavaloStatus from '@/assets/game/home-tab/cavalos-status.png'
import Image from 'next/image'

const Options: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.slot}>
            <div className={styles.sticker}>
              <Image
                src={carteiraStatus}
                width={180}
                height={170}
              />
            </div>
            <h1>WALLETS</h1>
            <h2>SOON</h2>
          </div>
          <div className={styles.slot}>
            <div className={styles.sticker}>
              <Image
                src={cavaloStatus}
                width={180}
                height={170}
              />
            </div>
            <h1>HORSES</h1>
            <h2>SOON</h2>
          </div>
          <div className={styles.slot}>
            <div className={styles.sticker}>
              <Image
                src={volumeStatus}
                width={180}
                height={170}
              />
            </div>
            <h1>VOLUME</h1>
            <h2>SOON</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Options
