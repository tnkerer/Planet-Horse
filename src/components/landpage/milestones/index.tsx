import React, { useEffect, useRef, useState } from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'

import { useIsVisible } from '@/utils/hooks/is-visible'

import wallet_icon from '@/assets/landpage/wallet-status.webp'
import horses_icon from '@/assets/landpage/horses-status.webp'
import volume_icon from '@/assets/landpage/volume-status.webp'

import TitleLayer from '@/components/landpage/title-layer'

const Milestones: React.FC = () => {
  const myRef = useRef()
  const [ascendingNumber, setAscendingNumber] = useState(0)
  const isVisible = useIsVisible(myRef)

  useEffect(() => {
    if (isVisible) {
      let i = 0

      const ascender = setInterval(() => {
        (i === 20000) && clearInterval(ascender)
        setAscendingNumber(i)
        i = + i + 25
      }, 2)
    }
  }, [isVisible])

  return (
    <div className={styles.container}>
      <TitleLayer>
        Milestones
      </TitleLayer>
      <div className={`
        ${styles.container_cards}
        ${isVisible && styles.animation}
      `}>
        <div className={styles.cards_card} ref={myRef}>
          <span className={styles.card_image}>
            <Image layout='fill' src={wallet_icon} />
          </span>
          <span className={styles.card_title}>
            WALLETS
          </span>
          <span className={styles.card_value}>
            {ascendingNumber !== 20000 ? ascendingNumber : 'SOON'}
          </span>
        </div>
        <div className={`
          ${styles.cards_card}
        `}>
          <span className={styles.card_image}>
            <Image layout='fill' src={horses_icon} />
          </span>
          <span className={styles.card_title}>
            HORSES
          </span>
          <span className={styles.card_value}>
            {ascendingNumber !== 20000 ? ascendingNumber : 'SOON'}
          </span>
        </div>
        <div className={`
          ${styles.cards_card}
        `}>
          <span className={styles.card_image}>
            <Image layout='fill' src={volume_icon} />
          </span>
          <span className={styles.card_title}>
            VOLUME
          </span>
          <span className={styles.card_value}>
            {ascendingNumber !== 20000 ? ascendingNumber : 'SOON'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Milestones
