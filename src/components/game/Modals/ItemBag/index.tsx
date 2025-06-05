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
  onEquipItem?: (item: Item) => void

}

const ItemBag: React.FC<Props> = ({ status, closeModal, onEquipItem }) => {
  const totalSlots = 12
  const displayItems: Array<Item | null> = [
    ...items,
    ...Array(totalSlots - items.length).fill(null)
  ]

  if (!status) return null

  return (
    <div className={styles.modalBag}>
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
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

          <h2 className={styles.title}>BAG</h2>

          <div className={styles.gridContainer}>
            {displayItems.map((item, idx) => (
              <button
                key={idx}
                className={styles.gridItem}
                onClick={() => {
                  if (item && onEquipItem) {
                    onEquipItem(item)
                    closeModal('items')
                  }
                }}
              >
                {item && (
                  <>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={`/assets/items/${item.src}.webp`}
                        alt={item.name}
                        layout="fill"
                        objectFit="contain"
                      />
                    </div>
                    <span className={styles.itemCount}>
                      {item.value}
                    </span>
                    <div className={styles.tooltip}>
                      {item.description
                        .split(' ')
                        .reduce<Array<(string | JSX.Element)>>((acc, word, i) => {
                          if (i > 0 && i % 8 === 0) {
                            acc.push(<br key={`br-${i}`} />)
                          }
                          acc.push(`${word} `)
                          return acc
                        }, [])}
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
