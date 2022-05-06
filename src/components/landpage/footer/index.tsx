import React from 'react'
import styles from './styles.module.scss'

import Link from 'next/link'
import Image from 'next/Image'

import discordIcon from '@/assets/icons/socials/discord.webp'
import twitterIcon from '@/assets/icons/socials/twitter.webp'
import telegramIcon from '@/assets/icons/socials/telegram.webp'
import instagramIcon from '@/assets/landpage/intagram.png'

import headerImage from '@/assets/landpage/rodape-ptn1-export.png'

const Footer: React.FC = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.container_mid}>
        <div className={styles.container_marketing}>
          <div className={styles.marketing_community}>
            <p>JOIN OUR COMMUNITY</p>
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
                <img src={instagramIcon.src} alt="Twitter Planet Horse" />
              </a>
            </Link>
            <Link href='https://twitter.com/PlanetHorseNFT'>
              <a target="_blank" rel="noreferrer">
                <img src={twitterIcon.src} alt="Twitter Planet Horse" />
              </a>
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.container_footer}>
        <span className={styles.footer_copyright}>
          Copyright © 2022 planethorse
        </span>
      </div>
    </footer>
  )
}

export default Footer
