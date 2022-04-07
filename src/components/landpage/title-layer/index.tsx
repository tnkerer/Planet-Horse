import React from 'react'
import styles from './styles.module.scss'

const TitleLayer: React.FC = ({ children }) => {
  return (
    <span className={styles.container}>
      <div className={`
        ${styles.container_content}
        ${styles.animation}
      `}>
        <span className={styles.content_text}>
          {children}
        </span>
        <span className={styles.content_line__horizontal} />
        <span className={styles.content_line__diagonal}>
          <span className={styles.diagonal_circle} />
        </span>
      </div>
    </span>
  )
}

export default TitleLayer
