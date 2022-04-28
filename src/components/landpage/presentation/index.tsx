import React from 'react'
import styles from './styles.module.scss'

import Link from 'next/link'

/* import discordIcon from '@/assets/icons/socials/discord.webp'
import twitterIcon from '@/assets/icons/socials/twitter.webp'
import telegramIcon from '@/assets/icons/socials/telegram.webp' */

const Presentation: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.container_icon} />
      <div className={styles.container_button}>
        <span>•</span>
        <Link href='#'>Press to explore</Link>
        <span>•</span>
      </div>
    </div>
  )
}

export default Presentation
