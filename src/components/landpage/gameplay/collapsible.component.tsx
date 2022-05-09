import React, { useEffect, useState } from 'react'

import styles from './styles.module.scss'

type Props = {
  title: string
  open: boolean
  onOpen: () => void
  onClose: () => void
}

const Collapsible: React.FC<Props> = ({ children, title, open, onOpen, onClose }) => {
  const [isOpen, setIsOpen] = useState(open)

  const handleOnClick = () => setIsOpen(prevState => !prevState)

  useEffect(() => { if (isOpen) onOpen() }, [isOpen, open])

  return (
    <div className={`${styles.wrap_collapsible} ${isOpen && styles.open}`}>
      <button about={title} onClick={handleOnClick} className={styles.toggle}>
        <u>{title}</u>
      </button>
      <div className={styles.collapsible_content}>
        <p className={styles.content_inner}>{children}</p>
      </div>
    </div>
  )
}

export default Collapsible
