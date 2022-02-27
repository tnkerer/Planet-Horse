import React from 'react'
import styles from './styles.module.scss'

const PageContent: React.FC = ({ children }) => {
  return (
    <div className={styles.container}>
      {children}
    </div>
  )
}

export default PageContent

