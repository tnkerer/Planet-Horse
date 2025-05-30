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

const MultipleConfirmModal: React.FC<Props> = ({
  quantity,
  max,
  price,
  onQuantityChange,
  onClose,
  onConfirm,
}) => {
  const total = quantity * price

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

        {/* Dynamic text */}
        <div className={styles.text}>
          Buy <strong>{quantity}</strong> chest
          {quantity > 1 ? 's' : ''} for <strong>{total}</strong> PHORSE?
        </div>

        {/* Slider */}
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min={1}
            max={max}
            value={quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
          />
          <output className={styles.sliderValue}>{quantity}</output>
        </div>

        {/* YES / NO buttons */}
        <div className={styles.buttons}>
          <button className={styles.yesBtn} onClick={onConfirm} />
          <button className={styles.noBtn} onClick={onClose} />
        </div>
      </div>
    </div>
  )
}

export default MultipleConfirmModal
