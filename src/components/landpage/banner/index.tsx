import React from 'react'
import styles from './styles.module.scss'
import logoPlanetHorse from '@/assets/landing-page/banner/logo-planet-horse.gif'
import logoRacePlayEarn from '@/assets/landing-page/banner/logo-race-play-earn.gif'
import Image from 'next/image'
import Link from 'next/link'
import GraphicalButton from '@/utils/components/graphical-button'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <GraphicalButton
        to='/home'
        id={styles.playButton}
        inactive={styles.playInactive}
        active={styles.playActive}
        click={styles.playClick}
      />
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
        <div className={styles.clarity} />
        <div className={styles.clarityLine} />
        <div className={styles.address}>
          <input
            value='Contract Address: Coming soon'
            type='text'
            disabled
          />
        </div>
        <div className={styles.shadowLine} />
        <div className={styles.shadow} />
        <div className={styles.darkLine} />
      </div>   
    </div>
  )
}

export default Banner
