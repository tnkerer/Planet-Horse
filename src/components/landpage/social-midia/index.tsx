import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import discord from '@/assets/icons/socials/discord.webp'
import instagram from '@/assets/icons/socials/instagram.webp'
import telegram from '@/assets/icons/socials/telegram.webp'
import twitter from '@/assets/icons/socials/twitter.webp'
import Link from 'next/link'

const SocialMidia: React.FC = () => {
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

export default SocialMidia
