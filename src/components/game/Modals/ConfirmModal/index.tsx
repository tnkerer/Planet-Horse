import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

interface ConfirmModalProps {
  /** The question text to display above the buttons */
  text: string
  /** Called when the user clicks the “X” */
  onClose: () => void
  onConfirm: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ text, onClose, onConfirm }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* 5. Close “X” */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Image src={close} alt="Close" width={24} height={24} />
        </button>

        {/* 4. The dynamic question text */}
        <div className={styles.text}>{text}</div>

        {/* 2. Buttons row */}
        <div className={styles.buttons}>
          <button
            className={styles.yesBtn}
            onClick={onConfirm}
          >
          </button>
          <button
            className={styles.noBtn}
            onClick={onClose}
          >
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
