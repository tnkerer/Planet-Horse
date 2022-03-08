import React, { useContext, useEffect, useState } from 'react'
import { ScrollYValueContext } from '@/utils/providers/scroll-y-value'
import styles from './styles.module.scss'

interface Props {
  scrollValueToAnimate?: number
}

const Token: React.FC<Props> = ({ scrollValueToAnimate }) => {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useContext(ScrollYValueContext)
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const elementAppearsToUser = scrollY >= scrollValueToAnimate
    const screenWidthResolution = window.innerWidth
    elementAppearsToUser && setScrolled(true)
    setScreenWidth(screenWidthResolution)
  }, [scrollY])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span
          className={styles.title}
          style={{
            opacity: scrolled || screenWidth <= 810 ? 1 : 0
          }}
        >
          Token
        </span>
        <div className={styles.coinContainer}>
          <span
            className={styles.info}
            style={{
              marginLeft: scrollY >= 3420 ? '1%' : '10%',
              opacity: scrollY >= 3420 ? '1' : '0'
            }}
          >
            Token: PHORSE<br />
            Name: Planet Horse Token PHORSE<br />
            Network: Binance Smart Chain<br />
            Max supply: 100.000.000
          </span>
          <div
            className={styles.coinImage}
            style={{
              opacity: scrollY >= 3420 ? '1' : '0'
            }}
          ></div>
        </div>
        <span
          className={styles.description}
          style={{
            opacity: scrollY >= 3534 ? '1' : '0'
          }}
        >
          The PHORSE Token is the native game currency. It allows the investor to play, invest and also trade the token.
          <br />
          <br />
          There is a fixed total amount of 100 million PHORSE tokens.
        </span>
      </div>
    </div>
  )
}

export default Token
