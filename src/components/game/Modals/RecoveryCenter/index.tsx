import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'

interface Props {
  closeModal: (modalType: string, horseId?: number) => void
  status: boolean
  horseId: number
  cost: number
}

const RecoveryCenter: React.FC<Props> = ({
  closeModal,
  status,
  horseId,
  cost
}) => {
  return (
    <div
      className={`
        ${styles.modalRecovery}
        ${status ? styles.modalActive : styles.modalInactive}
      `}
    >
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* Botão “X” de fechar */}
          <div
            className={styles.modalClose}
            onClick={() => closeModal('restore')}
          >
            <Image
              src="/assets/x.webp"
              alt="Fechar"
              width={30}
              height={30}
            />
          </div>

          {/* Caixa de diálogo + texto */}
          <div className={styles.dialogContainer}>
            <Image
              src="/assets/dialog_box.png"
              alt="Dialog box"
              width={300}
              height={100}
            />
            <p className={styles.dialogText}>
              Do you wish to buy a treatment for <strong>{cost} PHORSE</strong>?
            </p>
          </div>

          {/* Botão BUY */}
          <button
            className={styles.buyButton}
            onClick={() => {
              // sua lógica de recuperação aqui
              closeModal('restore')
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default RecoveryCenter
