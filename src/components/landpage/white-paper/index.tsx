import React from 'react'
import styles from './styles.module.scss'
import GraphicalButton from '@/utils/components/graphical-button'

const WhitePaper: React.FC = () => {
  return (
    <div className={styles.container}>
      <svg width='100%' height='254px'>
        <rect fill='#a26b61' width='100%' height='210px' />
        <rect y='210' fill='#ae7970' width='100%' height='6px' />
        <rect y='216' fill='#6c4139' width='100%' height='38px' />
      </svg>
      <div
        className={styles.slot}
      >
        <GraphicalButton
          to='https://whitepaper.planethorse.me/portuguese-version-1.0/home'
          id={styles.whitepaper}
          inactive={styles.inactive}
          active={styles.active}
        />
      </div>
    </div>
  )
}

export default WhitePaper
