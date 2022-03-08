import React, { useState } from 'react'
import styles from './styles.module.scss'
import Burger from '@/utils/components/burger'
import logo from '@/assets/utils/logos/planet-horse.webp'
import Image from 'next/image'
import Link from 'next/link'
import exampleUserPic from '@/assets/user-profiles/example-user.gif'
import useConnectMetamask from '@/utils/hooks/connect-metamask'
import useInfoUserAccount from '@/utils/hooks/info-user-account'

const Navbar: React.FC = () => {
  const [burger, setBurger] = useState(false)

  const requestConnectionMetamask = useConnectMetamask()
  const { walletAddress, isConnected } = useInfoUserAccount()

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
                  src={logo}
                  alt='PlanetHorse'
                />
              </a>
            </Link>
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
          <div
            className={styles.account}
            onClick={() => { requestConnectionMetamask() }}
          >
            <Link href={'#'}>
              {isConnected
                ? (
                  <div id={styles.userProfileButton}>
                    <span className={styles.address}>{walletAddress.slice(0, 9)}</span>
                    <div className={styles.userPicture}>
                    <Image src={exampleUserPic} />
                    </div>
                  </div>
                  )
                : <button />}
            </Link>
          </div>
        </div>
      </div>

      <Burger close={burger} />
    </>
  )
}

export default Navbar
