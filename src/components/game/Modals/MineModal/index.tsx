import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import styles from './styles.module.scss'
import close from '@/assets/game/pop-up/fechar.png'
import ErrorModal from '../ErrorModal'
import InfoModal from '../InfoModal'              // ← NEW
import ItemBag from '../ItemBag'
import CraftingBag from '../CraftingBag'
import { DisplayItem } from '@/components/game/Modals/ItemBag'
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
  const [infoMessage, setInfoMessage] = useState<string | null>(null)   // ← NEW
  const [postInfoAction, setPostInfoAction] = useState<(() => void) | null>(null) // ← NEW
  const [textFinished, setTextFinished] = useState(false)
  const [itemBagOpen, setItemBagOpen] = useState(false)
  const [craftingBagOpen, setCraftingBagOpen] = useState(false)
  const [toUpgrade, setToUpgrade] = useState<DisplayItem | null>(null)
  const [mode, setMode] = useState<'default' | 'upgrade' | 'finalize' | 'craft' | 'craftSelect'>('default')
  const [serverItems, setServerItems] = useState<ServerItem[]>([])
  const { medals, updateBalance } = useUser();
  const [useClover, setUseClover] = useState(false);

  const [craftTarget, setCraftTarget] = useState<string | null>(null)

  // typing effect
  const [targetText, setTargetText] = useState(fullText);
  const typeNarration = (text: string) => {
    setTargetText(text);
    setDisplayedText('');
    setTextFinished(false);
  };

  useEffect(() => {
    if (!status) return;

    setErrorMessage(null);
    setDisplayedText('');
    setTextFinished(false);

    let i = 0;
    const target = targetText;
    const timer = setInterval(() => {
      i++;
      setDisplayedText(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(timer);
        setTextFinished(true);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [status, targetText]);

  useEffect(() => {
    if (useClover && getItemQty('Clover') <= 0) {
      setUseClover(false);
    }
  }, [serverItems, useClover]);

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
  }, [fetchItems, updateBalance])

  useEffect(() => {
    if (mode === 'finalize' && !toUpgrade) {
      setMode('default')
    }
  }, [mode, toUpgrade])

  const handleItem = (item: any) => {
    setToUpgrade(item)
    setUseClover(false)
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
        body: JSON.stringify({
          name: toUpgrade.name,
          useClover,              // ← NEW
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data?.item?.success) {
        setInfoMessage('Item upgraded successfully!');
      } else if (!data?.item?.success && data?.item?.broken) {
        setErrorMessage('❌ The item broke during the upgrade!');
      } else {
        setErrorMessage('Upgrade failed, but your item is safe.');
      }

      fetchItems();
      updateBalance();

      if (data?.item?.success) {
        setPostInfoAction(() => () => {
          setToUpgrade(null);
          setUseClover(false);    // ← reset after success
          setMode('default');
          typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?');
        });
      } else {
        // keep context so player can try again
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unexpected upgrade error.');
    }
  };


  // Generic craft handler (uses craftTarget)
  const handleCraft = async () => {
    if (!craftTarget) {
      setErrorMessage('Choose a blueprint first.');
      return;
    }
    try {
      const res = await fetch(`${process.env.API_URL}/user/items/craft`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `craft-${craftTarget}-${Date.now()}-${Math.random().toString(36).slice(2)}`
        },
        body: JSON.stringify({ name: craftTarget }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); if (j?.message) msg = j.message; } catch { }
        throw new Error(msg);
      }

      // Show info modal and DEFER state changes until user closes it
      setInfoMessage(`Successfully crafted 1× ${craftTarget}!`);              // ← InfoModal
      await fetchItems();
      await updateBalance();

      setPostInfoAction(() => () => {                                         // ← defer resets
        setCraftTarget(null);
        setMode('default');
        typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?');
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || `Failed to craft ${craftTarget || 'item'}`);
      // keep current mode so user can review requirements
    }
  };

  if (!status) return null

  return (
    <>
      {/* Existing item bag (for upgrades) */}
      {itemBagOpen && (
        <ItemBag
          status={itemBagOpen}
          handleUpgrade={handleItem}
          upgrade={true}
          closeModal={() => setItemBagOpen(false)}
        />
      )}

      {/* Crafting bag (blueprint picker) */}
      {craftingBagOpen && (
        <CraftingBag
          status={craftingBagOpen}
          options={Object.keys(craftReq)}
          onSelect={(name) => {
            setCraftTarget(name);
            setMode('craft');
            setCraftingBagOpen(false);
            typeNarration(`Let's craft a ${name}. Review the required materials above.`);
          }}
          closeModal={() => setCraftingBagOpen(false)}
        />
      )}

      {/* Error + Info modals */}
      {errorMessage && (
        <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      {infoMessage && (
        <InfoModal
          text={infoMessage}
          onClose={() => {
            setInfoMessage(null);
            if (postInfoAction) {
              const fn = postInfoAction;
              setPostInfoAction(null);
              fn();                           // ← perform deferred resets AFTER user closes
            }
          }}
        />
      )}

      <div className={`${styles.modalRecovery} ${status ? styles.modalActive : styles.modalInactive}`}>
        <div className={styles.modalFull}>
          {/* Main centered content with background */}
          <div className={styles.modalContent}>
            <div
              className={styles.modalClose}
              onClick={() => {
                setVisible(false)
                setMode('default')
                setToUpgrade(null)
                setCraftTarget(null)
                setUseClover(false)
              }}
            >
              <Image src={close} alt="Close" width={30} height={30} />
            </div>

            {(mode === 'upgrade' || mode === 'finalize' || mode === 'craft' || mode === 'craftSelect') && (
              <div className={styles.crossGrid}>
                {[...Array(9)].map((_, i) => {
                  const showSlot =
                    (mode === 'craft' || mode === 'craftSelect')
                      ? [1, 3, 4, 5].includes(i)
                      : [1, 3, 4, 5, 7].includes(i)

                  let imgSrc: string | null = null

                  if (mode === 'finalize') {
                    if (i === 1) imgSrc = '/assets/icons/medal_small.gif'
                    else if (i === 3) imgSrc = '/assets/items/metal.webp'
                    else if (i === 4 && toUpgrade) imgSrc = `/assets/items/${toUpgrade.src}.webp`
                    else if (i === 5) imgSrc = '/assets/items/leather.webp'
                    else if (i === 7) {
                      imgSrc = useClover
                        ? '/assets/items/clover.webp'       // ← colored clover when active
                        : '/assets/items/grey-clover.png';  // ← greyed clover when inactive
                    }
                  } else if (mode === 'craft' || mode === 'craftSelect') {
                    const recipe = craftTarget ? craftReq[craftTarget] || {} : {}
                    const mats = Object.keys(recipe).filter(k => k !== 'phorse' && k !== 'medals')

                    if (i === 1) {
                      imgSrc = '/assets/icons/medal_small.gif'
                    } else if (i === 4) {
                      if (craftTarget && itemsConst[craftTarget]?.src) {
                        imgSrc = `/assets/items/${String(itemsConst[craftTarget].src)}.webp`
                      }
                    } else if (i === 3 && mats[0]) {
                      const s = itemsConst[mats[0]]?.src
                      if (s) imgSrc = `/assets/items/${String(s)}.webp`
                    } else if (i === 5 && mats[1]) {
                      const s = itemsConst[mats[1]]?.src
                      if (s) imgSrc = `/assets/items/${String(s)}.webp`
                    }
                  }

                  const CraftCostOverlay = () => {
                    if (!(mode === 'craft' || mode === 'craftSelect')) return null
                    if (!craftTarget) return null
                    const recipe = craftReq[craftTarget]
                    if (!recipe) return null

                    const mats = Object.keys(recipe).filter(k => k !== 'phorse' && k !== 'medals')

                    let needed = 0;
                    let has = 0;
                    if (i === 1) {
                      needed = Number(recipe.medals || 0)
                      has = medals || 0
                    } else if (i === 3 && mats[0]) {
                      needed = Number((recipe as any)[mats[0]] || 0)
                      has = getItemQty(mats[0])
                    } else if (i === 5 && mats[1]) {
                      needed = Number((recipe as any)[mats[1]] || 0)
                      has = getItemQty(mats[1])
                    } else {
                      return null
                    }
                    if (!needed) return null
                    return (
                      <span
                        className={styles.itemCount}
                        style={{ color: has < needed ? '#ff3d3d' : '#fff' }}
                      >
                        {needed}
                      </span>
                    )
                  }

                  const showClickToChoose =
                    (mode === 'craftSelect' && i === 4 && !craftTarget) ||
                    (mode === 'upgrade' && i === 4)

                  return (
                    <div
                      key={i}
                      className={styles.gridItemWrapper}
                      onClick={
                        (mode === 'craftSelect' && i === 4)
                          ? () => setCraftingBagOpen(true)
                          : (mode === 'upgrade' && i === 4)
                            ? () => setItemBagOpen(true)
                            : (mode === 'finalize' && i === 7 && getItemQty('Clover') > 0)
                              ? () => setUseClover(prev => !prev)   // ← toggle Clover
                              : undefined
                      }
                      style={{
                        cursor: (
                          (mode === 'craftSelect' && i === 4) ||
                          (mode === 'upgrade' && i === 4) ||
                          (mode === 'finalize' && i === 7 && getItemQty('Clover') > 0)
                        )
                          ? 'pointer'
                          : 'default'
                      }}
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
                                    (e.currentTarget as HTMLImageElement).onerror = null
                                      ; (e.currentTarget as HTMLImageElement).src = `/assets/items/${toUpgrade.src}.gif`
                                  }
                                }}
                              />
                              {(mode === 'craft' || mode === 'craftSelect') && <CraftCostOverlay />}
                              {(mode !== 'craft' && mode !== 'craftSelect') && (i === 1 || i === 3 || i === 5) && toUpgrade && (
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
                              {/* NEW: Clover active halo + Clover quantity */}
                              {mode === 'finalize' && i === 7 && useClover && (
                                <div className={styles.cloverHalo} />
                              )}
                              {mode === 'finalize' && i === 7 && (
                                <span
                                  className={styles.itemCount}
                                  style={{ color: getItemQty('Clover') > 0 ? '#fff' : '#ff3d3d' }}
                                >
                                  {getItemQty('Clover')}
                                </span>
                              )}
                            </div>
                          )}

                          {showClickToChoose && (
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
                      {(() => {
                        const baseSuccess = interfaceData[toUpgrade.name]?.success ?? 0;
                        const effectiveSuccess = Math.min(baseSuccess + (useClover ? 10 : 0), 100);

                        return (
                          <div>
                            <div>
                              This upgrade will cost <b>{interfaceData[toUpgrade.name]?.phorse} PHORSE</b> and the items described above.{' '}
                              Success chance: <b>{effectiveSuccess}%</b>
                              {useClover && (
                                <span> (includes +10% from Clover)</span>
                              )}
                              . Do you want to proceed with it?
                            </div>
                            {interfaceData[toUpgrade.name]?.willBreak && (
                              <div style={{ color: 'red' }}>
                                Warning: This item <b>will break</b> on failure!
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    {interfaceData[toUpgrade.name]?.willBreak && (
                      <div style={{ color: 'red' }}>
                        Warning: This item <b>will break</b> on failure!
                      </div>
                    )}
                  </div>
                ) : mode === 'craft' ? (
                  <div>
                    {craftTarget ? (
                      <>
                        Craft <b>{craftTarget}</b> will cost <b>{Number(craftReq[craftTarget]?.phorse || 0)} PHORSE</b> and the materials shown above.
                      </>
                    ) : (
                      <>Choose a blueprint by clicking the middle slot.</>
                    )}
                  </div>
                ) : mode === 'craftSelect' ? (
                  <>Choose a blueprint by clicking the middle slot.</>
                ) : (
                  displayedText
                )}
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
                      setMode('craftSelect')
                      setCraftTarget(null)
                      typeNarration('Choose a Blueprint to craft. Click the center slot to open the list of available crafts.')
                    }}
                  >
                    Craft Blueprint
                  </div>
                </div>
              )}

              {mode === 'craftSelect' && (
                <div className={styles.answerBox}>
                  <div
                    className={styles.answerOption}
                    onClick={() => {
                      setMode('default');
                      setCraftTarget(null);
                      typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?');
                    }}
                  >
                    Back
                  </div>
                </div>
              )}

              {mode === 'craft' && (
                <div className={styles.answerBox}>
                  <div
                    className={styles.answerOption}
                    onClick={handleCraft}
                    style={{ opacity: craftTarget ? 1 : 0.5, pointerEvents: craftTarget ? 'auto' : 'none' }}
                  >
                    Craft!
                  </div>
                  <div
                    className={styles.answerOption}
                    onClick={() => {
                      setMode('default');
                      setCraftTarget(null);
                      typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?');
                    }}
                  >
                    Back
                  </div>
                </div>
              )}

              {mode === 'finalize' && (
                <div className={styles.answerBox}>
                  <div
                    className={styles.answerOption}
                    onClick={handleUpgrade}
                  >
                    Upgrade!
                  </div>

                  <div
                    className={styles.answerOption}
                    onClick={() => {
                      setToUpgrade(null)
                      setUseClover(false)
                      setMode('upgrade')
                    }}
                  >
                    Choose other
                  </div>

                  <div
                    className={styles.answerOption}
                    onClick={() => {
                      setMode('default')
                      setUseClover(false)
                      typeNarration('Hi, I am Master Artificer Bruno! What would you like to do today?')
                    }}
                  >
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
