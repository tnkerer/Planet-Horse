import React from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/utils/logos/planet-horse.webp'

import discordIco from '@/assets/icons/socials/discord.webp'
import twitterIco from '@/assets/icons/socials/twitter.webp'
import telegramIco from '@/assets/icons/socials/telegram.webp'
import instagramIco from '@/assets/icons/socials/instagram.webp'

import Image from 'next/image'

interface Props {
  colorLetter: string
}

const Footer: React.FC<Props> = ({ colorLetter }) => {
  return (
    <>
    <div className={styles.container}>
      <Image className={styles.logo} src={logo} alt='logo'/>
      <div className={styles.socialMedia}>
        <Image src={discordIco} alt="Discord Planet Horse" />
        <Image src={twitterIco} alt="Twitter Planet Horse" />
        <Image src={telegramIco} alt="Telegram Planet Horse" />
        <Image src={instagramIco} alt="Instagram Planter Horse" />
      </div>
      <span className={styles[colorLetter]}>Copyright © 2022 planethorse</span>
    </div>
    </>
  )
}

export default Footer
