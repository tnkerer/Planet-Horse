import React from 'react'
import styles from './styles.module.scss'
import blackHorse from '../../../assets/game/home-tab/cavalo.gif'
import metaMask from '../../../assets/game/home-tab/metamask.png'
import Image from 'next/image'
import Link from 'next/link'

const BlackHorseWarning: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.dialog}>
            <Image src={metaMask} />
            <span>Not yet connected<br />to your wallet</span>
            <Link href='/'>
              <a>Click here</a>
            </Link>
          </div>
          <div className={styles.sticker}>
            <Image
              width={350}
              height={350}
              src={blackHorse}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlackHorseWarning
