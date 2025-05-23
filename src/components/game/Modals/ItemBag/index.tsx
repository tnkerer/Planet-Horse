import React from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import items from '@/utils/mocks/game/mock_items.json'
import close from '@/assets/game/pop-up/fechar.png'

interface Item {
  id: number
  name: string
  src: string
  value: string
  description: string
}

interface Props {
  status: boolean
  closeModal: (modalType: string) => void
}

const ItemBag: React.FC<Props> = ({ status, closeModal }) => {
  // quantos slots tem o grid (4x4 = 16)
  const totalSlots = 12
  // completa com null para os slots vazios
  const displayItems: Array<Item | null> = [
    ...items,
    ...Array(totalSlots - items.length).fill(null)
  ]

  if (!status) return null

  return (
    <div className={styles.modalBag}>
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* fechar */}
          <button
            className={styles.modalClose}
            onClick={() => closeModal('items')}
          >
            <Image
              src={close}
              alt="Close"
              width={30}
              height={30}
            />
          </button>

          {/* título */}
          <h2 className={styles.title}>BAG</h2>

          {/* grid de itens */}
          <div className={styles.gridContainer}>
            {displayItems.map((item, idx) => (
              <button
                key={idx}
                className={styles.gridItem}
                onClick={() => {
                  if (item) {
                    console.log(`${item.name} x${item.value}`)
                  }
                }}
              >
                {item && (
                  <>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={`/assets/items/${item.src}.png`}
                        alt={item.name}
                        layout="fill"
                        objectFit="contain"
                      />
                    </div>
                    <span className={styles.itemCount}>
                      {item.value}
                    </span>
                    {/* Tooltip com description */}
                    <div className={styles.tooltip}>
                      {item.description}
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemBag
