import React from 'react'
import styles from './styles.module.scss'
import Fan from '@/assets/pre-sale/fan.gif'

const Footer: React.FC = () => {
  return (
    <div className={styles.fanArea}>
        <img src={Fan.src} />
    </div>
  )
}

export default Footer
