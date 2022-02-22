import React from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/utils/logos/planet-horse.webp'
import Image from 'next/image'
import discord from '@/assets/icons/socials/discord.webp'
import instagram from '@/assets/icons/socials/instagram.webp'
import telegram from '@/assets/icons/socials/telegram.webp'
import twitter from '@/assets/icons/socials/twitter.webp'

const Footer: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Image
            src={logo}
            width={136}
            height={55}
          />
        </div>
        <div className={styles.socials}>
          <div className={styles.slot}>
            <Image
              src={discord}
              width={40}
              height={40}
            />
          </div>
          <div className={styles.slot}>
            <Image
              src={twitter}
              width={40}
              height={40}
            />
          </div>
          <div className={styles.slot}>
            <Image
              src={telegram}
              width={40}
              height={40}
            />
          </div>
          <div className={styles.slot}>
            <Image
              src={instagram}
              width={40}
              height={40}
            />
          </div>
        </div>
        <span>Copyright © 2022 planethorse</span>
      </div>
    </div>
  )
}

export default Footer
