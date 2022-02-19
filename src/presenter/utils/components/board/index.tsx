import React from 'react'
import styles from './styles.module.scss'

const Board: React.FC = () => {
  return (
    <>
      <div className={styles.board}>
        <div className={styles.clarity} />
        <div className={styles.clarityBorder} />
        <div className={styles.shadowBorder} />
        <div className={styles.shadow} />
      </div>
      <hr className={styles.line}></hr>
    </>
  )
}

export default Board
