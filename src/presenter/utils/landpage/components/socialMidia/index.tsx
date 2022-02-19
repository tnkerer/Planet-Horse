import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import discord from '@/assets/icons/discord.png'
import instagram from '@/assets/icons/instagram.png'
import twitter from '@/assets/icons/twitter.png'
import telegram from '@/assets/icons/telegram.png'
import Link from 'next/link'

const SocialMedia: React.FC = () => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.socials}>
          <Link href='https://discord.gg/wg3gtRmh'>
            <a className={styles.slot}>
              <Image src={discord} width={65} height={65} />
            </a>
          </Link>
          <Link href='#'>
            <a className={styles.slot}>
              <Image src={instagram} width={65} height={65} />
            </a>
          </Link>
          <Link href='https://twitter.com/PlanetHorseNFT'>
            <a className={styles.slot}>
              <Image src={twitter} width={65} height={65} />
            </a>
          </Link>
          <Link href='#'>
            <a className={styles.slot}>
              <Image src={telegram} width={65} height={65} />
            </a>
          </Link>
        </div>
      </div>
    </>
  )
}

export default SocialMedia
