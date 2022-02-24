import React from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/utils/logos/logo.svg'

import discordIco from '@/assets/icons/socials/discord.webp'
import twitterIco from '@/assets/icons/socials/instagram.webp'
import telegramIco from '@/assets/icons/socials/telegram.webp'
import instagramIco from '@/assets/icons/socials/twitter.webp'

interface Props {
  colorLetter: string
}

const Footer: React.FC<Props> = ({ colorLetter }) => {
  return (
    <>
    <div className={styles.container}>
      <img className={styles.logo} src={logo} alt='logo'/>
      <div className={styles.socialMedia}>
        <img src={discordIco.src} alt="Discord Planet Horse" />
        <img src={twitterIco.src} alt="Twitter Planet Horse" />
        <img src={telegramIco.src} alt="Telegram Planet Horse" />
        <img src={instagramIco.src} alt="Instagram Planter Horse" />
      </div>
      <span className={styles[colorLetter]}>Copyright © 2022 planethorse</span>
    </div>
    </>
  )
}

export default Footer
