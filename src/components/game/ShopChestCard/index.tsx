import React, { useEffect, useState, useRef, useCallback } from 'react'
import styles from './styles.module.scss'
import shopData from '@/utils/mocks/game/mock_shop.json'
import ErrorModal from '../Modals/ErrorModal'
import { chests, items as itemDefs, chestsPercentage } from '@/utils/constants/items'
import { useUser } from '@/contexts/UserContext'
import { useWallet } from '@/contexts/WalletContext'
import MultipleOpenConfirmModal from '../Modals/MultipleOpenConfirmModal.tsx'
import MultipleConfirmModal from '../Modals/MultipleConfirmModal'

interface ShopItem {
  id: number
  name: string
  'src-idle': string
  'src-drop'?: string
  'src-open'?: string
  'src-opened'?: string
  quantity: string
  paused?: boolean
}

type ChestRecord = { chestType: number; quantity: number }

type OracleResp = {
  symbol: 'PHORSE'
  usdPriceFormatted: string
  updatedAt: string
  source: 'moralis'
  cached: boolean
}

const DROP_DURATION = 2000
const OPEN_DURATION = 2500
const GROW_DURATION = 750
const ORACLE_REFRESH_MS = 30_000

// NEW helpers (put near other helpers in the file)
const buildMarginalDrops = (chestId: number): Array<{ rate: number; label: string }> => {
  const table = (chestsPercentage as any)?.[chestId];
  if (!table) return [];
  const entries = Object.entries(table)
    .map(([k, v]) => [Number(k), String(v)] as [number, string])
    .sort((a, b) => a[0] - b[0]);

  let prev = 0;
  const out: Array<{ rate: number; label: string }> = [];
  for (const [cum, label] of entries) {
    const diff = Math.max(0, cum - prev);
    // keep one decimal max (e.g., 12.5); avoid -0 and floating noise
    const rate = Number((Math.round(diff * 10) / 10).toFixed(1));
    out.push({ rate, label });
    prev = cum;
  }
  return out;
};

const fmtPercent = (n: number) => {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? `${s.slice(0, -2)}%` : `${s}%`;
};

type CSSModule = Record<string, string>;

const rateClassName = (n: number, s: CSSModule) =>
  n < 1 ? s.ratePurple : n < 10 ? s.rateBlue : s.rateGreen;


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
  const [referredById, setReferredById] = useState<string | null>(null)

  // Oracle state
  const [phorseUsd, setPhorseUsd] = useState<number | null>(null)
  const [oracleCached, setOracleCached] = useState<boolean>(false)
  const [oracleError, setOracleError] = useState<string | null>(null)

  const growRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const oracleTimerRef = useRef<number | null>(null)

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

      await fetch(`${process.env.API_URL}/user/profile`, { credentials: 'include' })
        .then(async (res) => res.json())
        .then((data) => setReferredById(data.referredById))
        .catch(() => setReferredById(null))
    } catch (err) {
      console.error('Failed to fetch chest quantities:', err)
    }
  }, [isAuthorized, address])

  // --- ORACLE FETCH ---
  const parseUsd = (s: string | number | null | undefined): number | null => {
    if (s == null) return null
    const n = Number(String(s).replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const fetchOracle = useCallback(async () => {
    try {
      setOracleError(null)
      const res = await fetch(`${process.env.API_URL}/user/oracle/phorse`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`Oracle HTTP ${res.status}`)
      const data: OracleResp = await res.json()
      const n = parseUsd(data.usdPriceFormatted)
      if (!n) throw new Error('Oracle payload invalid')
      setPhorseUsd(n)
      setOracleCached(Boolean(data.cached))
    } catch (e: any) {
      console.error('Oracle fetch failed:', e)
      setOracleError(e?.message || 'Oracle unavailable')
      // keep previous phorseUsd if we had one; otherwise null
    }
  }, [])

  useEffect(() => {
    setItems(shopData as unknown as ShopItem[])
    fetchChestQuantities()
    fetchOracle()
    // refresh oracle on interval
    oracleTimerRef.current = window.setInterval(() => {
      void fetchOracle();
    }, ORACLE_REFRESH_MS)
    return () => {
      if (oracleTimerRef.current) window.clearInterval(oracleTimerRef.current)
    }
  }, [fetchChestQuantities, fetchOracle])

  // Helpers to compute PHORSE price (ceil)
  const getUsdPrice = (id: number): number | null => {
    const def = chests[id]
    if (!def) return null
    const usd = referredById ? def.discountedPrice : def.price
    return Number.isFinite(usd) && usd > 0 ? Number(usd) : null
  }

  const getUsdPricePair = (id: number): { baseUsd: number | null; discUsd: number | null } => {
    const def = chests[id]
    if (!def) return { baseUsd: null, discUsd: null }
    return {
      baseUsd: Number.isFinite(def.price) ? Number(def.price) : null,
      discUsd: Number.isFinite(def.discountedPrice) ? Number(def.discountedPrice) : null,
    }
  }

  const toPhorse = (usd: number | null): number | null => {
    if (!usd || !phorseUsd || phorseUsd <= 0) return null
    return Math.ceil(usd / phorseUsd)
  }

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
    updateBalance()
  }

  return (
    <>
      {isModalOpen && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${stage === 'grow' ? styles.grow : ''}`}>
            <div onClick={handleClose} className={styles.closeButton} />
            {stage === 'drop' && <img src={`/assets/items/${shopData[selectedChestType - 1]["src-drop"]}.gif`} className={styles.gif} />}
            {stage === 'open' && <img src={`/assets/items/${shopData[selectedChestType - 1]["src-open"]}.gif`} className={styles.gif} />}
            {stage === 'opened' && <img src={`/assets/items/${shopData[selectedChestType - 1]["src-opened"]}.gif`} className={styles.gif} />}
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
                        : resultNames[0].toLowerCase().endsWith('medals')
                          ? '/assets/items/medal_bag.webp'
                          : `/assets/items/${String(itemDefs[resultNames[0]]?.src || resultNames[0])}.webp`
                    }
                    alt={resultNames[0]}
                    className={styles.dropItem}
                  />
                  <div className={styles.itemLabel}>{resultNames[0]}</div>
                </div>
              ) : (
                <div className={styles.resultContainer} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.resultCloseBtn} onClick={handleResultClose}>
                    <img src="/assets/game/pop-up/fechar.png" alt="Close" />
                  </button>
                  <div className={styles.resultGrid} onClick={(e) => e.stopPropagation()}>
                    {resultNames.map((name, i) => {
                      let src: string
                      const lower = name.toLowerCase()

                      if (lower.endsWith('phorse')) {
                        src = '/assets/items/phorse.webp'
                      } else if (lower.endsWith('medals')) {
                        src = '/assets/items/medal_bag.webp'
                      } else {
                        src = `/assets/items/${String(itemDefs[name]?.src || name)}.webp`
                      }
                      return (
                        <div className={styles.resultItem} key={i}>
                          <img src={src} alt={name} className={styles.dropGridItem} />
                          <div className={styles.itemLabel}>{name}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.grid}>
        {items.map(item => {
          const qty = chestQuantities[Number(item.id)] ?? 0
          const paused = Boolean(item.paused)

          const { baseUsd, discUsd } = getUsdPricePair(item.id)
          const basePhorse = toPhorse(baseUsd)
          const discPhorse = toPhorse(discUsd)

          const drops = buildMarginalDrops(Number(item.id))

          // Which value to show as effective price
          const effectivePhorse = referredById ? discPhorse : basePhorse

          return (
            <div
              key={item.id}
              className={styles.card}
              style={{ backgroundImage: `url('/assets/items/${item['src-idle']}.gif')` }}
              title={oracleError ? `Price may be outdated: ${oracleError}` : (oracleCached ? 'Using cached oracle' : 'Oracle fresh')}
            >
              <div className={styles.itemBadge}>{qty}</div>
              <div className={styles.dropTooltipWrapper}>
                <button
                  className={styles.infoBtn}
                  aria-label="Drop chances"
                  title="Drop chances"
                  tabIndex={0}
                >
                  i
                </button>
                <div className={styles.dropTooltip} role="dialog" aria-label="Drop chances list">
                  <div className={styles.tooltipHeader}>Drop Chances</div>
                  <ul className={styles.tooltipList}>
                    {drops.length === 0 ? (
                      <li className={styles.tooltipItem}>No data</li>
                    ) : (
                      drops.map((d, idx) => (
                        <li
                          key={idx}
                          className={`${styles.tooltipItem} ${rateClassName(d.rate, styles as CSSModule)}`}
                        >
                          {fmtPercent(d.rate)} {d.label}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
              <div className={styles.buttonRow}>
                <button
                  className={`${styles.buyButton} ${paused || buying ? styles.disabled : ''}`}
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

                <div className={styles.chestPrice}>
                  <img src="/assets/items/phorse.webp" alt="PHORSE" className={styles.phorseIcon} />
                  {referredById ? (
                    <>
                      <span className={styles.strikethrough}>
                        {basePhorse ?? '—'}
                      </span>
                      <span className={styles.discounted}>
                        {discPhorse ?? '—'}
                      </span>
                    </>
                  ) : (
                    <span>{effectivePhorse ?? '—'}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showOpenMultipleConfirm && selectedChestType != null && (
        <MultipleOpenConfirmModal
          quantity={quantityToOpen}
          max={chestQuantities[selectedChestType] ?? 1}
          // pass PHORSE/unit (ceil) for the selected chest
          price={toPhorse(getUsdPrice(selectedChestType)) ?? 0}
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
          max={12}
          // pass PHORSE/unit (ceil) for the selected chest
          price={toPhorse(getUsdPrice(selectedChestType)) ?? 0}
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
