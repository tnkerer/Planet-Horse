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
import Tooltip from '../../Tooltip';

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

interface DisplayItem {
  id: number;
  name: string;
  src: string;
  quantity: number;
  description: string;
  consumable: boolean;
  usesLeft: number;
}

interface Props {
  status: boolean;
  closeModal: (modalType: string) => void;
  horse?: Horse;
  reloadHorses?: () => Promise<void>;
}

const ItemBag: React.FC<Props> = ({
  status,
  closeModal,
  horse,
  reloadHorses,
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

  // Touch/swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlotsPerPage = 12;

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
    usesLeft: number;
  } | null>(null);

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
      };
    });

    // Pad to totalSlotsPerPage, but only for the very last page (to keep grid structure)
    const remainder = mapped.length % totalSlotsPerPage;
    const padCount = remainder === 0 ? 0 : totalSlotsPerPage - remainder;
    return mapped.concat(Array(padCount).fill(null));
  }, [serverItems]);

  if (!status) return null;

  // How many pages do we need?
  const pageCount = Math.ceil(displayItems.length / totalSlotsPerPage);

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
      setInfoMessage(`Used one ${itemName}.`);
      if (reloadHorses) await reloadHorses();
      fetchItems();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to use item');
    } finally {
      setActiveDropdownIndex(null);
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

  // Items on current page
  const itemsOnThisPage = displayItems.slice(
    currentPage * totalSlotsPerPage,
    (currentPage + 1) * totalSlotsPerPage
  );

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
                const slice = displayItems.slice(
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
                        return (
                          <div key={idx} className={styles.gridItemWrapper}>
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
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 8,
                                  content: item.description,
                                  usesLeft: item.usesLeft,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <div className={styles.imageWrapper}>
                                <Image
                                  src={`/assets/items/${item.src}.webp`}
                                  alt={item.name}
                                  layout="fill"
                                  objectFit="contain"
                                />
                              </div>
                              <span className={styles.itemCount}>x{item.quantity}</span>
                            </button>

                            {horse &&
                              activeDropdownIndex ===
                              pageIdx * totalSlotsPerPage + idx && (
                                <div
                                  className={`${styles.dropdown} ${idx >= 8 ? styles.dropdownAbove : ''
                                    }`}
                                >
                                  {item.consumable ? (
                                    <><div
                                      className={styles.dropdownOption}
                                      onClick={async () => {
                                        handleUse(item.name, item.usesLeft)
                                        setTooltip(null)
                                      }
                                      }
                                    >
                                      Use
                                    </div>
                                      <div
                                        className={styles.dropdownOption}
                                        onClick={async () =>
                                          console.log(`Minting ${item.name}`)
                                        }
                                      >
                                        Mint
                                      </div>
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
                                        onClick={async () =>
                                          console.log(`Minting ${item.name}`)
                                        }
                                      >
                                        Mint
                                      </div>
                                      {/* <div
                                        className={styles.dropdownOption}
                                        onClick={async () =>
                                          handleEquip(item.name, item.usesLeft)
                                        }
                                      >
                                        Equip 2
                                      </div>
                                      <div
                                        className={styles.dropdownOption}
                                        onClick={async () =>
                                          handleEquip(item.name, item.usesLeft)
                                        }
                                      >
                                        Equip 3
                                      </div> */}
                                    </>
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
                <span className={styles.usesLeft}>
                  ({tooltip.usesLeft} uses left)
                </span>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemBag;
