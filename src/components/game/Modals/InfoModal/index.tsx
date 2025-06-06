import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

interface InfoModalProps {
  /** The question text to display above the buttons */
  text: string
  /** Called when the user clicks the “X” */
  onClose: () => void
}

const InfoModal: React.FC<InfoModalProps> = ({ text, onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 5. Close “X” */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Image src={close} alt="Close" width={24} height={24} />
        </button>

        {/* 4. The dynamic question text */}
        <div className={styles.text}>{text}</div>
      </div>
    </div>
  )
}

export default InfoModal
