import React, { useEffect, useState } from 'react'
import styles from './styles.module.scss'
import shopData from '@/utils/mocks/game/mock_shop.json'
import Image from 'next/image'

interface ShopItem {
  id: number
  name: string
  'src-idle': string
  'src-drop': string
  'src-open': string
  quantity: string
}

const ShopChestCard: React.FC = () => {
  const [items, setItems] = useState<ShopItem[]>([])

  useEffect(() => {
    setItems(shopData)
  }, [])

  return (
    <div className={styles.grid}>
      {items.map(item => (
         <div
           key={item.id}
           className={styles.card}
           style={{
             backgroundImage: `url('/assets/items/${item['src-idle']}.gif')`
           }}
         >

          {/* Badge de quantidade */}
          <div className={styles.itemBadge}>{item.quantity}</div>

          {/* Botões */}
          <div className={styles.buttonRow}>
            <button
              className={styles.buyButton}
              onClick={() => console.log('BUY CHEST CLICKED')}
            >
              BUY CHEST
            </button>
            <button
              className={styles.openButton}
              onClick={() => console.log('OPEN CHEST CLICKED')}
            >
              OPEN CHEST
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ShopChestCard
