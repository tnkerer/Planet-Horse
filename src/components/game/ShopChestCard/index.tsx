import React, { useEffect, useState, useRef, useCallback } from 'react'
import styles from './styles.module.scss'
import shopData from '@/utils/mocks/game/mock_shop.json'
import ConfirmModal from '../Modals/ConfirmModal'
import ErrorModal from '../Modals/ErrorModal'
import { chests, items as itemDefs } from '@/utils/constants/items'
import { useUser } from '@/contexts/UserContext'
import { useWallet } from '@/contexts/WalletContext'
import MultipleOpenConfirmModal from '../Modals/MultipleOpenConfirmModal.tsx'
import MultipleConfirmModal from '../Modals/MultipleConfirmModal'

interface ShopItem {
  id: number
  name: string
  'src-idle': string
  'src-drop': string
  'src-open': string
  quantity: string
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
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [buying, setBuying] = useState(false)
  const { address, isAuthorized } = useWallet()
  const { updateBalance } = useUser()
  const [quantityToOpen, setQuantityToOpen] = useState(1)
  const [quantityToBuy, setQuantityToBuy] = useState(1)
  const [showOpenMultipleConfirm, setShowOpenMultipleConfirm] = useState(false)
  const [showBuyMultipleConfirm, setShowBuyMultipleConfirm] = useState(false)
  const [resultNames, setResultNames] = useState<string[]>([])

  const growRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAll = () => {
    if (growRef.current) clearTimeout(growRef.current)
    if (dropRef.current) clearTimeout(dropRef.current)
  }

  const handleOpen = (chestType: number) => {
    setSelectedChestType(chestType)
    const qty = chestQuantities[chestType] ?? 0
    if (qty > 1) {
      setQuantityToOpen(1)
      setShowOpenMultipleConfirm(true)
    } else {
      startOpenFlow(chestType, 1)
    }
  }

  const startOpenFlow = (chestType: number, quantity: number) => {
    clearAll()
    setResultNames([])
    setSelectedChestType(chestType)
    setIsModalOpen(true)
    setStage('grow')
    setQuantityToOpen(quantity)
  }

  const handleClose = () => {
    clearAll()
    setStage(null)
    setIsModalOpen(false)
    if (selectedChestType != null && quantityToOpen > 0) {
      setChestQuantities(prev => ({
        ...prev,
        [selectedChestType]: Math.max((prev[selectedChestType] ?? 0) - quantityToOpen, 0),
      }))
    }
  }

  useEffect(() => {
    if (stage === 'grow') {
      growRef.current = setTimeout(() => setStage('drop'), GROW_DURATION)
    }
    return () => growRef.current && clearTimeout(growRef.current)
  }, [stage])

  useEffect(() => {
    if (stage === 'drop') {
      dropRef.current = setTimeout(() => setStage('open'), DROP_DURATION)
    }
    return () => dropRef.current && clearTimeout(dropRef.current)
  }, [stage])

  useEffect(() => {
    if (stage !== 'open' || selectedChestType == null) return

      ; (async () => {
        try {
          const res = await fetch(`${process.env.API_URL}/user/chests/open`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chestType: selectedChestType,
              chestQuantity: quantityToOpen,
            }),
          })
          if (!res.ok) throw new Error(`Open failed (${res.status})`)
          const { drops } = await res.json()
          setResultNames(drops)
          await new Promise(resolve => setTimeout(resolve, OPEN_DURATION))
          setStage('opened')
        } catch (err: any) {
          setErrorMessage(err.message || 'Unexpected error')
          setShowError(true)
          handleClose()
        }
      })()
  }, [stage, selectedChestType])

  const fetchChestQuantities = useCallback(async () => {
    if (!address) return setChestQuantities({})
    try {
      const res = await fetch(`${process.env.API_URL}/user/chests`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as ChestRecord[]
      const map: Record<number, number> = {}
      data.forEach(c => { map[c.chestType] = c.quantity })
      setChestQuantities({ ...map })
    } catch (err) {
      console.error('Failed to fetch chest quantities:', err)
    }
  }, [isAuthorized, address])

  useEffect(() => {
    setItems(shopData)
    fetchChestQuantities()
  }, [fetchChestQuantities])

  const handleBuyConfirm = async () => {
    if (selectedChestType == null) return
    setBuying(true)
    try {
      const res = await fetch(`${process.env.API_URL}/user/chests/buy`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chestType: selectedChestType,
          chestQuantity: quantityToBuy,
        }),
      })
      if (!res.ok) throw new Error(`Buy failed (${res.status})`)
      setChestQuantities(prev => ({
        ...prev,
        [selectedChestType]: (prev[selectedChestType] || 0) + quantityToBuy,
      }))
      updateBalance()
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error')
      setShowError(true)
    } finally {
      setBuying(false)
      setShowBuyMultipleConfirm(false)
    }
  }

  const handleResultClose = () => {
    handleClose()
    setResultNames([])
    if (selectedChestType != null && quantityToOpen > 0) {
      setChestQuantities(prev => ({
        ...prev,
        [selectedChestType]: Math.max((prev[selectedChestType] ?? 0) - quantityToOpen, 0),
      }))
    }

    updateBalance()
  }

  return (
    <>
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${stage === 'grow' ? styles.grow : ''}`}>
            <div onClick={handleClose} className={styles.closeButton} />
            {stage === 'drop' && <img src="/assets/items/chest_drop.gif" className={styles.gif} />}
            {stage === 'open' && <img src="/assets/items/chest_opening.gif" className={styles.gif} />}
            {stage === 'opened' && <img src="/assets/items/chest_opened.gif" className={styles.gif} />}
          </div>
          {stage === 'opened' && (
            <div className={styles.resultOverlay} onClick={handleResultClose}>
              <img
                src="/assets/items/light_ray.webp"
                className={styles.lightRay}
                onClick={(e) => e.stopPropagation()}
              />

              {resultNames.length === 1 ? (
                <div className={styles.itemPreview} onClick={(e) => e.stopPropagation()}>
                  <img
                    src={
                      resultNames[0].toLowerCase().endsWith('phorse')
                        ? '/assets/items/phorse.webp'
                        : `/assets/items/${String(itemDefs[resultNames[0]]?.src || resultNames[0])}.webp`
                    }
                    alt={resultNames[0]}
                    className={styles.dropItem}
                  />
                  <div className={styles.itemLabel}>{resultNames[0]}</div>
                </div>
              ) : (
                <div className={styles.resultGrid} onClick={(e) => e.stopPropagation()}>
                  {resultNames.map((name, i) => {
                    const src = name.toLowerCase().endsWith('phorse')
                      ? '/assets/items/phorse.webp'
                      : `/assets/items/${String(itemDefs[name]?.src || name)}.webp`
                    return (
                      <div className={styles.resultItem} key={i}>
                        <img src={src} alt={name} className={styles.dropGridItem} />
                        <div className={styles.itemLabel}>{name}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.grid}>
        {items.map(item => {
          const qty = chestQuantities[Number(item.id)] ?? 0
          const paused = chests[item.id]?.paused ?? false
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
                  disabled={paused || buying}
                  onClick={() => {
                    setSelectedChestType(item.id)
                    setQuantityToBuy(1)
                    setShowBuyMultipleConfirm(true)
                  }}
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

      {showOpenMultipleConfirm && selectedChestType != null && (
        <MultipleOpenConfirmModal
          quantity={quantityToOpen}
          max={chestQuantities[selectedChestType] ?? 1}
          price={chests[selectedChestType].price}
          onQuantityChange={setQuantityToOpen}
          onClose={() => {
            setShowOpenMultipleConfirm(false)
          }}
          onConfirm={() => {
            setShowOpenMultipleConfirm(false)
            startOpenFlow(selectedChestType, quantityToOpen)
          }}
        />
      )}

      {showBuyMultipleConfirm && selectedChestType != null && (
        <MultipleConfirmModal
          quantity={quantityToBuy}
          max={10}
          price={chests[selectedChestType].price}
          onQuantityChange={setQuantityToBuy}
          onClose={() => setShowBuyMultipleConfirm(false)}
          onConfirm={handleBuyConfirm}
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
