import React from 'react'
import styles from './styles.module.scss'
import logoPlanetHorse from '@/assets/landing-page/banner/logo-planet-horse.gif'
import logoRacePlayEarn from '@/assets/landing-page/banner/logo-race-play-earn.gif'
import Image from 'next/image'
import GraphicalButton from '@/utils/components/graphical-button'
import Frame from '@/utils/components/frame'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.buttonContainer}>
        <GraphicalButton
          id={styles.playButton}
          inactive={styles.playInactive}
          active={styles.playActive}
          click={styles.playClick}
        />
      </div>
      <div className={styles.logoMarket}>
        <Image
          width={300}
          src={logoPlanetHorse}
          alt='market'
        />
      </div>
      <div className={styles.logo}>
        <Image
          src={logoRacePlayEarn}
          alt='logo'
        />
      </div>
      <div className={styles.frameFooter}>
        <Frame />
        <div>
          <span>Contract Address: Coming soon</span>
        </div>
      </div>
    </div>
  )
}

export default Banner
