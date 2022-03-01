import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import blackHorse from '@/assets/home/black-horse.gif'
import metaMask from '@/assets/home/metamask.webp'
import Image from 'next/image'
import Link from 'next/link'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

interface Props {
  scrollValueToAnimate?: number
}

const BlackHorseWarning: React.FC<Props> = ({ scrollValueToAnimate }) => {
  const [scrolled, setScrolled] = useState(false)
  const [screenWidth, setScreenWidth] = useState(0)
  const { scrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    const elementAppearsToUser = scrollY >= scrollValueToAnimate
    const screenWidthResolution = window.innerWidth
    elementAppearsToUser && setScrolled(true)
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  return (
    <div
      className={styles.container}
      style={scrolled || screenWidth <= 810
        ? { marginLeft: '0', opacity: 1 }
        : { marginLeft: '50%', opacity: 0 }
      }
    >
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.dialog}>
            <Image src={metaMask} />
            <span>Not yet connected<br />to your wallet</span>
            <Link href='/'>
              <a>Click here</a>
            </Link>
          </div>
          <div className={styles.sticker}>
            <Image
              width={350}
              height={350}
              src={blackHorse}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlackHorseWarning
