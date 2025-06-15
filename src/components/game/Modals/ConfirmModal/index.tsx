import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

export interface ConfirmModalProps {
  /** Can now be a string _or_ any JSX (to allow colored spans, etc) */
  text: React.ReactNode
  /** Called when the user clicks the “X” */
  onClose: () => void
  /** Called when the user confirms */
  onConfirm: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  text,
  onClose,
  onConfirm,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Close “X” */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <Image src={close} alt="Close" width={24} height={24} />
        </button>

        {/* the dynamic question (now ReactNode) */}
        <div className={styles.text}>{text}</div>

        {/* Yes / No buttons */}
        <div className={styles.buttons}>
          <button className={styles.yesBtn} onClick={onConfirm} />
          <button className={styles.noBtn} onClick={onClose} />
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
