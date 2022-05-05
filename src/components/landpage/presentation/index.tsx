import React from 'react'

import Link from 'next/link'
import Image from 'next/image'

import LogoPlanetHorse from '@/assets/landpage/logo-planethorse.gif'
import styles from './styles.module.scss'


const Presentation: React.FC = () => {
  return (
    <section className={styles.container}>
      <div className={styles.container_icon}>
        <Image src={LogoPlanetHorse} alt='Planet Horse' layout='intrinsic'/>
      </div>

      <div className={styles.container_button}>
        <span>•</span>
        <Link href='#'>Press to explore</Link>
        <span>•</span>
      </div>
    </section>
  )
}

export default Presentation
