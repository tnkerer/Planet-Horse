import React from 'react'
import styles from './styles.module.scss'

import Image from 'next/image'
import Link from 'next/link'

import planetHorseLogo from '@/assets/landpage/logo-planethorse.gif'

const Presentation: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.container_icon}>
        <Image src={planetHorseLogo} /> 
      </div>
      <div className={styles.container_button}>
        <span>•</span>
        <Link href='#'>PRESS TO EXPLORE</Link>
        <span>•</span>
      </div>
    </div>
  )
}

export default Presentation
