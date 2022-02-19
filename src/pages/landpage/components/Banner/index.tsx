import React from 'react'
import styles from './styles.module.scss'
import logoMarketImg from '@/assets/logo/logo-horseshoe.gif'
import logoImg from '@/assets/logo/logo-race-play-earn.gif'
import Image from 'next/image'
import Link from 'next/link'

const Banner: React.FC = () => {
  return (
    <div className={styles.container}>
      <Link href='/game'>
        <a className={styles.play} />
      </Link>
      <div className={styles.logoMarket}>
        <Image
          width={300}
          src={logoMarketImg}
          alt='market'
        />
      </div>
      <div className={styles.logo}>
        <Image
          width={650}
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
