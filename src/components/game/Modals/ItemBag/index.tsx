// src/components/game/Modals/ItemBag/index.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import closeIcon from '@/assets/game/pop-up/fechar.png'
import { items as itemsConst } from '@/utils/constants/items'
import { Horse } from '@/domain/models/Horse'
import ErrorModal from '../ErrorModal'

interface LocalItemDef {
  name:        string
  src:         string
  description: string
  breakable:   boolean
  consumable:  boolean
  uses:        number
  property?:   Record<string, number>
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
  consumable:  boolean
}

interface Props {
  status:          boolean
  closeModal:      (modalType: string) => void
  horse?:          Horse
  reloadHorses?:    () => Promise<void>
}

const ItemBag: React.FC<Props> = ({ status, closeModal, horse, reloadHorses }) => {
  const [serverItems, setServerItems] = useState<ServerItem[]>([])
  const [loading, setLoading]         = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // index of the item whose dropdown is currently open
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null)

  // total grid slots
  const totalSlots = 12

  // fetch from API
  const fetchItems = useCallback(() => {
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
      .catch(err => {
        console.error(err)
        setErrorMessage(err.message || 'Failed to load items')
      })
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // close dropdown if clicked outside
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setActiveDropdownIndex(null)
      }
    }
    if (activeDropdownIndex !== null) {
      document.addEventListener('mousedown', onClickOutside)
      return () => document.removeEventListener('mousedown', onClickOutside)
    }
  }, [activeDropdownIndex])

  // build displayItems from serverItems
  const displayItems: Array<DisplayItem | null> = React.useMemo(() => {
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
          consumable:  false,
        }
      }
      return {
        id:          idx,
        name:        def.name,
        src:         def.src,
        value:       String(srv.quantity),
        description: def.description,
        consumable:  Boolean(def.consumable),
      }
    })

    // fill up to totalSlots
    return mapped.concat(
      Array(Math.max(0, totalSlots - mapped.length)).fill(null)
    )
  }, [serverItems])

  if (!status) return null

  // “Use” handler
  const handleUse = async (itemName: string) => {
    if (!horse) return
    setErrorMessage(null)
    try {
      const res = await fetch(
        `${process.env.API_URL}/horses/${horse.id}/consume`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemName }),
        }
      )
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const errJson = await res.json()
          if (errJson?.message) msg = errJson.message
        } catch {}
        throw new Error(msg)
      }
      // on success: refresh horses & items
      await reloadHorses()
      fetchItems()
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Failed to use item')
    } finally {
      setActiveDropdownIndex(null)
    }
  }

  // “Equip” handler (stub for now)
  const handleEquip = (itemName: string, slot: number) => {
    console.log(`Equipped ${itemName} in slot ${slot}`)
    setActiveDropdownIndex(null)
  }

  return (
    <div className={styles.modalBag} ref={containerRef}>
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* close */}
          <button
            className={styles.modalClose}
            onClick={() => {
              closeModal('items')
              setActiveDropdownIndex(null)
            }}
          >
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          {/* title */}
          <h2 className={styles.title}>BAG</h2>

          {/* loading */}
          {loading && <p>Loading items…</p>}

          {errorMessage && (
            <ErrorModal
              text={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          )}

          {/* grid of items */}
          <div className={styles.gridContainer}>
            {displayItems.map((item, idx) => (
              <div key={idx} className={styles.gridItemWrapper}>
                <button
                  className={styles.gridItem}
                  onClick={() => {
                    if (!item) return
                    setActiveDropdownIndex((prev) =>
                      prev === idx ? null : idx
                    )
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

                {/* dropdown menu */}
                {horse && item && activeDropdownIndex === idx && (
                  <div className={styles.dropdown}>
                    {item.consumable ? (
                      <div
                        className={styles.dropdownOption}
                        onClick={async () => handleUse(item.name)}
                      >
                        Use
                      </div>
                    ) : (
                      <>
                        <div
                          className={styles.dropdownOption}
                          onClick={() => handleEquip(item.name, 1)}
                        >
                          Equip 1
                        </div>
                        <div
                          className={styles.dropdownOption}
                          onClick={() => handleEquip(item.name, 2)}
                        >
                          Equip 2
                        </div>
                        <div
                          className={styles.dropdownOption}
                          onClick={() => handleEquip(item.name, 3)}
                        >
                          Equip 3
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemBag
