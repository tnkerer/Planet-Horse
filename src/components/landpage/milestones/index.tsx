import React, {  useRef } from 'react'

import { useIsVisible } from '@/utils/hooks/is-visible'

import wallet_icon from '@/assets/landpage/wallet-status.webp'
import horses_icon from '@/assets/landpage/horses-status.webp'
import volume_icon from '@/assets/landpage/volume-status.webp'

import TitleLayer from '@/components/landpage/title-layer'

import Card from './card.component'
import styles from './styles.module.scss'


const Milestones: React.FC = () => {
  const myRef = useRef()
  const isVisible = useIsVisible(myRef)

  const CARDS = [
    { id: 'card-wallets', title: 'Wallets', icon: wallet_icon, value: 20000 }, 
    { id: 'card-horses', title: 'Horses', icon: horses_icon, value: 20000 },
    { id: 'card-volume', title: 'Volume', icon: volume_icon, value: 20000 }
  ]

  return (
    <section className={styles.container}>
      <TitleLayer>Milestones</TitleLayer>
      <div
        ref={myRef}
        className={`
          ${styles.container_cards}
          ${isVisible && styles.animation}
        `}
      >
       {CARDS.map(card => <Card key={card.id} {...card} animate={isVisible} />)}
      </div>
    </section>
  )
}

export default Milestones
