import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import logoHorseware from '@/assets/profile/logo-horseware.png'
import tapeGraph from '@/assets/utils/tape.webp'
import keyboard from '@/assets/profile/keyboard.gif'

const Horseware = () => {
  return (
    <div className={styles.container}>
      <div className={styles.screen}>
        <svg width='100%' height='130'>
          <rect y='116' fill='#252425' width='100%' height='14' />
          <circle cx="50%" cy="60px" r="45" fill='#252425' />
        </svg>
        <div className={styles.tape}>
          <Image
            src={tapeGraph}
            width={205}
            height={62}
          />
        </div>
        <div className={styles.transation}>
        </div>
        <svg width='100%' height='130'>
          <rect fill='#252425' width='100%' height='14' />
        </svg>
        <div className={styles.shadow} />
        <div className={styles.logo}>
          <Image
            src={logoHorseware}
            width={600}
            height={80}
          />
        </div>
      </div>
      <div className={styles.table}>
        <svg width='700' height='300'>
          <rect fill='#252425' x='4' y='264' width='692' height='4' />
          <rect fill='#252425' x='0' y='250' width='700' height='14' />
          <rect fill='#323132' x='4' y='176' width='692' height='6' />
          <rect fill='#323132' x='0' y='180' width='700' height='70' />
          <rect fill='#323132' x='4' y='250' width='692' height='4' />
          <rect fill='#252425' x='220' width='260' height='228' />
          <rect fill='#252425' x='220' y='228' width='253' height='6' />
        </svg>
        <div className={styles.clarity}>
          <span>
            <Image
              src={keyboard}
              width={805}
              height={240}
            />
          </span>
        </div>
        <div className={styles.shadow} />
      </div>
    </div>
  )
}

export default Horseware
