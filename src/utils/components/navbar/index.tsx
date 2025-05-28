import React, { useState } from 'react'
import styles from './styles.module.scss'
import Burger from '@/utils/components/burger'
import Image from 'next/image'
import Link from 'next/link'
import exampleUserPic from '@/assets/user-profiles/example-user.gif'
import noUserPic from '@/assets/user-profiles/no-user.gif'
import { useWallet } from '@/contexts/WalletContext'

const Navbar: React.FC = () => {
  const [burger, setBurger] = useState(false)
  const { address, isConnected, connect, disconnect } = useWallet()

  return (
    <>
      <div className={styles.container}>
        <svg width='100%' height='90px'>
          <rect y='75' fill='#582c25' width='100%' height='4' />
          <rect y='83' fill='#582c25' width='100%' height='7' />
        </svg>
        <div className={styles.content}>
          <button className={styles.burgerIcon} onClick={() => {
            setBurger(!burger)
          }}>
            <svg width='100%' height='100%'>
              <rect y='10' fill='#fff' width='30' height='3' />
              <rect y='21' fill='#fff' width='30' height='3' />
              <rect y='32' fill='#fff' width='30' height='3' />
            </svg>
          </button>
          <div className={styles.logo}>
            <Link href='/'>
              <a>
                <Image
                  layout='intrinsic'
                  src='/assets/utils/logos/planet-horse.webp'
                  alt='PlanetHorse'
                  width={136}
                  height={55}
                />
              </a>
            </Link>
          </div>
          <div className={styles.options}>
            <Link href='/'>
              <a>HOME</a>
            </Link>
            <Link href='/game'>
              <a>GAME</a>
            </Link>
            <Link href='/profile'>
              <a>PROFILE</a>
            </Link>
            <Link href='https://opensea.io/0x96ca93ac0d9e26179dcd11db08af88a3506e8f03/created'>
              <a target="_blank">MARKETPLACE</a>
            </Link>
          </div>
          <div
            className={styles.account}
            onClick={() => (isConnected ? disconnect() : connect())}
          >
            <Link href={'#'}>
              {isConnected
                ? (
                  <div id={styles.userProfileButton}>
                    <span className={styles.address}>{address!.slice(0, 9)}</span>
                    <div className={styles.userPicture}>
                      <Image src={exampleUserPic} />
                    </div>
                  </div>
                )
                : (<div id={styles.userProfileButton}>
                  <span className={styles.address}>{'Connect Wallet'}</span>
                  <div className={styles.userPicture}>
                    <Image src={noUserPic} />
                  </div>
                </div>)
              }
            </Link>
          </div>
        </div>
      </div>

      <Burger close={burger} />
    </>
  )
}

export default Navbar
