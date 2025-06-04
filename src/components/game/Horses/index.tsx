// src/components/Horses/index.tsx
import React, { useState, useEffect, useCallback } from 'react'
import styles from './styles.module.scss'
import ItemBag from '../Modals/ItemBag'
import SingleHorse from '../SingleHorse'
import Image from 'next/image'
import Link from 'next/link'
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif'
import medal from '@/assets/icons/medal.gif'
import { useUser } from '@/contexts/UserContext'
import { useWallet } from '@/contexts/WalletContext'

// New imports:
import ConfirmModal from '../Modals/ConfirmModal'
import ErrorModal from '../Modals/ErrorModal'

interface BackendHorse {
  tokenId: string
  name: string
  sex: 'MALE' | 'FEMALE'
  status: string
  rarity: string
  exp: number
  upgradable: boolean
  level: number
  currentPower: number
  currentSprint: number
  currentSpeed: number
  currentEnergy: number
  maxEnergy: number
  equipments: Array<{ id: string }>
}

export interface Horse {
  id: number
  profile: {
    name: string
    name_slug: string
    sex: string
    type_horse: string
    type_horse_slug: string
    type_jockey: string
    time: string
  }
  staty: {
    status: string
    level: string
    exp: string
    upgradable: boolean
    power: string
    sprint: string
    speed: string
    energy: string
  }
  items: Array<{ id: number }>
}

interface Props {
  changeView: (view: string) => void
}

const Horses: React.FC<Props> = ({ changeView }) => {
  const [ modalItems, setModalItems ] = useState(false)
  const { phorse, medals, updateBalance } = useUser()
  const { isAuthorized, address } = useWallet()

  const [horseList, setHorseList] = useState<Horse[]>([])

  // ─── Claim‐horse states ──────────────────────────────────────────────────────
  const [showClaimConfirm, setShowClaimConfirm] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)

  // ─── loadHorses ─────────────────────────────────────────────────────────────
  const loadHorses = useCallback(async () => {
    if (!address) {
      setHorseList([])
      return
    }
    updateBalance()
    try {
      const res = await fetch(`${process.env.API_URL}/horses`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as BackendHorse[]
      const mapped: Horse[] = data.map(h => {
        const idNum = Number(h.tokenId)
        const raritySlug = h.rarity.toLowerCase()
        return {
          id: idNum,
          profile: {
            name: h.name,
            name_slug: h.name.toLowerCase().replace(/\s+/g, '-'),
            sex: h.sex.toLowerCase(),
            type_horse: h.rarity.toUpperCase(),
            type_horse_slug: raritySlug,
            type_jockey: 'NONE',
            time: '120 Days',
          },
          staty: {
            status: h.status,
            level: String(h.level),
            exp: `${String(h.exp)}`,
            upgradable: h.upgradable,
            power: String(h.currentPower),
            sprint: String(h.currentSprint),
            speed: String(h.currentSpeed),
            energy: `${h.currentEnergy}/${h.maxEnergy}`,
          },
          items:
            h.equipments.length > 0
              ? h.equipments.map(e => ({ id: Number(e.id) }))
              : [{ id: 1 }, { id: 2 }, { id: 3 }],
        }
      })
      setHorseList(mapped)
    } catch (err) {
      console.error('Failed to load horses:', err)
      setHorseList([])
    }
  }, [isAuthorized, address, updateBalance])

  useEffect(() => {
    loadHorses()
  }, [loadHorses])

  // ─── Handlers to open/close ItemBag ─────────────────────────────────────────
  const toggleModal = (modalType: string) => {
    switch (modalType) {
      case 'items':
        return setModalItems(r => !r)
    }
  }

  // ─── Handler when user clicks “Yes” on ClaimConfirm ─────────────────────────
  const handleDoClaim = async () => {
    setShowClaimConfirm(false)
    setClaimError(null)
    setClaiming(true)
    try {
      const res = await fetch(`${process.env.API_URL}/horses/claim-horse`, {
        method: 'PUT',
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const errJson = await res.json()
          if (errJson?.message) msg = errJson.message
        } catch {
          // ignore JSON parse
        }
        throw new Error(msg)
      }
      // success → reload list
      await loadHorses()
    } catch (e: any) {
      console.error(e)
      setClaimError(e.message || 'Failed to claim a horse')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <>
      {/* ─────────────────── ItemBag Modal ─────────────────────────────────── */}
      <ItemBag status={modalItems} closeModal={toggleModal} />

      {/* ─────────────────── Top Status Bar ─────────────────────────────────── */}
      <div className={styles.secondBar}>
        <div className={styles.containerBar}>
          <div className={styles.actionContainer}>
            <div className={styles.actionOptions}>
              <button
                className={`${styles.bagButton} ${modalItems ? styles.bagOpened : ''}`}
                onClick={() => toggleModal('items')}
                aria-label="Open Bag"
              >
                <span className={styles.notificationBadge}></span>
              </button>
            </div>
          </div>
          <div className={styles.countCurrency}>
            <Image width={50} height={50} src={phorseToken} alt="phorse coin" />
            <span>{phorse?.toFixed(0) || 0}</span>
            <Image width={29} height={40} src={medal} alt="medals" />
            <span>{medals?.toFixed(0) || 0}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────── Horse Grid ──────────────────────────────────────── */}
      <div className={styles.container}>
        <span className={styles.countHorses}>
          {horseList.length} Horses
        </span>

        <div className={styles.cardHorses}>
          {horseList.map(h => (
            <SingleHorse key={h.id} horse={h} reloadHorses={loadHorses} />
          ))}

          {/* ─────────────── “Grab Some Horses” Link ───────────────────────── */}
          <div className={styles.addHorse}>
            <div className={styles.addHorseWrapper}>
              <div className={styles.plusHorse} onClick={e => {
                    e.preventDefault()
                    setShowClaimConfirm(true)
                  }}>+</div>
              <div className={styles.addHorseText}>
                {/* Prevent default navigation; open ConfirmModal instead */}
                <a
                  href="#"
                  className={styles.addHorseLink}
                  onClick={e => {
                    e.preventDefault()
                    setShowClaimConfirm(true)
                  }}
                >
                  GRAB SOME HORSES AND YOU WILL BE ON YOUR WAY TO RUNNING LIKE A PRO!
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────── Confirm “Claim a horse?” ───────────────────────────── */}
      {showClaimConfirm && (
        <ConfirmModal
          text={`Claim a new horse for 1000 PHORSE?`}
          onClose={() => setShowClaimConfirm(false)}
          onConfirm={handleDoClaim}
        />
      )}

      {/* ─────────────── Error if claim failed ──────────────────────────────── */}
      {claimError && (
        <ErrorModal
          text={claimError}
          onClose={() => setClaimError(null)}
        />
      )}
    </>
  )
}

export default Horses
