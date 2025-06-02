import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import discord from '@/assets/icons/socials/discord.webp'
import instagram from '@/assets/icons/socials/instagram.webp'
import telegram from '@/assets/icons/socials/telegram.webp'
import twitter from '@/assets/icons/socials/twitter.webp'
import Link from 'next/link'

const SocialMidia: React.FC = () => {
  const [isScrolled, SetIsScrolled] = useState(false)
  const [isMobileScreen, SetIsMobileScreen] = useState(false)

  function handleScroll () {
    SetIsScrolled(this.scrollY)
  }

  useEffect(() => {
    SetIsMobileScreen(window.innerWidth <= 1000)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.addEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <div className={`
        ${styles.container}
        ${isMobileScreen && isScrolled && styles.hide}
      `}>
        <div className={styles.container_socials}>
          <Link href='https://x.com/PlanetHorseGame'>
            <a className={styles.container_slot}>
              <Image src={twitter} width={65} height={65} />
            </a>
          </Link>
          <Link href='/'>
            <a className={styles.container_slot}>
              <Image src={telegram} width={65} height={65} />
            </a>
          </Link>
        </div>
      </div>
    </>
  )
}

export default SocialMidia
