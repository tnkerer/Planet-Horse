import React from 'react'
import styles from './styles.module.scss'
import logoMarketImg from '@/assets/logo/logo-horseshoe.gif'
import logoImg from '@/assets/logo/logo-race-play-earn.gif'
import Image from 'next/image'
import Link from 'next/link'
import GraphicalButton from '@/utils/components/graphical-button'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <GraphicalButton
        to='/game'
        id={styles.playButton}
        inactive={styles.playInactive}
        active={styles.playActive}
        click={styles.playClick}
      />
      <div className={styles.logoMarket}>
        <Image
          width={300}
          src={logoMarketImg}
          alt='market'
        />
      </div>
      <div className={styles.logo}>
        <Image
          src={logoImg}
          alt='logo'
        />
      </div>
      <div className={styles.molduraFooter}>
        <Link href='/'>
          <a>
            Contract Address: <b>Comming soon</b>
          </a>
        </Link>
      </div>
    </div>
  )
}

export default Banner
