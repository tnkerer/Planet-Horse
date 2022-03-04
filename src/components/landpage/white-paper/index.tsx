import React, { useState, useEffect, useContext } from 'react'
import styles from './styles.module.scss'
import GraphicalButton from '@/utils/components/graphical-button'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'

interface Props {
  scrollValueToAnimate: number
}

const WhitePaper: React.FC<Props> = ({ scrollValueToAnimate }) => {
  const [screenWidth, setScreenWidth] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useContext(ScrollYValueContext)

  useEffect(() => {
    const elementAppearsToUser = scrollY >= scrollValueToAnimate
    const screenWidthResolution = window.innerWidth
    elementAppearsToUser && setScrolled(true)
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  return (
    <div className={styles.container}>
      <svg width='100%' height='254px'>
        <rect fill='#a26b61' width='100%' height='210px' />
        <rect y='210' fill='#ae7970' width='100%' height='6px' />
        <rect y='216' fill='#6c4139' width='100%' height='38px' />
      </svg>
      <div
        className={`
          ${styles.slot}
          ${scrolled && styles.animation}
        `}
        style={scrolled || screenWidth <= 810
          ? {
              bottom: '50px',
              opacity: 1
            }
          : {
              bottom: '500px',
              opacity: 0
            }
          }
      >
        <GraphicalButton
          to='https://whitepaper.planethorse.me/portuguese-version-1.0/home'
          id={styles.whitepaper}
          inactive={styles.inactive}
          active={styles.active}
          newTab
        />
      </div>
    </div>
  )
}

export default WhitePaper
