import React from 'react'
import styles from './styles.module.scss'
import percent from '@/assets/pre-sale/percentage-blind-chest.webp'
import Image from 'next/image'

const Percent: React.FC = () => {
  return (
    <>
      <div className={styles.percentContainer}>
        <div className={styles.percentImageBackground}>
          <div className={styles.percentImage}>
            <Image src={percent} alt="percent image" />
          </div>
        </div>
      </div>
    </>
  )
}

export default Percent
