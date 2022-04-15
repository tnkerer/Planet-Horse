import React from 'react'
import styles from './styles.module.scss'

import Link from 'next/link'

const Presentation: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.container_icon} />
      <div className={styles.container_button}>
        <span>•</span>
        <Link href='#'>PRESS TO EXPLORE</Link>
        <span>•</span>
      </div>
    </div>
  )
}

export default Presentation
