import React from 'react'

import Link from 'next/link'
import Image from 'next/image'

import styles from './styles.module.scss'


const Presentation: React.FC = () => {
  return (
    <section className={styles.container}>
      <div className={styles.container_icon}/>
      <div className={styles.container_button}>
        <span>•</span>
        <a href='/game'>Start</a>
        <span>•</span>
      </div>
    </section>
  )
}

export default Presentation
