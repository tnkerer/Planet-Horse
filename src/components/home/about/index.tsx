import React from 'react'
import styles from './styles.module.scss'
import Image from 'next/image'
import brownHorse from '@/assets/home/brown-horse.gif'
import whiteHorse from '@/assets/home/white-horse.gif'

const About: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.sticker}>
            <Image
              src={brownHorse}
              width={320}
              height={320}
            />
          </div>
          <div className={styles.description}>
            <h1 className={styles.title}>what is planethorse</h1>
            <h3 className={styles.explanation}>
              PlanetHorse is a game centered around different racehorses where you compete with competitors in search of the incredible Phorse coin
            </h3>
          </div>
          <div className={styles.sticker}>
            <Image
              src={whiteHorse}
              width={320}
              height={325}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
