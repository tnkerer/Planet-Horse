import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import ErrorModal from '../ErrorModal'

interface Props {
  setVisible: Dispatch<SetStateAction<boolean>>
  status: boolean
  totalHorses: number
  horses: any[]
  reloadHorses: () => Promise<void>;
}

const RacesModal: React.FC<Props> = ({
  setVisible,
  status,
  totalHorses,
  horses,
  reloadHorses,
}) => {
  const cost = totalHorses * 50
  const fullText = `Do you want to run your ${totalHorses} IDLE horses for a ${cost} fee?`
  const [displayedText, setDisplayedText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!status) return
    setDisplayedText('')
    setErrorMessage(null)

    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [status, fullText])

  if (!status) return null

  const handleRun = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const tokenIds = horses.map(h => h.id.toString())

      const res = await fetch(`${process.env.API_URL}/horses/start-multiple-race`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenIds }),
      })

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const err = await res.json()
          if (err?.message) msg = err.message
        } catch {}
        throw new Error(msg)
      }

      // Success
      reloadHorses()
      setVisible(false)
    } catch (e: any) {
      console.error(e)
      setErrorMessage(e.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {errorMessage && (
        <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      <div
        className={`
          ${styles.modalRecovery}
          ${status ? styles.modalActive : styles.modalInactive}
        `}
      >
        <div className={styles.modalFull}>
          <div className={styles.modalContent} style={{ backgroundImage: "url('/assets/race.gif')" }}>
            <div className={styles.modalClose} onClick={() => setVisible(false)}>
              <Image src={close} alt="Close" width={30} height={30} />
            </div>

            <div className={styles.dialogContainer}>
              <Image src="/assets/dialog_box_2.png" alt="Dialog box" width={300} height={100} />
              <div className={styles.dialogText}>
                {displayedText}
                <span className={styles.cursor}>|</span>
              </div>
            </div>

            <button className={styles.buyButton} onClick={handleRun} disabled={loading} />
          </div>
        </div>
      </div>
    </>
  )
}

export default RacesModal
