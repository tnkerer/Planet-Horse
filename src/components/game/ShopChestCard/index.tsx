import React, { useEffect, useState, useRef } from 'react'
import styles from './styles.module.scss'
import shopData from '@/utils/mocks/game/mock_shop.json'
import ConfirmModal from '../Modals/ConfirmModal'
import { chests } from '@/utils/constants/items'
import { useUser } from '@/contexts/UserContext'
import { useWallet } from '@/contexts/WalletContext'

interface ShopItem {
  id: number
  name: string
  'src-idle': string
  'src-drop': string
  'src-open': string
  quantity: string // fallback if no backend data
}

type ChestRecord = { chestType: number; quantity: number }

const DROP_DURATION = 2000
const OPEN_DURATION = 2500
const GROW_DURATION = 750

const ShopChestCard: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([])
  const [chestQuantities, setChestQuantities] = useState<Record<number, number>>({})
  const [selectedChestType, setSelectedChestType] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stage, setStage] = useState<'grow' | 'drop' | 'open' | 'opened' | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [buying, setBuying] = useState(false)
  const { address, isAuthorized } = useWallet()
  const { updateBalance } = useUser()

  // safe typing for setTimeout IDs
  const growRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // load mock items and then override quantities from backend
  useEffect(() => {
    setItems(shopData)
    fetch(`${process.env.API_URL}/user/chests`, { credentials: 'include' })
      .then(res => res.ok ? res.json() as Promise<ChestRecord[]> : [])
      .then(data => {
        const map: Record<number, number> = {}
        data.forEach(c => { map[c.chestType] = c.quantity })
        setChestQuantities(map)
      })
      .catch(console.error)
  }, [ isAuthorized , address ])

  const clearAll = () => {
    if (growRef.current) clearTimeout(growRef.current)
    if (dropRef.current) clearTimeout(dropRef.current)
    if (openRef.current) clearTimeout(openRef.current)
  }

  const handleOpen = () => {
    clearAll()
    setIsModalOpen(true)
    setStage('grow')
  }

  const handleClose = () => {
    clearAll()
    setStage(null)
    setIsModalOpen(false)
  }

  useEffect(() => {
    if (stage === 'grow') {
      growRef.current = setTimeout(() => setStage('drop'), GROW_DURATION)
    }
    return () => { if (growRef.current) clearTimeout(growRef.current) }
  }, [stage])

  useEffect(() => {
    if (stage === 'drop') {
      dropRef.current = setTimeout(() => setStage('open'), DROP_DURATION)
    }
    return () => { if (dropRef.current) clearTimeout(dropRef.current) }
  }, [stage])

  useEffect(() => {
    if (stage === 'open') {
      openRef.current = setTimeout(() => setStage('opened'), OPEN_DURATION)
    }
    return () => { if (openRef.current) clearTimeout(openRef.current) }
  }, [stage])

  const handleBuyClick = (chestType: number) => {
    setSelectedChestType(chestType)
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    if (selectedChestType == null) return
    const price = chests[selectedChestType]?.price
    setBuying(true)
    try {
      const res = await fetch(
        `${process.env.API_URL}/user/chests/buy`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chestType: selectedChestType, chestQuantity: 1 }),
        }
      )
      if (!res.ok) throw new Error(`Buy failed (${res.status})`)
      // update local quantity
      setChestQuantities(prev => ({
        ...prev,
        [selectedChestType]: (prev[selectedChestType] || 0) + 1,
      }))
      // update phorse balance
      updateBalance()
    } catch (e) {
      console.error(e)
      // optionally show error
    } finally {
      setBuying(false)
      setShowConfirm(false)
    }
  }

  const price = chests[selectedChestType]?.price
  const priceStr = String(price)

  return (
    <>
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${stage === 'grow' ? styles.grow : ''}`}>
            <div onClick={handleClose} className={styles.closeButton} />
            {stage === 'drop' && <img src="/assets/items/chest_drop.gif" alt="Chest Drop" className={styles.gif} />}
            {stage === 'open' && <img src="/assets/items/chest_opening.gif" alt="Chest Opening" className={styles.gif} />}
            {stage === 'opened' && <img src="/assets/items/chest_opened.gif" alt="Chest Opened" className={styles.gif} />}
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {items.map(item => {
          const qty = chestQuantities[item.id] ?? 0
          const paused = chests[item.id]?.paused ?? false
          const price = chests[item.id]?.price ?? 0
          return (
            <div
              key={item.id}
              className={styles.card}
              style={{ backgroundImage: `url('/assets/items/${item['src-idle']}.gif')` }}
            >
              <div className={styles.itemBadge}>{qty}</div>
              <div className={styles.buttonRow}>
                <button
                  className={styles.buyButton}
                  style={!address ? { cursor: 'not-allowed', backgroundImage: 'url("/assets/game/buttons/button-click.svg")' } : {}}
                  onClick={() => handleBuyClick(item.id)}
                  disabled={paused || buying}
                >
                  BUY CHEST
                </button>
                <button
                  className={styles.openButton}
                  style={qty === 0 ? { cursor: 'not-allowed', backgroundImage: 'url("/assets/game/buttons/button-click.svg")' } : {}}
                  onClick={qty === 0 ? undefined : handleOpen}
                >
                  OPEN CHEST
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showConfirm && selectedChestType != null && (
        <ConfirmModal
          text={`Do you wish to buy a chest for ${priceStr} PHORSE?`}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

export default ShopChestCard
