import React, {  useRef } from 'react'

import { useIsVisible } from '@/utils/hooks/is-visible'
import TitleLayer from '@/components/landpage/title-layer'

import Card from './card.component'
import styles from './styles.module.scss'


const Milestones: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  const CARDS = [
    { id: 'card-wallets', title: 'Wallets', icon: '/assets/landpage/wallet-status.webp', value: 20000 }, 
    { id: 'card-horses', title: 'Horses', icon: '/assets/landpage/horses-status.webp', value: 20000 },
    { id: 'card-volume', title: 'Volume', icon: '/assets/landpage/volume-status.webp', value: 20000 }
  ]

  return (
    <section className={styles.container}>
      <TitleLayer>Gameplay</TitleLayer>
      <div
        ref={myRef}
        className={`
          ${styles.container_cards}
          ${isVisible && styles.animation}
        `}
      >
       {/* {CARDS.map(card => <Card key={card.id} {...card} animate={isVisible} />)} */}
      </div>
    </section>
  )
}

export default Milestones
