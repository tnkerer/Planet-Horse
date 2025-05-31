import React, { useEffect, useState, useRef, useCallback } from 'react'
import styles from './styles.module.scss'
import shopData from '@/utils/mocks/game/mock_shop.json'
import ConfirmModal from '../Modals/ConfirmModal'
import MultipleConfirmModal from '../Modals/MultipleConfirmModal'
import ErrorModal from '../Modals/ErrorModal'
import { chests, items as itemDefs } from '@/utils/constants/items'
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
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [buying, setBuying] = useState(false)
  const [resultName, setResultName] = useState<string | null>(null)
  const { address, isAuthorized } = useWallet()
  const { updateBalance } = useUser()
  const [showMultipleConfirm, setShowMultipleConfirm] = useState(false)
  const [quantityToBuy, setQuantityToBuy] = useState(1)

  // safe typing for setTimeout IDs
  const growRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAll = () => {
    if (growRef.current) clearTimeout(growRef.current)
    if (dropRef.current) clearTimeout(dropRef.current)
    if (openRef.current) clearTimeout(openRef.current)
  }

  const handleOpen = (chestType: number) => {
    clearAll()
    setSelectedChestType(chestType)
    setResultName(null)
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
      dropRef.current = setTimeout(() => {
        setStage('open')
      }, DROP_DURATION)
    }
    return () => { if (dropRef.current) clearTimeout(dropRef.current) }
  }, [stage])

  useEffect(() => {
    if (stage !== 'open') return

    (async () => {
      if (selectedChestType == null) return

      try {
        // 1) call openChest API
        const res = await fetch(
          `${process.env.API_URL}/user/chests/open`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chestType: selectedChestType,
              chestQuantity: 1,
            }),
          }
        )
        if (!res.ok) throw new Error(`Open failed (${res.status})`)
        const { drops } = (await res.json()) as { drops: string[] }

        // 2) stash the result
        setResultName(drops[0])

        // 3) wait for the animation to finish
        await new Promise((resolve) => setTimeout(resolve, OPEN_DURATION));

        // 4) show the “opened” overlay
        setStage('opened')
      } catch (err: any) {
        console.error(err)
        setErrorMessage(err.message)
        setShowError(true)
        // bail out: close the chest modal entirely
        handleClose()
      }
    })()
  }, [stage, selectedChestType])


  const handleBuyClick = (chestType: number) => {
    setSelectedChestType(chestType)
    setQuantityToBuy(1)
    setShowMultipleConfirm(true)
  }

  const handleMultipleConfirm = async () => {
    if (selectedChestType == null) return
    setBuying(true)
    try {
      const res = await fetch(
        `${process.env.API_URL}/user/chests/buy`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chestType: selectedChestType,
            chestQuantity: quantityToBuy,
          }),
        }
      )
      if (!res.ok) throw new Error(`Buy failed (${res.status})`)
      setChestQuantities(prev => ({
        ...prev,
        [selectedChestType]: (prev[selectedChestType] || 0) + quantityToBuy,
      }))
      updateBalance()
    } catch (e) {
      const error: string = e.message.toString()
      setErrorMessage(`Purchase error: ${error}`)
      setShowError(true)
    } finally {
      setBuying(false)
      setShowMultipleConfirm(false)
    }
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
      const error: string = e.message;
      setErrorMessage(`Purchase failed with error: ${error}`)
      setShowError(true)
      // optionally show error
    } finally {
      setBuying(false)
      setShowConfirm(false)
    }
  }

  const fetchChestQuantities = useCallback(async () => {
    if(!address) {
      setChestQuantities([])
      return
    }
    try {
      const res = await fetch(`${process.env.API_URL}/user/chests`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ChestRecord[]
      const map: Record<number, number> = {}
      data.forEach(c => { map[c.chestType] = c.quantity })
      setChestQuantities(map)
    } catch (err) {
      console.error('Failed to fetch chest quantities:', err)
    }
  }, [isAuthorized, address])

  // load mock items and then override quantities from backend
  useEffect(() => {
    setItems(shopData)
    fetchChestQuantities()
  }, [fetchChestQuantities])

  const handleResultClose = () => {
    handleClose()         // hides the chest modal + resets stage
    setResultName(null)   // clear the drop
    setStage(null)
    fetchChestQuantities() // refresh the chest count
  }

  const price = chests[selectedChestType]?.price
  const priceStr = String(price)
  const itemImage: string = itemDefs[resultName]?.src.toString()

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
          {stage === 'opened' && (
            <div className={styles.resultOverlay} onClick={handleResultClose}>
              <img
                src="/assets/items/light_ray.webp"
                className={styles.lightRay}
                onClick={(e) => e.stopPropagation()}
              />
              <h2 className={styles.resultTitle} onClick={(e) => e.stopPropagation()}>
                You received {resultName}!
              </h2>
              <div className={styles.itemPreview} onClick={(e) => e.stopPropagation()}>
                <img
                  src={
                    resultName.toLowerCase().endsWith('phorse')
                      ? '/assets/items/phorse.webp'
                      : `/assets/items/${itemImage}.webp`
                  }
                  alt={resultName}
                  className={styles.dropItem}
                />
              </div>
            </div>
          )}
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
                  onClick={qty === 0 ? undefined : () => handleOpen(item.id)}
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

      {/* multiple‐chest slider confirm */}
      {showMultipleConfirm && selectedChestType != null && (
        <MultipleConfirmModal
          quantity={quantityToBuy}
          max={10}
          price={chests[selectedChestType].price}
          onQuantityChange={setQuantityToBuy}
          onClose={() => setShowMultipleConfirm(false)}
          onConfirm={handleMultipleConfirm}
        />
      )}

      {showError && (
        <ErrorModal
          text={errorMessage}
          onClose={() => setShowError(false)}
        />
      )}
    </>
  )
}

export default ShopChestCard
