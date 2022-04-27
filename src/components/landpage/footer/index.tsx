import React from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import Link from 'next/link'

import discordIcon from '@/assets/icons/socials/discord.webp'
import twitterIcon from '@/assets/icons/socials/twitter.webp'
import telegramIcon from '@/assets/icons/socials/telegram.webp'

import planethorseLogoImage from '@/assets/landpage/planethorse-logo-sem-ferradura.webp'
import horseSpriteImage from '@/assets/landpage/horse-sprite.webp'

const Footer: React.FC = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.container_topside}>
        <div className={styles.container_marketing}>
          <Image
            src={planethorseLogoImage}
            width={202}
            height={78}
          />
          <div className={styles.marketing_community__link}>
            <p><span>•</span>COMMUNITY<span>•</span></p>
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

        <div className={styles.container_partner}>
          <div className={styles.partner_title}>PARTNER</div>
          <Image
            src={horseSpriteImage}
            width={154}
            height={150}
          />
          <div className={styles.partner_persons}>SOON</div>
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
