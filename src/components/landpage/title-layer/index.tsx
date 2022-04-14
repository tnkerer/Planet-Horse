import React from 'react'
import styles from './styles.module.scss'

const TitleLayer: React.FC = ({ children }) => {
  return (
    <div className={`${styles.container} ${styles.animation}`}>
      <div className={styles.container_content}>
        <div className={styles.content_title}>
          <svg height='80' width='100%'>
            <path d='M 10 20 L 80 80' stroke='#fff' strokeWidth='1' />
            <circle cx='10' cy='20' r='5' fill='#fff' />
            <path d='M 81 79 l 900 0' stroke='#fff' strokeWidth='1' />
          </svg>
          <span className={styles.content_text}>
            {children}
          </span>
        </div>
      </div>
    </div>
  )
}

export default TitleLayer
