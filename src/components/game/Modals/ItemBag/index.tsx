// src/components/game/Modals/ItemBag/index.tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  TouchEvent,
} from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import { items as itemsConst } from '@/utils/constants/items';
import { Horse } from '@/domain/models/Horse';
import ErrorModal from '../ErrorModal';
import InfoModal from '../InfoModal';
import {
  BrowserProvider,
  Contract
} from 'ethers';

import { contracts, wallets } from '@/utils/constants/contracts';
import ConfirmMultipleDeposit from '../ConfirmMultipleDeposit';
import MultipleRecycleConfirmModal from '../MultipleRecycleConfirmModal';
import ConfirmMultipleMint from '../MultipleMintConfirmModal';
import Tooltip from '../../Tooltip';
import { useUser } from '@/contexts/UserContext';

interface LocalItemDef {
  name: string;
  src: string;
  description: string;
  breakable: boolean;
  consumable: boolean;
  uses: number;
  property?: Record<string, number>;
}

interface ServerItem {
  name: string;
  quantity: number;
  usesLeft: number;
}

export interface DisplayItem {
  id: number | string;       // we’ll give on-chain items string IDs
  name: string;
  src: string;
  quantity: number;
  description: string;
  consumable: boolean;
  usesLeft: number;
  breakable: boolean;

  /** ← new! */
  onChain?: boolean;
  chainId?: number;
}

interface Props {
  status: boolean;
  upgrade?: boolean;
  closeModal: (modalType: string) => void;
  horse?: Horse;
  reloadHorses?: () => Promise<void>;
  handleUpgrade?: (item: any) => void;
}

const ItemBag: React.FC<Props> = ({
  status,
  upgrade,
  closeModal,
  horse,
  reloadHorses,
  handleUpgrade
}) => {
  const [serverItems, setServerItems] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(false);
  // For error / info messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Which slot’s dropdown is open
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  const [foodUsed, setFoodUsed] = useState<number>(horse?.profile.food_used ?? 0);

  const { updateBalance } = useUser();


  const [multiRecycle, setMultiRecycle] = useState<{
    name: string;
    uses: number;
    quantity: number;
    maxQuantity: number;
  } | null>(null);

  const [multiMint, setMultiMint] = useState<{
    name: string;
    quantity: number;
    maxQuantity: number;
  } | null>(null);

  // on‐chain items
  const [onChainItems, setOnChainItems] = useState<Array<{
    name: string
    balance: number
    chainId: number
  }>>([])

  // multi‐deposit modal
  const [multiDeposit, setMultiDeposit] = useState<{
    name: string;
    chainId: number;
    quantity: number;
    maxQuantity: number;
  } | null>(null);


  // Touch/swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlotsPerPage = 12;

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    content: string;
    usesLeft: number;
    breakable: boolean;
  } | null>(null);

  function getRoninProvider(): BrowserProvider {
    const ronin = (window as any).ronin;
    if (!ronin?.provider) {
      throw new Error(
        'Ronin wallet not detected. Please install & connect your Ronin wallet.'
      );
    }
    return new BrowserProvider(ronin.provider);
  }


  // Fetch from API
  const fetchItems = useCallback(() => {
    if (!status) return;
    setLoading(true);
    fetch(`${process.env.API_URL}/user/items`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ServerItem[]>;
      })
      .then((data) => {
        setServerItems(data);
        setCurrentPage(0); // reset to first page whenever data changes
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message || 'Failed to load items');
      })
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 1. define loadOnChain once
  const loadOnChain = useCallback(async () => {
    if (!status) return
    const ERC1155_ABI = [
      'function balanceOf(address account, uint256 id) view returns (uint256)'
    ]
    try {
      const provider = getRoninProvider()
      const signer = await provider.getSigner()
      const me = await signer.getAddress()
      const contract = new Contract(contracts.items, ERC1155_ABI, provider)

      const raw = await Promise.all(
        Object.values(itemsConst)
          .map(d => d.chainId)
          .filter((id): id is number => !!id)
          .map(async id => {
            const balRaw = await contract.balanceOf(me, id)
            return { chainId: id, balance: Number(balRaw) }
          })
      )

      const filtered = raw
        .filter(r => r.balance > 0)
        .map(r => {
          const def = Object.values(itemsConst).find(d => d.chainId === r.chainId)
          if (!def) {
            // either skip unknown on-chain IDs, or warn
            console.warn(`No local definition for chainId ${r.chainId}`)
            return null
          }
          return {
            name: def.name,
            chainId: r.chainId,
            balance: r.balance,
          }
        })
        .filter(
          (item): item is { name: string; chainId: number; balance: number } =>
            item !== null
        )

      setOnChainItems(filtered)
    } catch (e) {
      console.error('onChain load failed', e)
    }
  }, [status])

  // 2. call it once on mount / status change
  useEffect(() => {
    loadOnChain()
  }, [loadOnChain])


  // Close dropdown if clicked outside
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setActiveDropdownIndex(null);
      }
    }
    if (activeDropdownIndex !== null) {
      document.addEventListener('mousedown', onClickOutside);
      return () => document.removeEventListener('mousedown', onClickOutside);
    }
  }, [activeDropdownIndex]);

  // Build displayItems from serverItems (already grouped by backend)
  const displayItems: Array<DisplayItem | null> = React.useMemo(() => {
    const mapped: DisplayItem[] = serverItems.map((srv, idx) => {
      const def = itemsConst[srv.name] as LocalItemDef | undefined;
      if (!def) {
        console.warn(`No local definition for item "${srv.name}"`);
        return {
          id: idx,
          name: srv.name,
          src: '',
          quantity: srv.quantity,
          description: '',
          consumable: false,
          usesLeft: srv.usesLeft,
          breakable: true
        };
      }
      return {
        id: idx,
        name: def.name,
        src: def.src,
        quantity: srv.quantity,
        description: def.description,
        consumable: Boolean(def.consumable),
        usesLeft: srv.usesLeft,
        breakable: def.breakable
      };
    });

    // Pad to totalSlotsPerPage, but only for the very last page (to keep grid structure)
    const remainder = mapped.length % totalSlotsPerPage;
    const padCount = remainder === 0 ? 0 : totalSlotsPerPage - remainder;
    return mapped.concat(Array(padCount).fill(null));
  }, [serverItems]);

  const combinedItems = React.useMemo<DisplayItem[]>(() => {
    // 1) map on-chain tokens into the same shape
    const onChainMapped = onChainItems.map((oc, idx) => ({
      id: `onchain-${oc.chainId}`,
      name: oc.name,
      src: itemsConst[oc.name].src,
      quantity: oc.balance,
      description: itemsConst[oc.name].description,
      consumable: Boolean(itemsConst[oc.name].consumable),
      usesLeft: itemsConst[oc.name].uses,
      breakable: itemsConst[oc.name].breakable,
      onChain: true,
      chainId: oc.chainId,
    }));

    // 2) tag your server-loaded items
    const serverMapped = displayItems
      .filter((i): i is DisplayItem => i !== null)
      .map(i => ({ ...i, onChain: false }));

    // 3) concat, then pad exactly as you did for displayItems
    const all = [...onChainMapped, ...serverMapped];
    const remainder = all.length % totalSlotsPerPage;
    const padCount = remainder === 0 ? 0 : totalSlotsPerPage - remainder;
    return all.concat(Array(padCount).fill(null) as any);
  }, [onChainItems, displayItems]);

  if (!status) return null;

  // How many pages do we need?
  const pageCount = Math.ceil(combinedItems.length / totalSlotsPerPage);

  // “Use” handler
  const handleUse = async (itemName: string, usesLeft: number) => {
    if (!horse) return;
    setErrorMessage(null);
    try {
      const res = await fetch(
        `${process.env.API_URL}/horses/${horse.id}/consume`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemName: itemName }),
        }
      );

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }

      const data = await res.json();
      setInfoMessage(`Used one ${itemName}.`);
      if (data.foodUsed !== undefined) {
        setFoodUsed(data.foodUsed);
      }

      if (reloadHorses) await reloadHorses();
      fetchItems();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to use item');
    } finally {
      setActiveDropdownIndex(null);
    }
  };

  // "Open" handler
  const handleOpenBag = async () => {
    setErrorMessage(null);
    try {
      const res = await fetch(`${process.env.API_URL}/user/items/open-bag`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `openbag-${Date.now()}-${Math.random().toString(36).slice(2)}`
        },
        body: JSON.stringify({}), // body optional (key comes via header)
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }

      const data = await res.json(); // { added, newMedals, remainingBags }
      setInfoMessage(`Opened Medal Bag: +${String(data.added)} medals!`);
      await updateBalance(); // update balances
      await fetchItems(); // refresh bag contents
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to open Medal Bag');
    } finally {
      setActiveDropdownIndex(null);
      setTooltip(null);
    }
  };


  // “Equip” handler (calls backend /horses/:id/equip-item)
  const handleEquip = async (itemName: string, usesLeft: number) => {
    if (!horse) return;
    setErrorMessage(null);
    try {
      const res = await fetch(
        `${process.env.API_URL}/horses/${horse.id}/equip-item`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: itemName, usesLeft }),
        }
      );
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }
      setInfoMessage(`Equipped ${itemName} to horse #${horse.id}.`);
      if (reloadHorses) await reloadHorses();
      fetchItems();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to equip item');
    } finally {
      setActiveDropdownIndex(null);
    }
  };

  const handleMultiRecycle = async (
    itemName: string,
    usesLeft: number,
    quantity: number
  ) => {
    setErrorMessage(null);
    try {
      const res = await fetch(
        `${process.env.API_URL}/user/items/recycle`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: itemName, uses: usesLeft, quantity }),
        }
      );
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }
      const data = (await res.json()) as { rewards: Array<(string | null)> };
      // summarize rewards
      const received = data.rewards.filter((r) => r !== null);
      if (received.length === 0) {
        setInfoMessage('You got nothing from recycling these items.');
      } else {
        const counts = received.reduce<Record<string, number>>(
          (acc, cur) => {
            acc[cur] = (acc[cur] ?? 0) + 1;
            return acc;
          },
          {}
        );
        const summary = Object.entries(counts)
          .map(([key, cnt]) => `${cnt}× ${key}`)
          .join(', ');
        setInfoMessage(`Recycled ${quantity} item${quantity > 1 ? 's' : ''}: ${summary}`);
      }
      fetchItems();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to recycle items');
    }
  };

  const handleMultiWithdraw = async (
    itemName: string,
    quantity: number
  ) => {
    setErrorMessage(null);
    try {
      const res = await fetch(
        `${process.env.API_URL}/user/item-withdraw`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: itemName, quantity }),
        }
      );
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch { }
        throw new Error(msg);
      }
      setInfoMessage(`Withdrawal request submitted! It might take a few minutes to reflect in your wallet.`);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to submit withdrawal request');
    }
  };

  const handleMultiDeposit = async (
    name: string,
    chainId: number,
    quantity: number
  ) => {
    setErrorMessage(null);
    try {
      const provider = getRoninProvider();
      const signer = await provider.getSigner();

      // ERC-1155 safeTransferFrom ABI snippet
      const ERC1155_ABI = [
        'function safeTransferFrom(address,address,uint256,uint256,bytes)'
      ];

      const token = new Contract(
        contracts.items,
        ERC1155_ABI,
        signer
      );

      const from = await signer.getAddress();

      const tx = await token.safeTransferFrom(
        from,
        wallets.itemMinter,
        chainId,
        quantity,
        '0x'
      );

      setInfoMessage(`Deposit tx sent: ${String(tx.hash)}`);
      await tx.wait();

      setInfoMessage('Deposit confirmed! It might take a few minutes to reflect ingame.');
      // refresh DB items...
      await fetchItems()
      // ...and refresh on-chain balances so the deposited token disappears
      await loadOnChain()
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to deposit items');
    }
  };

  const checkUpgradable = (name: string): boolean => {
    const upgradableNames = ["Champion Saddle Pad", "Champion Bridle", "Champion Stirrups"];
    if (name.endsWith("+15")) return false;
    return upgradableNames.some(upName => name.startsWith(upName));
  }

  // Swipe handlers
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
      // swipe left → next page
      if (diff > 0 && currentPage < pageCount - 1) {
        setCurrentPage((p) => p + 1);
      }
      // swipe right → prev page
      else if (diff < 0 && currentPage > 0) {
        setCurrentPage((p) => p - 1);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const maxUses = (name: string) => (itemsConst[name]?.uses ?? 0);

  return (
    <div className={styles.modalBag} ref={containerRef}>
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* Close button */}
          <button
            className={styles.modalClose}
            onClick={() => {
              closeModal('items');
              setActiveDropdownIndex(null);
            }}
          >
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          {/* Title */}
          <h2 className={styles.title}>BAG</h2>

          {/* Loading state */}
          {loading && (
            <div className={styles.loadingWrapper}>
              <p className={styles.loadingText}>Loading items…</p>
            </div>
          )}

          {/* Error modal */}
          {errorMessage && (
            <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
          )}

          {/* Info modal */}
          {infoMessage && (
            <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />
          )}

          {/* Carousel arrows (only if more than one page) */}
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
                onClick={() =>
                  currentPage < pageCount - 1 && setCurrentPage((p) => p + 1)
                }
                disabled={currentPage === pageCount - 1}
                aria-label="Next page"
              >
                ›
              </button>
            </>
          )}

          {/* The “viewport” that can be swiped */}
          <div
            className={styles.carouselViewport}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Inner flex‐container that slides left/right */}
            <div
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {Array.from({ length: pageCount }).map((_, pageIdx) => {
                const start = pageIdx * totalSlotsPerPage;
                const slice = combinedItems.slice(
                  start,
                  start + totalSlotsPerPage
                );
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
                        const canMint = !item.breakable || item.usesLeft === maxUses(item.name);
                        return (
                          <div
                            key={idx}
                            className={`${styles.gridItemWrapper} ${item.onChain ? styles.onChainItem : ''
                              }`}
                          >
                            <button
                              className={styles.gridItem}
                              onClick={() => {
                                setTooltip(null)
                                setActiveDropdownIndex((prev) =>
                                  prev === pageIdx * totalSlotsPerPage + idx
                                    ? null
                                    : pageIdx * totalSlotsPerPage + idx
                                );
                              }}
                              onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setTooltip({
                                  x: rect.left + rect.width / 1.1,
                                  y: rect.top - 8,
                                  name: item.name,
                                  content: item.description,
                                  usesLeft: item.usesLeft,
                                  breakable: item.breakable
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <div className={styles.imageWrapper}>
                                <img
                                  src={`/assets/items/${item.src}.webp`}
                                  alt={item.name}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null; // prevent infinite loop
                                    e.currentTarget.src = `/assets/items/${item.src}.gif`;
                                  }}
                                  style={{ width: '80%', height: '100%', objectFit: 'contain', alignSelf: 'center' }}
                                />
                              </div>
                              <span className={styles.itemCount}>{item.quantity}</span>
                            </button>

                            {item.onChain && activeDropdownIndex === pageIdx * totalSlotsPerPage + idx && (
                              <div className={styles.dropdown}>
                                <div
                                  className={styles.dropdownOption}
                                  onClick={() => {
                                    setMultiDeposit({
                                      name: item.name,
                                      chainId: (item as any).chainId,
                                      quantity: 1,
                                      maxQuantity: item.quantity,
                                    });
                                    setActiveDropdownIndex(null);
                                  }}
                                >
                                  Deposit
                                </div>
                              </div>
                            )}


                            {!item.onChain && (horse ? (
                              activeDropdownIndex ===
                              pageIdx * totalSlotsPerPage + idx && (
                                <div
                                  className={`${styles.dropdown} ${idx >= 8 ? styles.dropdownAbove : ''
                                    }`}
                                >
                                  {item.consumable ? (
                                    <>
                                      {/* CHANGED: Use → Open for Medal Bag */}
                                      {item.name === 'Medal Bag' ? (
                                        <div
                                          className={styles.dropdownOption}
                                          onClick={handleOpenBag}
                                        >
                                          Open
                                        </div>
                                      ) : (
                                        <div
                                          className={styles.dropdownOption}
                                          onClick={async () => {
                                            handleUse(item.name, item.usesLeft);
                                            setTooltip(null);
                                          }}
                                        >
                                          Use
                                        </div>
                                      )}

                                      <div
                                        className={styles.dropdownOption}
                                        onClick={() => {
                                          setTooltip(null);
                                          setMultiRecycle({ name: item.name, uses: item.usesLeft, quantity: 1, maxQuantity: item.quantity });
                                          setActiveDropdownIndex(null);
                                        }}
                                      >
                                        Recycle
                                      </div>
                                      {canMint && (
                                        <div
                                          className={styles.dropdownOption}
                                          onClick={() => {
                                            setMultiMint({
                                              name: item.name,
                                              quantity: 1,
                                              maxQuantity: item.quantity,
                                            });
                                            setActiveDropdownIndex(null);
                                          }}
                                        >
                                          Mint
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <div
                                        className={styles.dropdownOption}
                                        onClick={async () =>
                                          handleEquip(item.name, item.usesLeft)
                                        }
                                      >
                                        Equip
                                      </div>
                                      <div
                                        className={styles.dropdownOption}
                                        onClick={() => {
                                          setTooltip(null);
                                          setMultiRecycle({ name: item.name, uses: item.usesLeft, quantity: 1, maxQuantity: item.quantity });
                                          setActiveDropdownIndex(null);
                                        }}
                                      >
                                        Recycle
                                      </div>
                                      {canMint && (
                                        <div
                                          className={styles.dropdownOption}
                                          onClick={() => {
                                            // kick off the multiple‐mint flow:
                                            setMultiMint({
                                              name: item.name,
                                              quantity: 1,
                                              maxQuantity: item.quantity,
                                            });
                                            // close dropdown
                                            setActiveDropdownIndex(null);
                                          }}
                                        >
                                          Mint
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )) : (activeDropdownIndex ===
                                pageIdx * totalSlotsPerPage + idx && (
                                  <div
                                    className={`${styles.dropdown} ${idx >= 8 ? styles.dropdownAbove : ''
                                      }`}
                                  >
                                    {(upgrade && checkUpgradable(item.name)) ? <div
                                      className={styles.dropdownOption}
                                      onClick={() => {
                                        setTooltip(null);
                                        handleUpgrade(item)
                                        setActiveDropdownIndex(null)
                                      }}
                                    >
                                      Upgrade
                                    </div> : null}
                                    {item.name === 'Medal Bag' && (
                                      <div
                                        className={styles.dropdownOption}
                                        onClick={handleOpenBag}
                                      >
                                        Open
                                      </div>
                                    )}
                                    <div
                                      className={styles.dropdownOption}
                                      onClick={() => {
                                        setTooltip(null);
                                        setMultiRecycle({ name: item.name, uses: item.usesLeft, quantity: 1, maxQuantity: item.quantity });
                                        setActiveDropdownIndex(null);
                                      }}
                                    >
                                      Recycle
                                    </div>
                                    {canMint && (
                                      <div
                                        className={styles.dropdownOption}
                                        onClick={() => {
                                          // kick off the multiple‐mint flow:
                                          setMultiMint({
                                            name: item.name,
                                            quantity: 1,
                                            maxQuantity: item.quantity,
                                          });
                                          // close dropdown
                                          setActiveDropdownIndex(null);
                                        }}
                                      >
                                        Mint
                                      </div>
                                    )}
                                  </div>
                                )))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page‐indicator dots (optional) */}
          {pageCount > 1 && (
            <div className={styles.dotsContainer}>
              {Array.from({ length: pageCount }).map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentPage ? styles.activeDot : ''
                    }`}
                  onClick={() => setCurrentPage(idx)}
                />
              ))}
            </div>
          )}

          {tooltip && (
            <Tooltip x={tooltip.x} y={tooltip.y} visible={true}>
              <div className={styles.tooltipPortal}>
                <span className={styles.tooltipTitle}>
                  {tooltip.name}
                </span>
                {tooltip.content
                  .split(' ')
                  .reduce<Array<string | JSX.Element>>((acc, word, i) => {
                    if (i > 0 && i % 8 === 0) {
                      acc.push(<br key={`br-${i}`} />);
                    }
                    acc.push(word + ' ');
                    return acc;
                  }, [])}
                <br />
                {tooltip.breakable ? (
                  <span className={styles.usesLeft}>
                    ({tooltip.usesLeft} uses left)
                  </span>) : (null)}
                {itemsConst[tooltip.name]?.property?.currentEnergy !== undefined && foodUsed !== null && horse && (
                  <div className={styles.foodUsed}>
                    You can still use <strong>{3 - foodUsed}</strong> food item(s) for this horse!
                  </div>
                )}
              </div>
            </Tooltip>
          )}

          {multiRecycle && (
            <MultipleRecycleConfirmModal
              quantity={multiRecycle.quantity}
              max={multiRecycle.maxQuantity}
              itemName={multiRecycle.name}
              onQuantityChange={(q) =>
                setMultiRecycle({ ...multiRecycle, quantity: q })
              }
              onClose={() => setMultiRecycle(null)}
              onConfirm={() => {
                handleMultiRecycle(
                  multiRecycle.name,
                  multiRecycle.uses,
                  multiRecycle.quantity
                );
                setMultiRecycle(null);
              }}
            />
          )}

          {multiMint && (
            <ConfirmMultipleMint
              quantity={multiMint.quantity}
              max={multiMint.maxQuantity}
              itemName={multiMint.name}
              onQuantityChange={(q) =>
                setMultiMint({ ...multiMint, quantity: q })
              }
              onClose={() => setMultiMint(null)}
              onConfirm={() => {
                handleMultiWithdraw(
                  multiMint.name,
                  multiMint.quantity
                );
                setMultiMint(null);
              }}
            />
          )}

          {multiDeposit && (
            <ConfirmMultipleDeposit
              itemName={multiDeposit.name}
              quantity={multiDeposit.quantity}
              max={multiDeposit.maxQuantity}
              onQuantityChange={q =>
                setMultiDeposit({ ...multiDeposit, quantity: q })
              }
              onClose={() => setMultiDeposit(null)}
              onConfirm={() => {
                handleMultiDeposit(
                  multiDeposit.name,
                  multiDeposit.chainId,
                  multiDeposit.quantity
                );
                setMultiDeposit(null);
              }}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default ItemBag;
