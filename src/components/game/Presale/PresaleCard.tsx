// components/Presale/PresaleCard.tsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import styles from './styles.module.scss'
import type { Preflight, PresalePhase, StableDef } from './presale'
import ErrorModal from '../Modals/ErrorModal'
import { useUser } from '@/contexts/UserContext'

type Props = {
    cardType: PresalePhase // 'GTD' | 'FCFS'
    stable: StableDef
    preflight: Preflight
    onBuy: (quantity: number) => void | Promise<void>
    onAfterBuy?: () => void | Promise<void>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL

const cap90 = (pct: number) => Math.min(90, Math.max(0, pct))

const MINT_TIME: Record<PresalePhase, number> = {
    GTD: 1758546000,  // 2025-09-22 13:00:00 UTC
    FCFS: 1758549600, // 2025-09-22 14:00:00 UTC
}

function formatCountdown(ms: number) {
    if (ms <= 0) return 'LIVE'
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`
}

const PresaleCard: React.FC<Props> = ({ cardType, stable, preflight, onBuy, onAfterBuy }) => {
    const [qty] = useState(1) // buying exactly 1 stable per call
    const [countdown, setCountdown] = useState<string>('')
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [buying, setBuying] = useState(false) // NEW
    const anchorRef = useRef<HTMLDivElement | null>(null)
    const bubbleRef = useRef<HTMLDivElement | null>(null)
    const [flipRight, setFlipRight] = useState(false)
    const { updateBalance } = useUser();
    const [maxTokenId, setMaxTokenId] = useState<number | null>(null)

    const { sale, discountPct: rawPct } = preflight

    const whitelistAvailable = useMemo(() => {
        return cardType === 'GTD'
            ? sale.gtd && !sale.gtdUsed
            : sale.fcfs && !sale.fcfsUsed
    }, [cardType, sale.gtd, sale.gtdUsed, sale.fcfs, sale.fcfsUsed])

    const discountPct = cap90(rawPct)
    const hasDiscount = discountPct > 0

    const discountedPrice = useMemo(
        () => Math.max(0, Math.floor(stable.price * (1 - discountPct / 100))),
        [stable.price, discountPct]
    )

    const enabled = useMemo(() => {
        if (stable.paused || stable.supplyLeft <= 0) return false
        return whitelistAvailable
    }, [stable.paused, stable.supplyLeft, whitelistAvailable])

    // countdown
    useEffect(() => {
        if (!whitelistAvailable) {
            setCountdown('')
            return
        }
        const targetMs = MINT_TIME[cardType] * 1000
        const tick = () => setCountdown(formatCountdown(targetMs - Date.now()))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [cardType, whitelistAvailable])

    // --- NEW: API call to /stable/buy
    const buyStable = async () => {
        try {
            setBuying(true)
            const res = await fetch(`${API_URL}/stable/buy`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salePhase: cardType }),
            })

            const payload = await res.json().catch(() => ({} as any))
            if (!res.ok) {
                const msg = Array.isArray(payload?.message)
                    ? payload.message.join(', ')
                    : (payload?.message || `Buy failed (${res.status})`)
                throw new Error(msg)
            }

            // Parent hook (refresh wallet, etc.)
            if (onBuy) await onBuy(1)

            // **Refresh preflight** so UI flips gtdUsed/fcfsUsed/discount immediately
            if (onAfterBuy) await onAfterBuy()

            if (updateBalance) await updateBalance()

            // Optional success notice
            setErrorMessage(
                `Success! Stable purchase queued.\nToken #${String(payload?.tokenId) ?? '?'} • Charged ${String(payload?.priceCharged) ?? '?'} WRON.`
            )
            setShowError(true)
        } catch (err: any) {
            setErrorMessage(err?.message || 'Unexpected error')
            setShowError(true)
        } finally {
            setBuying(false)
        }
    }

    // NEW: refetch supply helper
    const refetchSupply = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/stable/max-token-id`, { credentials: 'include' })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()
            setMaxTokenId(Number(data?.maxTokenId ?? 0))
        } catch (e) {
            // silent fail; keep last known value
            // console.warn('Failed to fetch max-token-id', e)
        }
    }, [])

    useEffect(() => {
        refetchSupply()
        const id = setInterval(refetchSupply, 30_000)
        return () => clearInterval(id)
    }, [refetchSupply])

    const handleBuyClick = async () => {
        const startMs = MINT_TIME[cardType] * 1000
        const now = Date.now()
        if (now < startMs) {
            setErrorMessage(`${cardType} sale hasn't started yet.\nStarts in ${countdown}.`)
            setShowError(true)
            return
        }
        await buyStable()
    }

    // Tooltip flip calc
    const checkFlip = () => {
        const ar = anchorRef.current?.getBoundingClientRect()
        const bw = bubbleRef.current?.offsetWidth ?? 240
        if (!ar) return
        const SAFE = 8
        const wouldOverflowLeft = ar.left - bw < SAFE
        setFlipRight(wouldOverflowLeft)
    }

    const onOpenTooltip = () => checkFlip()
    useEffect(() => {
        const onResize = () => {
            if (bubbleRef.current && anchorRef.current) checkFlip()
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return (
        <div
            className={styles.card}
            style={{ backgroundImage: `url('/assets/items/${stable.src}.gif')` }}
        >

            {/* NEW: Supply indicator (top-left) */}
            <div className={styles.supplyBadge} title="Minted so far">
                {typeof maxTokenId === 'number' ? `${maxTokenId}` : '…'}/400
            </div>
            {/* Top-right tooltip */}
            <div
                className={styles.tooltipAnchor}
                ref={anchorRef}
                onMouseEnter={onOpenTooltip}
                onFocus={onOpenTooltip}
                onTouchStart={onOpenTooltip}
            >
                <div className={styles.tooltipTrigger}>?</div>
                <div
                    ref={bubbleRef}
                    className={`${styles.tooltipBubble} ${flipRight ? styles.flipRight : ''}`}
                >
                    <div className={styles.tooltipLine}>
                        <span className={styles.blue}>Total Discount: {discountPct}%</span>
                    </div>
                    {sale.discountList?.length > 0 &&
                        sale.discountList.slice(0, 9).map((txt, i) => (
                            <div key={i} className={styles.tooltipLine}>{txt}</div>
                        ))
                    }
                    <div className={`${styles.tooltipLine} ${styles.red}`}>Discount Capped at 90%</div>
                    <div className={styles.tooltipLine}>
                        Whitelist available? {String(whitelistAvailable)}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className={styles.buttonRow}>
                <button
                    className={styles.buyButton}
                    disabled={!enabled || buying}          // ← lock while buying
                    onClick={handleBuyClick}
                >
                    {buying
                        ? 'PROCESSING…'
                        : (whitelistAvailable ? `BUY ${cardType} STABLE` : 'Not Whitelisted')}
                </button>

                {whitelistAvailable && countdown && (
                    <div className={styles.countdownSubtext}>
                        {countdown}
                    </div>
                )}
            </div>

            {/* Price */}
            <div className={styles.priceRow}>
                <img src="/assets/icons/wron.webp" alt="WRON" className={styles.phorseIcon} />
                {hasDiscount ? (
                    <>
                        <span className={styles.strikethrough}>{stable.price}</span>
                        <span className={styles.discounted}>{discountedPrice}</span>
                    </>
                ) : (
                    <span>{stable.price}</span>
                )}
            </div>

            {showError && (
                <ErrorModal
                    text={errorMessage}
                    onClose={() => setShowError(false)}
                />
            )}
        </div>
    )
}

export default PresaleCard
