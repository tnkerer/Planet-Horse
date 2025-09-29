import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import styles from '../BreedingModal/styles.module.scss'; // reuse same art & layout
import closeIcon from '@/assets/game/pop-up/fechar.png';
import Tooltip from '../../Tooltip';
import type { Horse } from '@/components/game/Stables/types/horse';
import ErrorModal from '../ErrorModal';
import InfoModal from '../InfoModal';

type Props = {
    status: boolean;
    stableTokenId: string;           // e.g. "1"
    horses: Horse[];                 // full list
    onClose: () => void;
    reloadHorses: () => Promise<void>;
};

const API = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';

const labelColorMap: Record<string, string> = {
    common: '#00aa00', uncommon: '#2F35A8', rare: '#800080',
    epic: '#ff69b4', legendary: '#a78e06', mythic: '#E21C21',
};
const sexColorMap: Record<string, string> = { male: '#2F35A8', female: '#dc207e' };

const PER_PAGE = 16;

async function postJSON(path: string, body?: any) {
    const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
    return data;
}

const StableHorsesModal: React.FC<Props> = ({ status, stableTokenId, horses, onClose, reloadHorses }) => {
    const [page, setPage] = useState(0);
    const [activeDropdownIdx, setActiveDropdownIdx] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; horse: Horse } | null>(null);
    const [errorText, setErrorText] = useState<string | null>(null);
    const [infoText, setInfoText] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    // UUID -> tokenId map (filled via /stable/uuid/:uuid)
    const [uuidToTokenId, setUuidToTokenId] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!status) return;
        setPage(0);
        setActiveDropdownIdx(null);
        setTooltip(null);
    }, [status]);

    // When the modal opens or horses change, fetch tokenIds for any *unknown* stable UUIDs
    useEffect(() => {
        if (!status) return;

        // collect unique UUIDs present on horses
        const uuids = new Set<string>();
        for (const h of horses) {
            const uuid = (h as any)?.staty?.stable as (string | null | undefined);
            if (uuid && !uuidToTokenId[uuid]) uuids.add(uuid);
        }
        if (uuids.size === 0) return;

        let cancelled = false;
        (async () => {
            const entries = await Promise.all(
                Array.from(uuids).map(async (u) => {
                    try {
                        const res = await fetch(`${API}/stable/uuid/${u}`, { credentials: 'include' });
                        if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
                        const data = await res.json();
                        // expects { tokenId: "1", ... }
                        return [u, String(data.tokenId)] as const;
                    } catch {
                        return [u, ''] as const; // mark as missing (not stored)
                    }
                })
            );
            if (cancelled) return;
            setUuidToTokenId((prev) => {
                const next = { ...prev };
                for (const [u, token] of entries) {
                    if (token) next[u] = token;
                }
                return next;
            });
        })();

        console.log(horses)
        console.log(horseStableMap)

        return () => { cancelled = true; };
    }, [status, horses, uuidToTokenId]);

    // Build a map of horseId -> stableTokenId (NOT uuid)
    const horseStableMap = useMemo(() => {
        const map = new Map<number, string | null>();
        for (const h of horses) {
            const uuid = (h as any)?.staty?.stable ?? null;
            if (uuid == null || uuid === '') {
                map.set(h.id, null);
            } else {
                const token = uuidToTokenId[uuid];
                map.set(h.id, token != null ? String(token) : null);
            }
        }
        return map;
    }, [horses, uuidToTokenId]);

    // Is this horse housed in the *current* stable? (compare tokenIds)
    function isHousedInCurrentStable(horseId: number): boolean {
        const token = horseStableMap.get(horseId);
        if (token == null) return false; // null or undefined => not housed / unknown yet
        return String(token) === String(stableTokenId);
    }

    // List horses either not housed or housed in THIS stable (exclude other stables)
    const filteredHorses = useMemo(() => {
        return horses.filter(h => {
            const token = horseStableMap.get(h.id);
            // show if: not housed (null) OR housed in current (equals tokenId)
            return token === null || String(token) === String(stableTokenId);
        });
    }, [horses, horseStableMap, stableTokenId]);

    // Split for ordering: housed first, then available
    const housed = useMemo(() => filteredHorses.filter(h => isHousedInCurrentStable(h.id)), [filteredHorses, stableTokenId]);
    const notHoused = useMemo(() => filteredHorses.filter(h => !isHousedInCurrentStable(h.id)), [filteredHorses, stableTokenId]);

    // Single merged list (housed first)
    type Row = { kind: 'horse'; horse: Horse };
    const rows: Row[] = useMemo(() => {
        const list: Row[] = [];
        housed.forEach(h => list.push({ kind: 'horse', horse: h }));
        notHoused.forEach(h => list.push({ kind: 'horse', horse: h }));
        return list;
    }, [housed, notHoused]);

    // Pad to page size
    const padded: Row[] = useMemo(() => {
        const rem = rows.length % PER_PAGE;
        return rem ? rows.concat(Array(PER_PAGE - rem).fill(null) as any) : rows;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.length]); // reduce churn

    const pageCount = Math.max(1, Math.ceil(padded.length / PER_PAGE));

    // Close dropdown on outside click
    useEffect(() => {
        if (activeDropdownIdx == null) return;
        const onDocClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setActiveDropdownIdx(null);
        };
        document.addEventListener('click', onDocClick, true);
        return () => document.removeEventListener('click', onDocClick, true);
    }, [activeDropdownIdx]);

    async function onAssign(h: Horse) {
        try {
            await postJSON(`${API}/stable/${stableTokenId}/assign`, { horseId: h.id });
            setActiveDropdownIdx(null);
            setInfoText(`Horse #${h.id} assigned to Stable #${stableTokenId}.`);
            await reloadHorses();
        } catch (e: any) {
            setErrorText(e?.message || 'Failed to assign');
        }
    }

    async function onRemove(h: Horse) {
        try {
            await postJSON(`${API}/stable/${stableTokenId}/remove`, { horseId: h.id });
            setActiveDropdownIdx(null);
            setInfoText(`Horse #${h.id} removed from Stable #${stableTokenId}.`);
            await reloadHorses();
        } catch (e: any) {
            setErrorText(e?.message || 'Failed to remove');
        }
    }

    if (!status) return null;

    return (
        <div className={styles.modalWrapper}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent} ref={rootRef}>
                    <button className={styles.modalClose} onClick={onClose}>
                        <Image src={closeIcon} alt="Close" width={30} height={30} />
                    </button>

                    <h2 className={styles.title}>STABLE #{stableTokenId}</h2>

                    {pageCount > 1 && (
                        <>
                            <button className={`${styles.arrow} ${styles.prev}`} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
                            <button className={`${styles.arrow} ${styles.next}`} onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1}>›</button>
                        </>
                    )}

                    <div className={styles.carouselViewport}>
                        <div className={styles.carouselTrack} style={{ transform: `translateX(-${page * 100}%)` }}>
                            {Array.from({ length: pageCount }).map((_, pageIdx) => {
                                const start = pageIdx * PER_PAGE;
                                const slice = padded.slice(start, start + PER_PAGE);
                                return (
                                    <div key={pageIdx} className={styles.page}>
                                        <div className={styles.gridContainer}>
                                            {slice.map((row, idx) => {
                                                if (!row) {
                                                    return (
                                                        <div key={idx} className={styles.gridItemWrapper}>
                                                            <div className={styles.gridItemEmpty} />
                                                        </div>
                                                    );
                                                }
                                                const h = row.horse;
                                                const absoluteIdx = pageIdx * PER_PAGE + idx;
                                                const housedHere = isHousedInCurrentStable(h.id);

                                                return (
                                                    <div key={h.id} className={styles.gridItemWrapper}>
                                                        <button
                                                            className={styles.gridItem}
                                                            style={housedHere ? { outline: '3px solid #00ff00', outlineOffset: '-1px', borderRadius: '6px' } : undefined}
                                                            onClick={() => setActiveDropdownIdx(prev => prev === absoluteIdx ? null : absoluteIdx)}
                                                            onMouseEnter={(e) => {
                                                                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                setTooltip({ x: r.left + r.width / 1.2, y: r.top - 8, horse: h });
                                                            }}
                                                            onMouseLeave={() => setTooltip(null)}
                                                        >
                                                            <div className={styles.imageWrapper}>
                                                                <img
                                                                    src={`/assets/game/breeding/stable-horses/right/${h.profile.type_horse_slug}/${h.profile.name_slug}-regular.gif`}
                                                                    alt={h.profile.name}
                                                                />
                                                            </div>
                                                            <span className={styles.horseId}>#{h.id}</span>
                                                        </button>

                                                        {activeDropdownIdx === absoluteIdx && (
                                                            <div className={styles.dropdown}>
                                                                {!housedHere ? (
                                                                    <div
                                                                        className={styles.dropdownOption}
                                                                        onClick={(e) => { e.stopPropagation(); void onAssign(h); }}
                                                                    >
                                                                        Assign to Stable #{stableTokenId}
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className={styles.dropdownOption}
                                                                        onClick={(e) => { e.stopPropagation(); void onRemove(h); }}
                                                                    >
                                                                        Remove from Stable #{stableTokenId}
                                                                    </div>
                                                                )}
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

                    {pageCount > 1 && (
                        <div className={styles.dotsContainer}>
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`${styles.dot} ${i === page ? styles.activeDot : ''}`}
                                    onClick={() => setPage(i)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Character + dialog */}
                <div className={styles.dialogWrapper}>
                    <img src="/assets/characters/horse_handler.png" alt="Stable Handler" className={styles.character} />
                    <div className={styles.rpgDialogBox}>
                        <div className={styles.dialogText}>
                            {`Pick which horses should live in Stable #${stableTokenId}.\n\nAssign up to your stable capacity. Removing a horse requires a 24h cooldown since last assignment.`}
                            <span className={styles.cursor}>|</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip (uses mapped tokenId for STABLE) */}
            {tooltip && (
                <Tooltip x={tooltip.x} y={tooltip.y} visible>
                    <div className={styles.tooltipPortal}>
                        <div className={styles.tooltipSection}>
                            <div className={styles.row}>
                                <span className={styles.label}>NAME:</span>
                                <span className={styles.value}>
                                    {(tooltip.horse.profile.nickname?.trim() || tooltip.horse.profile.name).slice(0, 16)}
                                </span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>SEX:</span>
                                <span className={styles.value} style={{ color: sexColorMap[tooltip.horse.profile.sex.toLowerCase()] ?? '#000' }}>
                                    {tooltip.horse.profile.sex}
                                </span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>RARITY:</span>
                                <span className={styles.value} style={{ color: labelColorMap[tooltip.horse.profile.type_horse_slug] ?? '#000' }}>
                                    {tooltip.horse.profile.type_horse}
                                </span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>LEVEL:</span>
                                <span className={styles.value}>{tooltip.horse.staty.level}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>STATUS:</span>
                                <span className={styles.value}>{tooltip.horse.staty.status}</span>
                            </div>
                            <div className={styles.row}>
                                <span className={styles.label}>STABLE:</span>
                                <span className={styles.value}>
                                    {(() => {
                                        const uuid = (tooltip.horse as any)?.staty?.stable as (string | null | undefined);
                                        return uuid ? (uuidToTokenId[uuid] ?? '…') : '-';
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </Tooltip>
            )}

            {errorText && <ErrorModal text={errorText} onClose={() => setErrorText(null)} />}
            {infoText && <InfoModal text={infoText} onClose={() => setInfoText(null)} />}
        </div>
    );
};

export default StableHorsesModal;
