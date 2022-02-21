import React from 'react'
import styles from './styles.module.scss'
import GraphicalButton from '@/utils/components/graphical-button'

const WhitePaper: React.FC = () => {
  return (
    <div className={styles.container}>
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
