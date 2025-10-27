import React, { Dispatch, SetStateAction, useEffect, useState, useMemo } from 'react'
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
  // NEW: does this user own a Stable?
  const [hasStable, setHasStable] = useState(false)

  useEffect(() => {
    let cancelled = false
    const loadStable = async () => {
      try {
        const res = await fetch(`${process.env.API_URL}/stable/blockchain`, { credentials: 'include' })
        const data = await res.json().catch(() => ([]))
        if (!cancelled) {
          const first = Array.isArray(data) && data.length ? data[0] : null
          setHasStable(!!first)
        }
      } catch {
        if (!cancelled) setHasStable(false)
      }
    }
    void loadStable()
    return () => { cancelled = true }
  }, [])

  // UPDATED: PHORSE cost becomes 0 if user has a Stable
  const cost = hasStable ? 0 : totalHorses * 50

  // SHARD cost across selected horses
  const shardCost = useMemo(() => {
    return (horses ?? []).reduce((sum: number, h: any) => {
      const ownerCF = h?.staty.ownerCareerFactor
      const horseCF = h?.staty.horseCareerFactor
      return sum + Math.ceil(100 * ownerCF * horseCF)
    }, 0)
  }, [horses])

  // UPDATED: dialog text reflects the (possibly zero) PHORSE cost
  const fullText =
    `Would you like to run your ` +
    `${totalHorses} IDLE horses for a ${cost} PHORSE fee and ${Number(shardCost)} SHARDS?`

  const [displayedText, setDisplayedText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [textFinished, setTextFinished] = useState(false)

  useEffect(() => {
    if (!status) return
    setDisplayedText('')
    setErrorMessage(null)
    setTextFinished(false)

    let i = 0
    const timer = setInterval(() => {
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(timer)
        setTextFinished(true)
      }
    }, 25)
    return () => clearInterval(timer)
  }, [status, fullText])

  if (!status) return null

  const handleRun = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const tokenIds = horses.map(h => (h.tokenId ?? h.id)?.toString())

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
        } catch { /* noop */ }
        throw new Error(msg)
      }

      await reloadHorses()
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
          </div>

          <div className={styles.dialogWrapper}>
            <img src="/assets/characters/punter.png" alt="Punter" className={styles.character} />

            <div className={styles.rpgDialogBox}>
              <div className={styles.dialogText}>
                {displayedText}
                <span className={styles.cursor}>|</span>
              </div>

              {/* Optional: small badge when free due to Stable */}
              {textFinished && hasStable && (
                <div className={styles.freeBadge}>
                  Stable perk applied — PHORSE cost is 0
                </div>
              )}

              {textFinished && (
                <div className={styles.answerBox}>
                  <div className={styles.answerOption} onClick={handleRun}>
                    Yes
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default RacesModal
