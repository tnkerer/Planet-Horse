import React, { useEffect, useState, useRef } from 'react'
import styles from './styles.module.scss'
import shopData from '@/utils/mocks/game/mock_shop.json'

interface ShopItem {
  id: number
  name: string
  'src-idle': string
  'src-drop': string
  'src-open': string
  quantity: string
}

const DROP_DURATION = 2000
const OPEN_DURATION = 2500
const GROW_DURATION = 750

const ShopChestCard: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [stage, setStage] = useState<'grow'|'drop'|'open'|null>(null)

  // tipagem segura para o retorno de setTimeout no browser
  const growRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setItems(shopData)
  }, [])

  const clearAll = () => {
    if (growRef.current !== null) clearTimeout(growRef.current)
    if (dropRef.current !== null) clearTimeout(dropRef.current)
    if (openRef.current !== null) clearTimeout(openRef.current)
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

  // transição para 'drop' após finalizar a animação de grow
  useEffect(() => {
    if (stage === 'grow') {
      growRef.current = setTimeout(() => setStage('drop'), GROW_DURATION)
    }
    return () => {
      if (growRef.current !== null) clearTimeout(growRef.current)
    }
  }, [stage])

  // transição para 'open' após a animação de drop
  useEffect(() => {
    if (stage === 'drop') {
      dropRef.current = setTimeout(() => setStage('open'), DROP_DURATION)
    }
    return () => {
      if (dropRef.current !== null) clearTimeout(dropRef.current)
    }
  }, [stage])

  // fecha o modal quando a animação de open terminar
  useEffect(() => {
    if (stage === 'open') {
      openRef.current = setTimeout(handleClose, OPEN_DURATION)
    }
    return () => {
      if (openRef.current !== null) clearTimeout(openRef.current)
    }
  }, [stage])

  return (
    <>
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${stage === 'grow' ? styles.grow : ''}`}>
            <div onClick={handleClose} className={styles.closeButton} />
            {stage === 'drop' && (
              <img
                src="/assets/items/chest_drop.gif"
                alt="Chest Drop"
                className={styles.gif}
              />
            )}
            {stage === 'open' && (
              <img
                src="/assets/items/chest_opening.gif"
                alt="Chest Opening"
                className={styles.gif}
              />
            )}
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {items.map(item => (
          <div
            key={item.id}
            className={styles.card}
            style={{ backgroundImage: `url('/assets/items/${item['src-idle']}.gif')` }}
          >
            <div className={styles.itemBadge}>{item.quantity}</div>
            <div className={styles.buttonRow}>
              <button className={styles.buyButton} onClick={() => console.log('BUY CHEST')}>
                BUY CHEST
              </button>
              <button
                className={styles.openButton}
                style={
                  item.quantity === '0'
                    ? { cursor: 'not-allowed', backgroundImage: 'url("/assets/game/buttons/button-click.svg")' }
                    : {}
                }
                onClick={item.quantity === '0' ? undefined : handleOpen}
              >
                OPEN CHEST
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default ShopChestCard
