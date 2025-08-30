import React, { useMemo, useRef, useState, useEffect, useCallback, TouchEvent } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import Tooltip from '../../Tooltip';
import type { Horse } from '@/domain/models/Horse';
import { itemModifiers, items as itemDefs } from '@/utils/constants/items';
import { xpProgression } from '@/utils/constants/xp-progression';
import { useBreeding } from '@/contexts/BreedingContext';

interface Props {
    status: boolean;
    studId: number | string | null;
    horses: Horse[];
    onClose: () => void;
}

const rarityColorMap: Record<string, string> = {
    common: '#00aa00',
    uncommon: '#2F35A8',
    rare: '#800080',
    epic: '#ff69b4',
    legendary: '#a78e06',
    mythic: '#E21C21',
};
const sexColorMap: Record<string, string> = { male: '#2F35A8', female: '#dc207e' };
const statColor = '#1fa050';

const formatXp = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n));

const TOTAL_SLOTS_PER_PAGE = 16;

const BreedingModal: React.FC<Props> = ({ status, studId, horses, onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{
        x: number; y: number; horse: Horse;
        xpStr: string; labelColor: string; sexColor: string;
        extraPwr: number; extraSpt: number; extraSpd: number;
    } | null>(null);

    const { studs, selectedHorseIds, selectHorse } = useBreeding();
    const slot = studId != null ? (Number(studId) as 0 | 1) : null;
    const currentStud = slot != null ? studs[slot] : null;
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const fullText = 'Howdy! Let us choose which horse is going to the breeding stud.';
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        if (!status) return;
        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayedText(fullText.slice(0, i));
            if (i >= fullText.length) clearInterval(timer);
        }, 25);
        return () => clearInterval(timer);
    }, [status]);

    // Build a list excluding already-picked horses & those in active server breeds (parents):
    const excluded = useMemo(() => {
        const set = new Set<number>(selectedHorseIds);
        // Also exclude parents of active breeds (both studs)
        [0, 1].forEach((slot) => {
            const s = studs[slot as 0 | 1];
            (s.active?.parents || []).forEach(p => set.add(p));
        });
        return set;
    }, [selectedHorseIds, studs]);

    const visibleHorses = useMemo(
        () => horses.filter(h => !excluded.has(h.id)),
        [horses, excluded]
    );
    // Build a padded list so grids are complete
    const paddedHorses = useMemo(() => {
        const arr = [...visibleHorses];
        const rem = arr.length % TOTAL_SLOTS_PER_PAGE;
        const pad = rem === 0 ? 0 : TOTAL_SLOTS_PER_PAGE - rem;
        return arr.concat(Array(pad).fill(null) as any);
    }, [visibleHorses]);

    const pageCount = Math.ceil(paddedHorses.length / TOTAL_SLOTS_PER_PAGE);

    const viewportRef = useRef<HTMLDivElement>(null);
    const draggingScrollbarRef = useRef(false);

    function getScrollbarWidth(el: HTMLElement) {
        // Works with classic and “stable gutter”
        return el.offsetWidth - el.clientWidth;
    }

    function inScrollbarZone(el: HTMLElement, clientX: number) {
        const rect = el.getBoundingClientRect();
        const sw = Math.max(10, getScrollbarWidth(el)); // safety min width
        // Right-edge vertical scrollbar hit-test
        return clientX >= rect.right - sw && clientX <= rect.right;
    }

    const showTooltip = (el: HTMLElement, h: Horse) => {
        const rect = el.getBoundingClientRect();
        const labelColor = rarityColorMap[h.profile.type_horse_slug] ?? '#919191';
        const sexColor = sexColorMap[h.profile.sex.toLowerCase()] ?? '#919191';
        const { extraPwr, extraSpt, extraSpd } = calcExtras(h);
        const xpStr = buildXp(h);

        // Position above the card, centered; clamp to viewport
        let x = rect.left + rect.width / 1.1;
        let y = rect.top - 8;
        x = Math.max(12, Math.min(window.innerWidth - 12, x));
        y = Math.max(12, y);

        setTooltip({
            x, y, horse: h, xpStr, labelColor, sexColor, extraPwr, extraSpt, extraSpd,
        });
    };

    useEffect(() => {
        const vp = viewportRef.current;
        if (!vp) return;

        const onMouseMove = (e: MouseEvent) => {
            if (inScrollbarZone(vp, e.clientX) || draggingScrollbarRef.current) {
                document.body.classList.add('no-plus-cursor');
            } else {
                document.body.classList.remove('no-plus-cursor');
            }
        };

        const onMouseDown = (e: MouseEvent) => {
            if (inScrollbarZone(vp, e.clientX)) {
                draggingScrollbarRef.current = true;
                document.body.classList.add('no-plus-cursor');
            }
        };

        const onMouseUpAnywhere = () => {
            draggingScrollbarRef.current = false;
            document.body.classList.remove('no-plus-cursor');
        };

        vp.addEventListener('mousemove', onMouseMove);
        vp.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUpAnywhere);

        return () => {
            vp.removeEventListener('mousemove', onMouseMove);
            vp.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUpAnywhere);
            document.body.classList.remove('no-plus-cursor'); // safety
        };
    }, []);


    useEffect(() => {
        if (!status) return;
        setCurrentPage(0);
        setActiveDropdownIndex(null);
        setTooltip(null);
    }, [status]);

    // Close dropdown if clicked outside
    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            const root = containerRef.current;
            if (!root) return; // nothing to compare against yet
            // If the click is INSIDE the modal, do nothing
            if (root.contains(e.target as Node)) return;
            // Otherwise, close any open dropdown
            setActiveDropdownIndex(null);
        }
        if (activeDropdownIndex !== null) {
            document.addEventListener('click', onClickOutside);
            return () => document.removeEventListener('click', onClickOutside);
        }
    }, [activeDropdownIndex]);

    const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = null; };
    const onTouchMove = (e: TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
    const onTouchEnd = () => {
        if (touchStartX.current == null || touchEndX.current == null) return;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentPage < pageCount - 1) setCurrentPage(p => p + 1);
            else if (diff < 0 && currentPage > 0) setCurrentPage(p => p - 1);
        }
        touchStartX.current = null; touchEndX.current = null;
    };

    const imgPath = (h: Horse, hovered: boolean) =>
        `/assets/game/breeding/stable-horses/right/${h.profile.type_horse_slug}/${h.profile.name_slug}-${hovered ? 'hover' : 'regular'}.gif`;

    const calcExtras = useCallback((h: Horse) => {
        const extra = h.items?.reduce(
            (acc, it) => {
                const mod = itemModifiers[it.name];
                if (!mod) return acc;
                acc.extraPwr += mod.extraPwr || 0;
                acc.extraSpt += mod.extraSpt || 0;
                acc.extraSpd += mod.extraSpd || 0;
                return acc;
            },
            { extraPwr: 0, extraSpt: 0, extraSpd: 0 }
        ) || { extraPwr: 0, extraSpt: 0, extraSpd: 0 };
        return extra;
    }, []);

    const buildXp = (h: Horse) => {
        const max = Number(xpProgression[Number(h.staty.level)] ?? 0);
        return `${formatXp(Number(h.staty.exp))}/${formatXp(max)}`;
    };

    if (!status || currentStud == null) return null;

    return (
        <div className={styles.modalWrapper}>
            <div className={styles.modalFull}>
                <div className={styles.modalContent} ref={containerRef}>
                    <button className={styles.modalClose} onClick={onClose}>
                        <Image src={closeIcon} alt="Close" width={30} height={30} />
                    </button>
                    <h2 className={styles.title}>MY HORSES</h2>

                    {pageCount > 1 && (
                        <>
                            <button className={`${styles.arrow} ${styles.prev}`} onClick={() => currentPage > 0 && setCurrentPage(p => p - 1)} disabled={currentPage === 0}>‹</button>
                            <button className={`${styles.arrow} ${styles.next}`} onClick={() => currentPage < pageCount - 1 && setCurrentPage(p => p + 1)} disabled={currentPage === pageCount - 1}>›</button>
                        </>
                    )}

                    <div
                        className={styles.carouselViewport}
                        ref={viewportRef}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div className={styles.carouselTrack} style={{ transform: `translateX(-${currentPage * 100}%)` }}>
                            {Array.from({ length: pageCount }).map((_, pageIdx) => {
                                const start = pageIdx * TOTAL_SLOTS_PER_PAGE;
                                const slice = paddedHorses.slice(start, start + TOTAL_SLOTS_PER_PAGE);
                                return (
                                    <div key={pageIdx} className={styles.page}>
                                        <div className={styles.gridContainer}>
                                            {slice.map((h, idx) => {
                                                if (!h) return (
                                                    <div key={idx} className={styles.gridItemWrapper}><div className={styles.gridItemEmpty} /></div>
                                                );

                                                const absoluteIdx = pageIdx * TOTAL_SLOTS_PER_PAGE + idx;
                                                // …labelColor / sexColor / extras / xpStr…

                                                return (
                                                    <div key={h.id} className={styles.gridItemWrapper}>
                                                        <button
                                                            className={styles.gridItem}
                                                            onClick={() => setActiveDropdownIndex(prev => prev === absoluteIdx ? null : absoluteIdx)}

                                                            onDoubleClick={async () => {
                                                                // fallback: double-click the card breeds immediately
                                                                if (slot == null || !currentStud) return;
                                                                await selectHorse(slot, h.id);
                                                                setActiveDropdownIndex(null);
                                                                if (currentStud.horseIds.length === 1) onClose(); // was second pick
                                                            }}
                                                            onMouseEnter={(e) => showTooltip(e.currentTarget as HTMLElement, h)}
                                                            onMouseLeave={() => setTooltip(null)}
                                                            onFocus={() => setTooltip(null)}
                                                            onBlur={() => setTooltip(null)}
                                                        >
                                                            <div className={styles.imageWrapper}>
                                                                <img
                                                                    src={imgPath(h, false)}
                                                                    alt={h.profile.name}
                                                                    onMouseOver={(e) => { e.currentTarget.src = imgPath(h, true); }}
                                                                    onMouseOut={(e) => { e.currentTarget.src = imgPath(h, false); }}
                                                                />
                                                            </div>
                                                            <span className={styles.horseId}>#{h.id}</span>
                                                        </button>

                                                        {activeDropdownIndex === absoluteIdx && (
                                                            <div className={styles.dropdown}>
                                                                <div
                                                                    className={styles.dropdownOption}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation(); // <-- important
                                                                        console.log(slot)
                                                                        console.log(currentStud)
                                                                        if (slot == null || !currentStud) return;
                                                                        console.log(`Assign horse ${h.id} to stud ${slot}`);
                                                                        await selectHorse(slot, h.id);
                                                                        console.log(h.id)
                                                                        console.log(slot)
                                                                        setActiveDropdownIndex(null);
                                                                        if (currentStud.horseIds.length === 1) onClose(); // was second pick
                                                                    }}
                                                                    onKeyDown={async (e) => {
                                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                                            e.preventDefault();
                                                                            (e.currentTarget as HTMLDivElement).click();
                                                                        }
                                                                    }}
                                                                >
                                                                    Breed
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

                    {pageCount > 1 && (
                        <div className={styles.dotsContainer}>
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <span key={i} className={`${styles.dot} ${i === currentPage ? styles.activeDot : ''}`} onClick={() => setCurrentPage(i)} />
                            ))}
                        </div>
                    )}

                    {/* Dots */}
                    {pageCount > 1 && (
                        <div className={styles.dotsContainer}>
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <span
                                    key={i}
                                    className={`${styles.dot} ${i === currentPage ? styles.activeDot : ''}`}
                                    onClick={() => setCurrentPage(i)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Tooltip content mirrors SingleHorse PROFILE + STATY */}
                    {tooltip && (
                        <Tooltip x={tooltip.x} y={tooltip.y} visible={true}>
                            <div className={styles.tooltipPortal}>
                                <div className={styles.tooltipSection}>
                                    <div className={styles.row}>
                                        <span className={styles.label}>NAME:</span>{' '}
                                        <span className={styles.value}>
                                            {(tooltip.horse.profile.nickname && tooltip.horse.profile.nickname.trim().length > 0
                                                ? tooltip.horse.profile.nickname
                                                : tooltip.horse.profile.name).slice(0, 16)}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>SEX:</span>{' '}
                                        <span className={styles.value} style={{ color: tooltip.sexColor }}>
                                            {tooltip.horse.profile.sex}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>RARITY:</span>{' '}
                                        <span className={styles.value} style={{ color: tooltip.labelColor }}>
                                            {tooltip.horse.profile.type_horse}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>GEN:</span>{' '}
                                        <span className={styles.dim}>{tooltip.horse.staty.generation}</span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>BREEDS:</span>{' '}
                                        <span className={styles.value}>
                                            {'breeding' in tooltip.horse.staty ? (tooltip.horse.staty as any).breeding : '0/24'}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>STATUS:</span>{' '}
                                        <span className={styles.value}>{tooltip.horse.staty.status}</span>
                                    </div>
                                </div>

                                <div className={styles.tooltipSection}>
                                    <div className={styles.row}>
                                        <span className={styles.label}>LEVEL:</span>{' '}
                                        <span className={styles.value}>{tooltip.horse.staty.level}</span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>EXP:</span>{' '}
                                        <span className={styles.value}>{tooltip.xpStr}</span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>PWR:</span>{' '}
                                        <span className={styles.value}>
                                            {tooltip.horse.staty.power}
                                            {tooltip.extraPwr > 0 && <span className={styles.bonus} style={{ color: statColor }}> +{tooltip.extraPwr}</span>}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>SPT:</span>{' '}
                                        <span className={styles.value}>
                                            {tooltip.horse.staty.sprint}
                                            {tooltip.extraSpt > 0 && <span className={styles.bonus} style={{ color: statColor }}> +{tooltip.extraSpt}</span>}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>SPD:</span>{' '}
                                        <span className={styles.value}>
                                            {tooltip.horse.staty.speed}
                                            {tooltip.extraSpd > 0 && <span className={styles.bonus} style={{ color: statColor }}> +{tooltip.extraSpd}</span>}
                                        </span>
                                    </div>
                                    <div className={styles.row}>
                                        <span className={styles.label}>ENERGY:</span>{' '}
                                        <span className={styles.value}>{tooltip.horse.staty.energy}</span>
                                    </div>
                                </div>
                            </div>
                        </Tooltip>
                    )}
                </div>
                <div className={styles.dialogWrapper}>
                    <img
                        src="/assets/characters/horse_handler.png"
                        alt="Horse Handler"
                        className={styles.character}
                    />

                    <div className={styles.rpgDialogBox}>
                        <div className={styles.dialogText}>
                            {displayedText}
                            <span className={styles.cursor}>|</span>
                        </div>
                        {/* No answers here for BreedingModal */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreedingModal;
