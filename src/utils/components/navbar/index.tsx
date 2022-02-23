import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Burger from '@/components/home/burger'
import logo from '@/assets/utils/logos/planet-horse.webp'
import Image from 'next/image'
import Link from 'next/link'
import exampleUserPic from '@/assets/user-profiles/example-user.gif'
import wallet from '@/utils/mocks/wallet'

const Navbar: React.FC = () => {
  const [burger, setBurger] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [connected, setConnected] = useState(false)

  function walletAdapter (): string {
    const { result } = wallet
    const [firstResult] = result
    const { address } = firstResult
    const shorten = address.slice(0, 9)
    return shorten
  }

  useEffect(() => {
    const walletWithEllipsis = `${walletAdapter()}...`
    setWalletAddress(walletWithEllipsis)
  }, [])

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
            onClick={() => {
              setConnected(!connected)
            }}
          >
            <Link href={'#'}>
              {connected
                ? <div id={styles.userProfileButton}>
                    <span className={styles.address}>{walletAddress}</span>
                    <div className={styles.userPicture}>
                      <Image
                        src={exampleUserPic}
                      />
                    </div>
                  </div>
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
