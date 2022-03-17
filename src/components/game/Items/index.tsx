import React, { useState } from 'react'
import styles from './styles.module.scss'
import phorseCoin from '@/assets/icons/coin.webp'
import SingleItem from '../SingleItem'
import { items } from '@/utils/mocks/game'
import Image from 'next/image'

const Items: React.FC = () => {

  return (
    <>
    <div className={styles.secondBar}>
      <div className={styles.containerBar}>
        <div className={styles.actionContainer}>
          <div className={styles.actionOptions}>
            <div>HORSES <span className={styles.notificationBadge}></span></div>
          </div>
        </div>
        <div className={styles.countCurrency}>
          <Image width={50} height={50} src={phorseCoin} alt="phorse coin" />
          <span>100000.00</span>
        </div>
      </div>
    </div>

    <div className={styles.container}>
      <span className={styles.title}>ITEMS</span>

      <div className={styles.cardItems}>

        {items.map((item) => (
          <SingleItem key={item.id} item={item} />
        ))}

      </div>
    </div>
    </>
  )
}

export default Items
