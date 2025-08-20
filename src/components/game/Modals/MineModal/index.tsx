import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import ErrorModal from '../ErrorModal'
import ItemBag from '../ItemBag'
import { DisplayItem } from '@/components/game/Modals/ItemBag/index'
import { interfaceData } from '@/utils/constants/item_progression'
import { items as itemsConst } from '@/utils/constants/items'
import { itemCraftReq as craftReq } from '@/utils/constants/item_crafting'
import { useUser } from '@/contexts/UserContext'

interface Props {
    setVisible: Dispatch<SetStateAction<boolean>>
    status: boolean
}

interface ServerItem {
    name: string
    quantity: number
}

const MineModal: React.FC<Props> = ({ setVisible, status }) => {
    const fullText = 'Hi, I am Master Artificer Bruno! What would you like to do today?'
    const [displayedText, setDisplayedText] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [textFinished, setTextFinished] = useState(false)
    const [itemBagOpen, setItemBagOpen] = useState(false)
    const [toUpgrade, setToUpgrade] = useState<DisplayItem | null>(null)
    const [mode, setMode] = useState<'default' | 'upgrade' | 'finalize' | 'craft'>('default')
    const [serverItems, setServerItems] = useState<ServerItem[]>([])
    const { medals, updateBalance } = useUser();

    // NEW: what we want to type out
    const [targetText, setTargetText] = useState(fullText);

    // NEW: call this instead of setDisplayedText(...) when you want a new narration
    const typeNarration = (text: string) => {
        setTargetText(text);
        setDisplayedText('');     // reset visible text
        setTextFinished(false);   // typing in progress
    };

    useEffect(() => {
        if (!status) return;

        setErrorMessage(null);
        setDisplayedText('');      // ensure we start from empty for the new target
        setTextFinished(false);

        let i = 0;
        const target = targetText; // capture
        const timer = setInterval(() => {
            i++;
            setDisplayedText(target.slice(0, i));
            if (i >= target.length) {
                clearInterval(timer);
                setTextFinished(true);
            }
        }, 25);

        return () => clearInterval(timer);
    }, [status, targetText]);     // ← rerun whenever the target text changes

    const fetchItems = useCallback(() => {
        if (!status) return
        fetch(`${process.env.API_URL}/user/items`, {
            credentials: 'include',
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.json() as Promise<ServerItem[]>
            })
            .then(setServerItems)
            .catch((err) => {
                console.error(err)
                setErrorMessage(err.message || 'Failed to load items')
            })
    }, [status])

    const getItemQty = (itemName: string): number => {
        return serverItems.find((i) => i.name === itemName)?.quantity || 0
    }

    useEffect(() => {
        fetchItems()
        updateBalance()
    }, [fetchItems])

    useEffect(() => {
        if (mode === 'finalize' && !toUpgrade) {
            setMode('default')
        }
    }, [mode, toUpgrade])

    const handleItem = (item: any) => {
        setToUpgrade(item)
        setMode('finalize')
        setItemBagOpen(false)
        fetchItems()
    }

    const handleUpgrade = async () => {
        if (!toUpgrade) return;

        try {
            const res = await fetch(`${process.env.API_URL}/user/items/upgrade`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: toUpgrade.name }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.message || `HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data?.item?.success) {
                setErrorMessage('Item upgraded successfully!');
            } else if (!data?.item?.success && data?.item?.broken) {
                setErrorMessage('❌ The item broke during the upgrade!');
            } else {
                setErrorMessage('Upgrade failed, but your item is safe.');
            }

            // Refresh inventory or reset state as needed
            fetchItems();
            setToUpgrade(null);
            setMode('default');
            updateBalance();
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || 'Unexpected upgrade error.');
        }
    };

    // NEW: craft Medal Bag
    const handleCraft = async () => {
        try {
            const res = await fetch(`${process.env.API_URL}/user/items/craft`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Idempotency-Key': `craftbag-${Date.now()}-${Math.random().toString(36).slice(2)}`
                },
                body: JSON.stringify({ name: 'Medal Bag' }),
            });
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try { const j = await res.json(); if (j?.message) msg = j.message; } catch { }
                throw new Error(msg);
            }
            setErrorMessage('Successfully Crafted 1× Medal Bag!');
            await fetchItems();
            await updateBalance();
            setDisplayedText('Hi, I am Master Artificer Bruno! What would you like to do today?');
            setMode('default');
        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || 'Failed to craft Medal Bag');
        }
    };

    if (!status) return null

    return (
        <>
            {itemBagOpen && (
                <ItemBag status={itemBagOpen} handleUpgrade={handleItem} upgrade={true} closeModal={() => setItemBagOpen(false)} />
            )}
            {errorMessage && (
                <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
            )}

            <div className={`${styles.modalRecovery} ${status ? styles.modalActive : styles.modalInactive}`}>
                <div className={styles.modalFull}>
                    {/* Main centered content with background */}
                    <div className={styles.modalContent}>
                        <div className={styles.modalClose} onClick={() => setVisible(false)}>
                            <Image src={close} alt="Close" width={30} height={30} />
                        </div>
                        {(mode === 'upgrade' || mode === 'finalize' || mode === 'craft') && (
                            <div className={styles.crossGrid}>
                                {[...Array(9)].map((_, i) => {
                                    const showSlot = mode === 'craft' ? [1, 3, 4, 5].includes(i) : [1, 3, 4, 5, 7].includes(i)

                                    let imgSrc: string | null = null

                                    if (mode === 'finalize') {
                                        if (i === 1) imgSrc = '/assets/items/medal_bag.webp'
                                        else if (i === 3) imgSrc = '/assets/items/metal.webp'
                                        else if (i === 4 && toUpgrade) imgSrc = `/assets/items/${toUpgrade.src}.webp`
                                        else if (i === 5) imgSrc = '/assets/items/leather.webp'
                                        else if (i === 7) imgSrc = '/assets/items/grey-clover.png'
                                    } else if (mode === 'craft') {
                                        // Crafting Medal Bag grid:
                                        // 1 → medals icon, 4 → Medal Bag result, 3/5 → materials from craft recipe
                                        const recipe = craftReq['Medal Bag'] || {};
                                        const mats = Object.keys(recipe).filter(k => k !== 'phorse' && k !== 'medals');
                                        if (i === 1) imgSrc = '/assets/icons/medal_small.gif';
                                        else if (i === 4) imgSrc = '/assets/items/medal_bag.webp';
                                        else if (i === 3 && mats[0]) {
                                            const s = itemsConst[mats[0]]?.src;
                                            if (s) imgSrc = `/assets/items/${String(s)}.webp`;
                                        } else if (i === 5 && mats[1]) {
                                            const s = itemsConst[mats[1]]?.src;
                                            if (s) imgSrc = `/assets/items/${String(s)}.webp`;
                                        }
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={styles.gridItemWrapper}
                                            onClick={mode === 'upgrade' && i === 4 ? () => setItemBagOpen(true) : undefined}
                                            style={{ cursor: mode === 'upgrade' && i === 4 ? 'pointer' : 'default' }}
                                        >
                                            {showSlot && (
                                                <>
                                                    <div className={styles.gridItemEmpty} />

                                                    {imgSrc && (
                                                        <div className={styles.imageWrapper}>
                                                            <img
                                                                src={imgSrc}
                                                                alt={`Slot ${i}`}
                                                                className={styles.slotItemImage}
                                                                onError={(e) => {
                                                                    if (i === 4 && toUpgrade) {
                                                                        e.currentTarget.onerror = null
                                                                        e.currentTarget.src = `/assets/items/${toUpgrade.src}.gif`
                                                                    }
                                                                }}
                                                            />
                                                            {/* Conditional cost overlay */}
                                                            {mode === 'craft' && (i === 1 || i === 3 || i === 5) && (() => {
                                                                const recipe = craftReq['Medal Bag'];
                                                                const mats = Object.keys(recipe).filter(k => k !== 'phorse' && k !== 'medals');
                                                                let needed = 0;
                                                                let has = 0;
                                                                if (i === 1) {
                                                                    needed = Number(recipe.medals || 0);
                                                                    has = medals || 0;
                                                                } else if (i === 3 && mats[0]) {
                                                                    needed = Number((recipe as any)[mats[0]] || 0);
                                                                    has = getItemQty(mats[0]);
                                                                } else if (i === 5 && mats[1]) {
                                                                    needed = Number((recipe as any)[mats[1]] || 0);
                                                                    has = getItemQty(mats[1]);
                                                                }
                                                                if (!needed) return null;
                                                                return (
                                                                    <span
                                                                        className={styles.itemCount}
                                                                        style={{ color: has < needed ? '#ff3d3d' : '#fff' }}
                                                                    >
                                                                        {needed}
                                                                    </span>
                                                                );
                                                            })()}
                                                            {(mode !== 'craft') && (i === 1 || i === 3 || i === 5) && toUpgrade && (
                                                                <span
                                                                    className={styles.itemCount}
                                                                    style={{
                                                                        color: (() => {
                                                                            const data = interfaceData[toUpgrade.name]
                                                                            const needed =
                                                                                i === 1 ? data.medal : i === 3 ? data.metal : data.leather
                                                                            const has =
                                                                                i === 1
                                                                                    ? medals
                                                                                    : i === 3
                                                                                        ? getItemQty('Scrap Metal')
                                                                                        : getItemQty('Scrap Leather')
                                                                            return has < needed ? '#ff3d3d' : '#fff'
                                                                        })(),
                                                                    }}
                                                                >
                                                                    {(() => {
                                                                        const data = interfaceData[toUpgrade.name]
                                                                        return i === 1
                                                                            ? `${Number(data.medal)}`
                                                                            : i === 3
                                                                                ? `${Number(data.metal)}`
                                                                                : `${Number(data.leather)}`
                                                                    })()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {mode === 'upgrade' && i === 4 && (
                                                        <img
                                                            src="/assets/icons/click.gif"
                                                            alt="Click hint"
                                                            className={styles.clickOverlay}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Dialog + Character OUTSIDE modalContent */}
                    <div className={styles.dialogWrapper}>
                        <img src="/assets/characters/miner.png" alt="Miner" className={styles.minerCharacter} />

                        <div className={styles.rpgDialogBox}>
                            <div className={styles.dialogText}>
                                {mode === 'finalize' && toUpgrade ? (
                                    <div>
                                        <div>
                                            This upgrade will cost <b>{interfaceData[toUpgrade.name]?.phorse} PHORSE</b> and the items described above. Success chance: <b>{interfaceData[toUpgrade.name]?.success}%</b>. Do you want to proceed with it?
                                        </div>
                                        {interfaceData[toUpgrade.name]?.willBreak && (
                                            <div style={{ color: 'red' }}>
                                                Warning: This item <b>will break</b> on failure!
                                            </div>
                                        )}
                                    </div>
                                ) : displayedText}
                                {mode !== 'finalize' && <span className={styles.cursor}>|</span>}
                            </div>

                            {mode === 'default' && textFinished && (
                                <div className={styles.answerBox}>
                                    <div
                                        className={styles.answerOption}
                                        onClick={() => {
                                            setMode('upgrade')
                                            typeNarration('Please choose which item you would like to Upgrade. We will need crafting materials, PHORSE and in some cases, medals!')
                                        }}
                                    >
                                        Upgrade Items
                                    </div>
                                    <div
                                        className={styles.answerOption}
                                        onClick={() => {
                                            setMode('craft')
                                            typeNarration(`Let’s craft a Medal Bag. You will need ${craftReq['Medal Bag'].medals} medals, ${craftReq['Medal Bag'].phorse} $PHORSE and some materials.`)
                                        }}
                                    >
                                        Craft Medal Bag
                                    </div>
                                </div>
                            )}

                            {mode === 'craft' && (
                                <div className={styles.answerBox}>
                                    <div className={styles.answerOption} onClick={handleCraft}>
                                        Craft!
                                    </div>
                                    <div className={styles.answerOption}
                                        onClick={() => {
                                            setMode('default')
                                            typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?')
                                        }}>
                                        Back
                                    </div>
                                </div>
                            )}

                            {mode === 'finalize' && (
                                <div className={styles.answerBox}>
                                    <div className={styles.answerOption} onClick={handleUpgrade}>
                                        Upgrade!
                                    </div>
                                    <div className={styles.answerOption} onClick={() => {
                                        setToUpgrade(null)
                                        setMode('upgrade')
                                    }}>
                                        Choose other
                                    </div>
                                    <div className={styles.answerOption}
                                        onClick={() => {
                                            setMode('default')
                                            typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?')
                                        }}>
                                        Back
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default MineModal
