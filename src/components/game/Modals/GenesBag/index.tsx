import React, { useCallback, useEffect, useMemo, useRef, useState, TouchEvent } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import { items as itemsConst } from '@/utils/constants/items';
import ErrorModal from '../ErrorModal';
import InfoModal from '../InfoModal';
import { createPortal } from 'react-dom';
import { useBreeding } from '@/contexts/BreedingContext';

type ServerItem = {
    name: string;
    quantity: number;
    usesLeft: number;
};

type DisplayItem = {
    id: number;
    name: string;
    src: string;
    quantity: number;
    description: string;
    usesLeft: number;
    breakable: boolean;
    consumable: boolean;
};

interface Props {
    status: boolean;
    onClose: () => void;
    /** 0 or 1, which stud gene slot the user clicked */
    targetSlot: number | null;
    studId: 0 | 1;
}

const ALLOWED_CHAIN_IDS = new Set([17000, 17001, 17002]);
const SLOTS_PER_PAGE = 12;

const GenesBag: React.FC<Props> = ({ status, onClose, targetSlot, studId }) => {
    const [serverItems, setServerItems] = useState<ServerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const { setGene, studs } = useBreeding();

    // swipe helpers (keep UX consistent with your bag)
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const thisStud = studs[studId];
    const otherOfTarget = useMemo<0 | 1 | null>(
        () => (targetSlot == null ? null : (targetSlot === 0 ? 1 : 0)),
        [targetSlot]
    );

    // tooltip (same lightweight style you already use)
    const [tooltip, setTooltip] = useState<{
        x: number; y: number; name: string; content: string; usesLeft: number; breakable: boolean;
    } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!status) return;
        function onClickOutside(e: MouseEvent) {
            if (!containerRef.current?.contains(e.target as Node)) {
                setActiveDropdownIndex(null);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [status]);

    const fetchItems = useCallback(async () => {
        if (!status) return;
        setLoading(true);
        setErrorMessage(null);
        try {
            const res = await fetch(`${process.env.API_URL}/user/items`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as ServerItem[];
            setServerItems(data);
            setCurrentPage(0);
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e?.message || 'Failed to load items');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const assignedCounts = useMemo(() => {
        // chainId -> count used across both studs
        const counts: Record<number, number> = { 17000: 0, 17001: 0, 17002: 0 };
        studs.forEach(s => {
            const g = s.geneIds ?? [null, null];
            g.forEach(id => {
                if (id && counts[id] !== undefined) counts[id] += 1;
            });
        });
        return counts;
    }, [studs]);

    // Build the final list: only Genes by chainId (17000/17001/17002)
    const displayItems: Array<DisplayItem | null> = useMemo(() => {
        // 1) counts from server
        const groupedByChain: Record<number, {
            defName: string; src: string; description: string;
            breakable: boolean; consumable: boolean; total: number; usesLeft: number;
        }> = {};

        for (const srv of serverItems) {
            const def = itemsConst[srv.name];
            const chainId = def?.chainId as number | undefined;
            if (!def || chainId === undefined || !ALLOWED_CHAIN_IDS.has(chainId)) continue;
            if (!groupedByChain[chainId]) {
                groupedByChain[chainId] = {
                    defName: def.name,
                    src: def.src,
                    description: def.description,
                    breakable: def.breakable,
                    consumable: Boolean(def.consumable),
                    total: 0,
                    usesLeft: srv.usesLeft,
                };
            }
            groupedByChain[chainId].total += srv.quantity;
        }

        // 2) subtract global assigned across both studs
        const globallyAssigned: Record<number, number> = { 17000: 0, 17001: 0, 17002: 0 };
        studs.forEach(s => (s.geneIds ?? [null, null]).forEach(g => { if (g) globallyAssigned[g]++; }));

        // 3) if the other slot in *this* stud already holds a gene, hide that same gene
        const forbiddenSameGene = (otherOfTarget != null) ? (thisStud.geneIds?.[otherOfTarget] ?? null) : null;

        const rows: DisplayItem[] = [];
        let idx = 0;
        for (const chainId of [17000, 17001, 17002]) {
            const row = groupedByChain[chainId];
            if (!row) continue;

            // hide same gene if other slot has it (no duplicates per stud)
            if (forbiddenSameGene === chainId) continue;

            const remaining = Math.max(0, row.total - (globallyAssigned[chainId] ?? 0));
            if (remaining <= 0) continue;

            rows.push({
                id: idx++,
                name: row.defName,
                src: row.src,
                quantity: remaining,
                description: row.description,
                usesLeft: row.usesLeft,
                breakable: row.breakable,
                consumable: row.consumable,
            });
        }

        const remainder = rows.length % SLOTS_PER_PAGE;
        const padCount = remainder === 0 ? 0 : SLOTS_PER_PAGE - remainder;
        return rows.concat(Array(padCount).fill(null));
    }, [serverItems, studs, thisStud.geneIds, otherOfTarget]);


    if (!status) return null;

    const pageCount = Math.ceil(displayItems.length / SLOTS_PER_PAGE);

    const onTouchStart = (e: TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = null;
    };
    const onTouchMove = (e: TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };
    const onTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentPage < pageCount - 1) setCurrentPage((p) => p + 1);
            else if (diff < 0 && currentPage > 0) setCurrentPage((p) => p - 1);
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const handleUse = (itemName: string) => {
        const def = itemsConst[itemName];
        const chainId = def?.chainId as 17000 | 17001 | 17002 | undefined;

        if (!def || !chainId || !ALLOWED_CHAIN_IDS.has(chainId)) {
            console.warn('Invalid gene item selected', itemName);
            return;
        }
        if (targetSlot == null) {
            console.warn('No target slot set for gene use');
            return;
        }

        // write into context
        setGene(studId, targetSlot as 0 | 1, chainId);

        const slotLabel = Number(targetSlot) + 1;
        console.log(`Genes ${itemName} (id ${chainId}) selected for gene slot #${slotLabel} on stud ${studId}`);

        // optional toast/info
        setInfoMessage(`Selected ${itemName} for slot #${slotLabel}`);
        setActiveDropdownIndex(null);

        // close modal after pick
        onClose();
    };

    const modal = (
        <div className={styles.modalBag} ref={containerRef}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent}>
                    {/* Close */}
                    <button
                        className={styles.modalClose}
                        onClick={() => {
                            onClose();
                            setActiveDropdownIndex(null);
                        }}
                    >
                        <Image src={closeIcon} alt="Close" width={30} height={30} />
                    </button>

                    {/* Title */}
                    <h2 className={styles.title}>GENES</h2>

                    {/* Loading */}
                    {loading && (
                        <div className={styles.loadingWrapper}>
                            <p className={styles.loadingText}>Loading genes…</p>
                        </div>
                    )}

                    {/* Error/Info */}
                    {errorMessage && <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />}
                    {infoMessage && <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />}

                    {/* Arrows (keep if many items) */}
                    {pageCount > 1 && (
                        <>
                            <button
                                className={`${styles.arrow} ${styles.prev}`}
                                onClick={() => currentPage > 0 && setCurrentPage((p) => p - 1)}
                                disabled={currentPage === 0}
                                aria-label="Previous page"
                            >
                                ‹
                            </button>
                            <button
                                className={`${styles.arrow} ${styles.next}`}
                                onClick={() => currentPage < pageCount - 1 && setCurrentPage((p) => p + 1)}
                                disabled={currentPage === pageCount - 1}
                                aria-label="Next page"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Grid */}
                    <div
                        className={styles.carouselViewport}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className={styles.carouselTrack}
                            style={{ transform: `translateX(-${currentPage * 100}%)` }}
                        >
                            {Array.from({ length: pageCount }).map((_, pageIdx) => {
                                const start = pageIdx * SLOTS_PER_PAGE;
                                const slice = displayItems.slice(start, start + SLOTS_PER_PAGE);
                                return (
                                    <div key={pageIdx} className={styles.page}>
                                        <div className={styles.gridContainer}>
                                            {slice.map((item, idx) => {
                                                if (!item) {
                                                    return (
                                                        <div key={idx} className={styles.gridItemWrapper}>
                                                            <div className={styles.gridItemEmpty} />
                                                        </div>
                                                    );
                                                }
                                                const absIdx = pageIdx * SLOTS_PER_PAGE + idx;
                                                return (
                                                    <div key={idx} className={styles.gridItemWrapper}>
                                                        <button
                                                            className={styles.gridItem}
                                                            onClick={() =>
                                                                setActiveDropdownIndex((prev) => (prev === absIdx ? null : absIdx))
                                                            }
                                                            onMouseEnter={(e) => {
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                setTooltip({
                                                                    x: rect.left + rect.width / 1.1,
                                                                    y: rect.top - 8,
                                                                    name: item.name,
                                                                    content: item.description,
                                                                    usesLeft: item.usesLeft,
                                                                    breakable: item.breakable,
                                                                });
                                                            }}
                                                            onMouseLeave={() => setTooltip(null)}
                                                        >
                                                            <div className={styles.imageWrapper}>
                                                                <img
                                                                    src={`/assets/items/${item.src}.webp`}
                                                                    alt={item.name}
                                                                    onError={(e) => {
                                                                        e.currentTarget.onerror = null;
                                                                        e.currentTarget.src = `/assets/items/${item.src}.gif`;
                                                                    }}
                                                                    style={{ width: '80%', height: '100%', objectFit: 'contain', alignSelf: 'center' }}
                                                                />
                                                            </div>
                                                            <span className={styles.itemCount}>{item.quantity}</span>
                                                        </button>

                                                        {activeDropdownIndex === absIdx && (
                                                            <div className={styles.dropdown}>
                                                                <div
                                                                    className={styles.dropdownOption}
                                                                    onClick={() => handleUse(item.name)}
                                                                >
                                                                    Use
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Dots */}
                    {pageCount > 1 && (
                        <div className={styles.dotsContainer}>
                            {Array.from({ length: pageCount }).map((_, idx) => (
                                <span
                                    key={idx}
                                    className={`${styles.dot} ${idx === currentPage ? styles.activeDot : ''}`}
                                    onClick={() => setCurrentPage(idx)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Floating tooltip */}
                    {tooltip && (
                        <div className="tooltipPortal" style={{
                            position: 'fixed',
                            left: tooltip.x,
                            top: tooltip.y
                        }}>
                            <div className={styles.tooltipPortal}>
                                <span className={styles.tooltipTitle}>{tooltip.name}</span>
                                {tooltip.content
                                    .split(' ')
                                    .reduce<Array<string | JSX.Element>>((acc, word, i) => {
                                        if (i > 0 && i % 8 === 0) acc.push(<br key={`br-${i}`} />);
                                        acc.push(word + ' ');
                                        return acc;
                                    }, [])}
                                <br />
                                {tooltip.breakable ? (
                                    <span className={styles.usesLeft}>({tooltip.usesLeft} uses left)</span>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof window === 'undefined') return modal; // SSR safety
    return createPortal(modal, document.body);
};

export default GenesBag;
