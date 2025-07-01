// components/PresaleCard/index.tsx
import React, { useState } from 'react'
import styles from './styles.module.scss'
import PresaleConfirmModal from '../Modals/PresaleConfirmModal'

const PresaleCard: React.FC = () => {
  const [showModal, setShowModal] = useState(false)
  const [horseCount, setHorseCount] = useState(0)

  const handleBuyClick = async () => {
    try {
      const res = await fetch(`${process.env.API_URL}/horses/blockchain`, {
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to fetch horses')
      const horses = await res.json()
      setHorseCount(horses.length)
      setShowModal(true)
    } catch (err) {
      console.error('Failed to fetch horse count:', err)
      alert('Could not determine your horse count. Please try again.')
    }
  }

  return (
    <>
      <div
        className={styles.card}
        style={{ backgroundImage: `url('/assets/items/phorse_idle.gif')` }}
      >
        <div className={styles.buttonRow}>
          <button className={styles.buyButton} onClick={handleBuyClick}>
            BUY PHORSE
          </button>
        </div>
      </div>

      {showModal && (
        <PresaleConfirmModal
          quantity={horseCount}
          max={Math.min(horseCount * 1000, 30000)}
          price={1000}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default PresaleCard
