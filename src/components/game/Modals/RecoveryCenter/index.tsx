import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

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

  const fullText = `Do you wish to buy a treatment for ${cost} PHORSE?`
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    if (!status) return
    setDisplayedText('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(timer)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [status, fullText])

  if (!status) return null

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
              src={close}
              alt="Close"
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
            <div className={styles.dialogText}>
              {displayedText}
              <span className={styles.cursor}>|</span>
            </div>
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
