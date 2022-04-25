import React from 'react'
import styles from './styles.module.scss'

import Link from 'next/link'

import discordIcon from '@/assets/icons/socials/discord.webp'
import twitterIcon from '@/assets/icons/socials/twitter.webp'
import telegramIcon from '@/assets/icons/socials/telegram.webp'

const Presentation: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.container_icon} />
      <div className={styles.container_button}>
        <span>•</span>
        <Link href='#'>Press to explorer</Link>
        <span>•</span>
      </div>

      <div className={styles.social_media}>
        <Link href='https://discord.gg/3EDMdSYUXs'>
          <a target="_blank" rel="noreferrer">
            <img src={discordIcon.src} alt="Discord Planet Horse" />
          </a>
        </Link>
        <Link href='https://www.t.me/planethorse'>
          <a target="_blank" rel="noreferrer">
            <img src={telegramIcon.src} alt="Telegram Planet Horse" />
          </a>
        </Link>
        <Link href='https://twitter.com/PlanetHorseNFT'>
          <a target="_blank" rel="noreferrer">
            <img src={twitterIcon.src} alt="Twitter Planet Horse" />
          </a>
        </Link>
      </div>
    </div>
  )
}

export default Presentation
