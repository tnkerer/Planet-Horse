import React, { useEffect, useState, useRef } from 'react'
import styles from './styles.module.scss'
import Burger from '@/utils/components/burger'
import Image from 'next/image'
import Link from 'next/link'
import exampleUserPic from '@/assets/user-profiles/example-user.gif'
import noUserPic from '@/assets/user-profiles/no-user.gif'
import { useWallet } from '@/contexts/WalletContext'
import ConfirmModal from '@/components/game/Modals/ConfirmModal'

const Navbar: React.FC = () => {
  const [burger, setBurger] = useState(false)
  const { address, isConnected, connect, disconnect } = useWallet()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [discordInfo, setDiscordInfo] = useState<{ discordId: string | null, discordTag: string | null } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const closeConfirm = () => setShowConfirm(false)
  const handleConfirm = () => {
    disconnect()
    setShowConfirm(false)
    setShowDropdown(false)
  }

  const handleAccountClick = async (): Promise<void> => {
    if (isConnected) {
      setShowDropdown(prev => !prev)
    } else {
      await connect()
    }
  }

  useEffect(() => {
    if (isConnected) {
      fetch(`${process.env.API_URL}/user/get-discord`, { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setDiscordInfo(data)
          else setDiscordInfo(null)
        })
        .catch(() => setDiscordInfo(null))
    }
  }, [isConnected])

  const handleConnectDiscord = async () => {
    const res = await fetch(`${process.env.API_URL}/auth/discord-token`, {
      credentials: 'include',
      method: 'POST',
    });
    const { token } = await res.json();

    const authURL = `https://discord.com/oauth2/authorize?client_id=1386572129507610664&response_type=code&redirect_uri=https%3A%2F%2Fapi.planethorse.io%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds+guilds.members.read&state=${token}`
    window.location.href = authURL
  }

  return (
    <>
      {showConfirm && (
        <ConfirmModal
          text='You sure you want to disconnect?'
          onClose={closeConfirm}
          onConfirm={handleConfirm}
        />
      )}
      <div className={styles.container}>
        <svg width='100%' height='90px'>
          <rect y='75' fill='#582c25' width='100%' height='4' />
          <rect y='83' fill='#582c25' width='100%' height='7' />
        </svg>
        <div className={styles.content}>
          <button className={styles.burgerIcon} onClick={() => setBurger(!burger)}>
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
            <Link href='https://marketplace.roninchain.com/collections/origin-horses'>
              <a target='_blank'>MARKETPLACE</a>
            </Link>
          </div>

          <div className={styles.account} onClick={handleAccountClick}>
            <div id={styles.userProfileButton}>
              <span className={styles.address}>
                {isConnected ? `${address?.slice(0, 9)}...` : 'Connect Wallet'}
              </span>
              <div className={styles.userPicture}>
                <Image src={isConnected ? exampleUserPic : noUserPic} alt='user' />
              </div>
            </div>

            {/* ▼ Dropdown when connected */}
            {isConnected && showDropdown && (
              <div className={styles.dropdownMenu} ref={dropdownRef}>
                <div onClick={() => setShowConfirm(true)}>Disconnect</div>
                {discordInfo?.discordId ? (
                  <div>{discordInfo.discordTag}<Image
                    src='/assets/icons/socials/discord.webp'
                    width={16}
                    height={16}
                  /></div>
                ) : (
                  <div onClick={handleConnectDiscord}>Connect Discord</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Burger close={burger} />
    </>
  )
}

export default Navbar
