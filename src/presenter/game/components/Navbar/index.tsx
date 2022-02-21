import React, { useState } from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/logo/logo.png'
import Image from 'next/image'
import Link from 'next/link'
import Burger from './components/Burger'

const Navbar: React.FC = () => {
  const [burger, setBurger] = useState(false)

  return (
    <>
      <div className={styles.container}>
        <div className={styles.shadow} />
        <div className={styles.shadowBorder} />

        <div className={styles.content}>
          <button className={styles.burgerIcon} onClick={() => {
            setBurger(!burger)
          }}>
            <div className={styles.line} />
            <div className={styles.line} />
            <div className={styles.line} />
          </button>
          <div className={styles.logo}>
            <Image
              layout='intrinsic'
              src={logo}
            />
          </div>
          <div className={styles.options}>
            <Link href='/home'>
              <a>HOME</a>
            </Link>
            <Link href='/marketplace'>
              <a>MARKETPLACE</a>
            </Link>
            <Link href='/game'>
              <a>GAME</a>
            </Link>
            <Link href='/staking'>
              <a>STAKING</a>
            </Link>
            <Link href='/barn'>
              <a>BARN</a>
            </Link>
          </div>
          <div className={styles.account}>
            <button>
              Connect to wallet
            </button>
          </div>
        </div>
      </div>

      <Burger close={burger} />
    </>
  )
}

export default Navbar
