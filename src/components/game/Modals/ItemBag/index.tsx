// src/components/Modals/ItemBag.tsx
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import closeIcon from '@/assets/game/pop-up/fechar.png'
import { items as itemsConst } from '@/utils/constants/items'

interface LocalItemDef {
  name:        string
  src:         string
  description: string
  breakable:   boolean
  uses:        number
}

interface ServerItem {
  name:     string
  quantity: number
}

interface DisplayItem {
  id:          number
  name:        string
  src:         string
  value:       string
  description: string
}

interface Props {
  status:     boolean
  closeModal: (modalType: string) => void
}

const ItemBag: React.FC<Props> = ({ status, closeModal }) => {
  const [serverItems, setServerItems] = useState<ServerItem[]>([])
  const [loading, setLoading]         = useState(false)

  // total grid slots
  const totalSlots = 12

  // fetch when modal opens
  useEffect(() => {
    if (!status) return

    setLoading(true)
    fetch(`${process.env.API_URL}/user/items`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<ServerItem[]>
      })
      .then(data => setServerItems(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status])

  // build the displayItems array
  const displayItems: Array<DisplayItem | null> = React.useMemo(() => {
    // map server → display items
    const mapped: DisplayItem[] = serverItems.map((srv, idx) => {
      const def = itemsConst[srv.name] as LocalItemDef | undefined
      if (!def) {
        console.warn(`No local definition for item "${srv.name}"`)
        return {
          id:          idx,
          name:        srv.name,
          src:         '',
          value:       String(srv.quantity),
          description: '',
        }
      }
      return {
        id:          idx,
        name:        def.name,
        src:         def.src,
        value:       String(srv.quantity),
        description: def.description,
      }
    })

    // fill out to `totalSlots` with null
    const slots = mapped.concat(
      Array(Math.max(0, totalSlots - mapped.length)).fill(null)
    )
    return slots
  }, [serverItems])

  if (!status) return null

  return (
    <div className={styles.modalBag}>
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* close */}
          <button
            className={styles.modalClose}
            onClick={() => closeModal('items')}
          >
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          {/* title */}
          <h2 className={styles.title}>BAG</h2>

          {/* loading state */}
          {loading && <p>Loading items…</p>}

          {/* grid of items */}
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
                        .reduce<Array<string | JSX.Element>>((acc, word, i) => {
                          if (i > 0 && i % 8 === 0) {
                            acc.push(<br key={`br-${i}`} />)
                          }
                          acc.push(word + ' ')
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
