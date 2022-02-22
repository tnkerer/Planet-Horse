import React from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/logo/logo.png'
import Image from 'next/image'
import discord from '@/assets/icons/discord.png'
import instagram from '@/assets/icons/instagram.png'
import telegram from '@/assets/icons/telegram.png'
import twitter from '@/assets/icons/twitter.png'

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
