import React from 'react'
import styles from './styles.module.scss'

const Board: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.clarity} />
      <div className={styles.clarityBorder} />
      <div className={styles.line} />
      <div className={styles.shadowBorder} />
      <div className={styles.shadow} />
    </div>
  )
}

export default Board
