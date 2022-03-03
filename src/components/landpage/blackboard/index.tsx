import React, { useContext, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import logo from '@/assets/utils/logos/planet-horse.webp'
import Image from 'next/image'
import Link from 'next/link'
import Frame from '@/utils/components/frame'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

const Blackboard: React.FC = () => {
  const [screenWidth, setScreenWidth] = useState(0)
  const { scrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    const screenWidthResolution = window.innerWidth
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  return (
    <div className={styles.container}>
      <Frame />
      <h2 style={{
        opacity: scrollY >= 5044 || screenWidth <= 810 ? 1 : 0
      }}>
        OUR PARTNERS
      </h2>
      <div
        className={styles.planethorse}
        style={{
          opacity: scrollY >= 5254 || screenWidth <= 810 ? 1 : 0
        }}
      />
      <h1
        style={{
          opacity: scrollY >= 5402 || screenWidth <= 810 ? 1 : 0
        }}
      >SOON</h1>
      <div
        className={styles.logo}
        style={{
          opacity: scrollY >= 5554 || screenWidth <= 810 ? 1 : 0
        }}
      >
        <Image
          width={140}
          height={50}
          src={logo}
        />
      </div>
      <div
        className={styles.communityLink}
        style={{
          opacity: scrollY >= 5664 || screenWidth >= 810 ? 1 : 0
        }}
      >
        <span>•</span>
          <Link href="https://whitepaper.planethorse.me/portuguese-version-1.0/social">
            <a>
              Community
            </a>
          </Link>
        <span>•</span>
      </div>
      <div
        className={styles.copyright}
      >
        <span>Copyright © 2022 planethorse</span>
      </div>
    </div>
  )
}

export default Blackboard
