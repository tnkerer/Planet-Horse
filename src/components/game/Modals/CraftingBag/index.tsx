// src/components/game/Modals/CraftingBag/index.tsx
import React, { useMemo } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import { items as itemsConst } from '@/utils/constants/items';
import Tooltip from '../../Tooltip'; // ← NEW

interface Props {
  status: boolean;
  options: string[];                 // craftable outputs (keys of itemCraftReq)
  onSelect: (name: string) => void;  // called when user chooses a blueprint
  closeModal: () => void;
}

const totalSlotsPerPage = 12;

const CraftingBag: React.FC<Props> = ({ status, options, onSelect, closeModal }) => {
  const [currentPage, setCurrentPage] = React.useState(0);

  // Tooltip state
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    name: string;
    content: string;
  } | null>(null); // ← NEW

  const displayItems = useMemo(() => {
    const mapped = options
      .filter(name => !!itemsConst[name])
      .map((name, idx) => ({
        id: `craft-${idx}`,
        name,
        src: itemsConst[name].src,
        description: itemsConst[name].description,
      }));
    const remainder = mapped.length % totalSlotsPerPage;
    const padCount = remainder === 0 ? 0 : totalSlotsPerPage - remainder;
    return mapped.concat(Array(padCount).fill(null) as any);
  }, [options]);

  const pageCount = Math.ceil(displayItems.length / totalSlotsPerPage);

  if (!status) return null;

  return (
    <div className={styles.modalBag}>
      <div className={styles.modalFull}>
        <div className={styles.modalContent}>
          {/* Close */}
          <button
            className={styles.modalClose}
            onClick={() => {
              closeModal();
            }}
          >
            <Image src={closeIcon} alt="Close" width={30} height={30} />
          </button>

          {/* Title */}
          <h2 className={styles.title}>BLUEPRINTS</h2>

          {/* Arrows */}
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
          <div className={styles.carouselViewport}>
            <div
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {Array.from({ length: pageCount }).map((_, pageIdx) => {
                const start = pageIdx * totalSlotsPerPage;
                const slice = displayItems.slice(start, start + totalSlotsPerPage);
                return (
                  <div key={pageIdx} className={styles.page}>
                    <div className={styles.gridContainer}>
                      {slice.map((item: any, idx: number) => {
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
                              onClick={() => onSelect(item.name)}
                              onMouseEnter={(e) => {
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setTooltip({
                                  x: rect.left + rect.width / 1.1,
                                  y: rect.top - 8,
                                  name: item.name,
                                  content: item.description || '',
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              title={`Choose ${String(item.name)}`}
                            >
                              <div className={styles.imageWrapper}>
                                <img
                                  src={`/assets/items/${String(item.src)}.webp`}
                                  alt={item.name}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).onerror = null;
                                    (e.currentTarget as HTMLImageElement).src = `/assets/items/${String(item.src)}.gif`;
                                  }}
                                  style={{ width: '80%', height: '100%', objectFit: 'contain', alignSelf: 'center' }}
                                />
                              </div>
                            </button>
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

          {/* Tooltip portal */}
          {tooltip && (
            <Tooltip x={tooltip.x} y={tooltip.y} visible={true}>
              <div className={styles.tooltipPortal}>
                <span className={styles.tooltipTitle}>{tooltip.name}</span>
                {/* soft-wrap every ~8 words */}
                {String(tooltip.content || '')
                  .split(' ')
                  .reduce<Array<string | JSX.Element>>((acc, word, i) => {
                    if (i > 0 && i % 8 === 0) acc.push(<br key={`br-${i}`} />);
                    acc.push(word + ' ');
                    return acc;
                  }, [])}
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default CraftingBag;
