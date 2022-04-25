import React from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'

import discordIcon from '@/assets/icons/socials/discord.webp'
import twitterIcon from '@/assets/icons/socials/instagram.webp'
import telegramIcon from '@/assets/icons/socials/telegram.webp'
import instagramIcon from '@/assets/icons/socials/twitter.webp'

import planethorseLogoImage from '@/assets/landpage/planethorse-logo-sem-ferradura.webp'
import horseSpriteImage from '@/assets/landpage/horse-sprite.webp'

const Footer: React.FC = () => {
  return (
    <footer className={styles.container}>
      <div className={styles.container_topside}>
        <div className={styles.container_marketing}>
          <Image
            src={planethorseLogoImage}
            width={292}
            height={118}
          />
          <div className={styles.marketing_community__link}>
            <p><span>•</span>COMMUNITY<span>•</span></p>
          </div>

          <div className={styles.social_media}>
            <img src={discordIcon.src} alt="Discord Planet Horse" />
            <img src={twitterIcon.src} alt="Twitter Planet Horse" />
            <img src={instagramIcon.src} alt="Instagram Planter Horse" />
            <img src={telegramIcon.src} alt="Telegram Planet Horse" />
          </div>
        </div>

        <div className={styles.container_partner}>
          <div className={styles.partner_title}>PARTNER</div>
          <Image
            src={horseSpriteImage}
            width={204}
            height={210}
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
