import React from 'react'
import styles from './styles.module.scss'
import walletStatus from '@/assets/home/wallet-status.webp'
import horseStatus from '@/assets/home/horse-status.webp'
import volumeStatus from '@/assets/home/volume-status.webp'
import Image from 'next/image'

const Options: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.slot}>
            <div className={styles.sticker}>
              <Image
                src={walletStatus}
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
                src={horseStatus}
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
