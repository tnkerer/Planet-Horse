import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import discord from '@/assets/icons/socials/discord.webp'
import instagram from '@/assets/icons/socials/instagram.webp'
import telegram from '@/assets/icons/socials/telegram.webp'
import twitter from '@/assets/icons/socials/twitter.webp'
import Link from 'next/link'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

const SocialMidia: React.FC = () => {
  const [scrollYValue, setScrollYValue] = useState(0)
  const [screenWidthResolution, setScreenWidthResolution] = useState(0)
  const { scrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    setScrollYValue(scrollY)
    setScreenWidthResolution(window.innerWidth)
  }, [scrollY])

  return (
    <>
      <div
        className={styles.container}
        style={{
          left: scrollYValue >= 90 && screenWidthResolution <= 810 ? '-105px' : 0
        }}
      >
        <div className={styles.socials}>
          <Link href='https://discord.gg/wg3gtRmh'>
            <a className={styles.slot}>
              <Image src={discord} width={65} height={65} />
            </a>
          </Link>
          <Link href='https://instagram.com/planethorse_nft'>
            <a className={styles.slot}>
              <Image src={instagram} width={65} height={65} />
            </a>
          </Link>
          <Link href='https://twitter.com/PlanetHorseNFT'>
            <a className={styles.slot}>
              <Image src={twitter} width={65} height={65} />
            </a>
          </Link>
          <Link href='/'>
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
