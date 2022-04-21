import React, { useEffect, useRef, useState } from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'

import wallet_icon from '@/assets/landpage/wallet-status.webp'
import horses_icon from '@/assets/landpage/horses-status.webp'
import volume_icon from '@/assets/landpage/volume-status.webp'

import TitleLayer from '@/components/landpage/title-layer'

const Milestones: React.FC = () => {
  const myRef = useRef()
  const [IsVisble, setIsVisble] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0]
      setIsVisble(entry.isIntersecting)
    }) 
    observer.observe(myRef.current)
  }, [])

  return (
    <div className={styles.container}>
      <TitleLayer>
        Milestones
      </TitleLayer>
      <div className={`
        ${styles.container_cards}
        ${IsVisble ? styles.animation : ''}
      `}>
        <div className={`
          ${styles.cards_card}
        `} ref={myRef}>
          <span className={styles.card_image}>
            <Image layout='fill' src={wallet_icon} />
          </span>
          <span className={styles.card_title}>
            WALLETS
          </span>
          <span className={styles.card_value}>
            SOON
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
            SOON
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
            SOON
          </span>
        </div>
      </div>
    </div>
  )
}

export default Milestones
