import React from 'react'
import styles from './styles.module.scss'

const Token: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.title}>Token</span>
        <div className={styles.coinContainer}>
          <span className={styles.info}>
            Ticker: PHORSE<br />
            Name: Planet Horse Token<br />
            Max supply: 100,000,000<br />
            PHORSE<br />
            Network: Binance Smart Chain
          </span>
          <div className={styles.coinImage}></div>
        </div>
        <span className={styles.description}>
          The PHORSE Token is the game&apos;s native currency It allows the investor to play, invest and also trade the token.
          <br />
          <br />
          There is a fixed total amount of 100 million PHORSE tokens.
        </span>
      </div>
    </div>
  )
}

export default Token
