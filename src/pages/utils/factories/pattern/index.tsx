import React from 'react'
import styles from './styles.module.scss'

interface Props {
  type: string
}

const Pattern: React.FC<Props> = ({ children, type }) => {
  return (
    <div className={styles[type]}>
      {children}
    </div>
  )
}

export default Pattern
