// src/components/game/Modals/MultipleOpenConfirmModal.tsx
import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'

interface Props {
  quantity: number
  max: number
  price: number
  onQuantityChange: (q: number) => void
  onClose: () => void
  onConfirm: () => void
}

const MultipleOpenConfirmModal: React.FC<Props> = ({
  quantity,
  max,
  price,
  onQuantityChange,
  onClose,
  onConfirm,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Image src={close} alt="Close" width={24} height={24} />
        </button>
        <div className={styles.text}>
          Open <strong>{quantity}</strong> chest{quantity > 1 ? 's' : ''}?
        </div>
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min={1}
            max={Math.min(max, 12)}
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
          />
          <output className={styles.sliderValue}>{quantity}</output>
        </div>
        <div className={styles.buttons}>
          <button className={styles.yesBtn} onClick={onConfirm} />
          <button className={styles.noBtn} onClick={onClose} />
        </div>
      </div>
    </div>
  )
}

export default MultipleOpenConfirmModal
