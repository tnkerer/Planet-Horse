// components/Presale/PresaleCard.tsx
import React, { useEffect, useMemo, useState, useRef } from 'react'
import styles from './styles.module.scss'
import type { Preflight, PresalePhase, StableDef } from './presale'
import ErrorModal from '../Modals/ErrorModal'

type Props = {
    cardType: PresalePhase // 'GTD' | 'FCFS'
    stable: StableDef
    preflight: Preflight
    onBuy: (quantity: number) => void | Promise<void>
}

const cap90 = (pct: number) => Math.min(90, Math.max(0, pct))

// Unix seconds (provided by you)
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

const PresaleCard: React.FC<Props> = ({ cardType, stable, preflight, onBuy }) => {
    const [qty, setQty] = useState(1)
    const [countdown, setCountdown] = useState<string>('')
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const anchorRef = useRef<HTMLDivElement | null>(null)
    const bubbleRef = useRef<HTMLDivElement | null>(null)
    const [flipRight, setFlipRight] = useState(false)

    const { sale, discountPct: rawPct } = preflight

    // ✅ Whitelist is available only if phase is active and not used yet
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

    // Button enabled by whitelist + supply (intentionally NOT gating by time so we can show the error modal)
    const enabled = useMemo(() => {
        if (stable.paused || stable.supplyLeft <= 0) return false
        return whitelistAvailable
    }, [stable.paused, stable.supplyLeft, whitelistAvailable])

    const maxQty = useMemo(() => {
        const cap = stable.perUserCap ?? 99
        return Math.min(cap, stable.supplyLeft)
    }, [stable.perUserCap, stable.supplyLeft])

    // ⏱️ Countdown
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

    const handleBuyClick = async () => {
        const startMs = MINT_TIME[cardType] * 1000
        const now = Date.now()

        if (now < startMs) {
            const local = new Date(startMs).toLocaleString()
            const utc = new Date(startMs).toUTCString()
            setErrorMessage(
                `${cardType} sale hasn't started yet.\nStarts in ${countdown}.`
            )
            setShowError(true)
            return
        }

        // sale started — proceed
        await onBuy(qty)
    }

    // Decide if the tooltip would overflow on the left; if so, render to the right
    const checkFlip = () => {
        const ar = anchorRef.current?.getBoundingClientRect()
        const bw = bubbleRef.current?.offsetWidth ?? 240 // fall back to min-width
        if (!ar) return
        const SAFE = 8 // px
        const wouldOverflowLeft = ar.left - bw < SAFE
        setFlipRight(wouldOverflowLeft)
    }

    // Recompute on hover/focus (and touch)
    const onOpenTooltip = () => checkFlip()

    // optional: recompute on resize just in case
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
                        sale.discountList.slice(0, 4).map((txt, i) => (
                            <div key={i} className={styles.tooltipLine}> {txt}</div>
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
                    disabled={!enabled}
                    onClick={handleBuyClick}
                >
                    {whitelistAvailable ? `BUY ${cardType} STABLE` : 'Not Whitelisted'}
                </button>

                {/* Small subtext with countdown when available */}
                {whitelistAvailable && countdown && (
                    <div className={styles.countdownSubtext}>
                        Starts in {countdown}
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
