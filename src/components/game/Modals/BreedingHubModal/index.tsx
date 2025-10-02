// src/components/game/Modals/BreedingHubModal.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { Horse } from '../../Stables/types/horse';
import { BreedingProvider, useBreeding } from '@/contexts/BreedingContext';
import BreedingStud from '../../BreedingStud';
import BreedingModal from '../BreedingModal';

type Props = {
  status: boolean;
  setVisible: (v: boolean) => void;
  horses: Horse[];
  onChanged?: () => void; // called after closing the breeding dialog (e.g., to refresh)
};

const PER_PAGE = 2;

const StudsInner: React.FC<{ horses: Horse[]; onCloseAll: () => void; onChanged?: () => void }> = ({
  horses,
  onCloseAll,
  onChanged,
}) => {
  const { studs, resizeStudSlots } = useBreeding();
  const [studModalOpen, setStudModalOpen] = useState(false);
  const [activeStudId, setActiveStudId] = useState<number | string | null>(null);

  // Resize studs: ceil(housed / 2)
  const housedCount = useMemo(
    () => horses.filter(h => (h as any)?.staty?.stable != null).length,
    [horses]
  );
  const desiredStuds = Math.max(1, Math.ceil(housedCount / 2));

  useEffect(() => {
    resizeStudSlots(desiredStuds);
  }, [desiredStuds, resizeStudSlots]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(studs.length / PER_PAGE));

  useEffect(() => {
    // clamp page if studs shrink
    if (currentPage > pageCount - 1) setCurrentPage(pageCount - 1);
  }, [pageCount, currentPage]);

  const openStud = (absoluteIndex: number) => {
    if (!studs[absoluteIndex] || studs[absoluteIndex].active) return;
    setActiveStudId(absoluteIndex);
    setStudModalOpen(true);
  };

  const closeBreeding = () => {
    setStudModalOpen(false);
    setActiveStudId(null);
    onChanged?.();
  };

  const start = currentPage * PER_PAGE;
  const slice = studs.slice(start, start + PER_PAGE);

  // pad to 4 tiles so the grid keeps shape
  const padded = slice.length < PER_PAGE
    ? [...slice, ...Array.from({ length: PER_PAGE - slice.length }, () => null)]
    : slice;

  return (
    <>
      {/* Pagination controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px' }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          style={{
            background: '#b5a69f',
            border: '1px solid rgba(255,255,255,.6)',
            color: '#4c3e3d',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: currentPage === 0 ? 'default' : 'pointer',
            opacity: currentPage === 0 ? 0.5 : 1,
          }}
        >
          ‹ Prev
        </button>

        <div style={{ color: '#fff', fontFamily: 'SpaceHorse, sans-serif' }}>
          Page {pageCount === 0 ? 0 : currentPage + 1} / {pageCount}
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage >= pageCount - 1}
          style={{
            background: '#b5a69f',
            border: '1px solid rgba(255,255,255,.6)',
            color: '#4c3e3d',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: currentPage >= pageCount - 1 ? 'default' : 'pointer',
            opacity: currentPage >= pageCount - 1 ? 0.5 : 1,
          }}
        >
          Next ›
        </button>
      </div>

      {/* Dots */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 8 }}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              onClick={() => setCurrentPage(i)}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i === currentPage ? '#fff' : 'rgba(255,255,255,.6)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}

      {/* 2x2 grid with up to 4 studs per page */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(320px, 1fr))',
          gridAutoRows: '1fr',
          gap: 16,
          alignItems: 'stretch',
          justifyItems: 'center',
          padding: 12,
          maxWidth: '100%',
        }}
      >
        {padded.map((s, idxInPage) => {
          if (!s) {
            // empty tile placeholder to preserve grid shape
            return (
              <div
                key={`empty-${idxInPage}`}
                style={{
                  width: '100%',
                  minHeight: 260,
                  border: '1px dashed rgba(255,255,255,.25)',
                  borderRadius: 10,
                  opacity: 0.5,
                }}
              />
            );
          }
          const absoluteIndex = start + idxInPage;
          return (
            <BreedingStud
              key={s.id}
              index={absoluteIndex}
              horses={horses}
              id={absoluteIndex}
              onOpen={() => openStud(absoluteIndex)}
            />
          );
        })}
      </div>

      <BreedingModal
        status={studModalOpen}
        studId={activeStudId}
        horses={horses}
        onClose={closeBreeding}
      />
    </>
  );
};

const BreedingHubModal: React.FC<Props> = ({ status, setVisible, horses, onChanged }) => {
  if (!status) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 4, // above canvas & action bar
      }}
      onClick={(e) => {
        // click outside closes
        if (e.target === e.currentTarget) setVisible(false);
      }}
    >
      <div
        className="ph-breeding-panel"
        style={{
          borderRadius: 12,
          minWidth: '1120px',
          maxWidth: '80vw',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'SpaceHorse, sans-serif', fontSize: 18, letterSpacing: 1 }}>Breeding</div>
          <button
            onClick={() => setVisible(false)}
            style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: 18 }}
            aria-label="Close breeding"
            title="Close"
          >
            ✕
          </button>
        </div>

        <BreedingProvider>
          <StudsInner
            horses={horses}
            onCloseAll={() => setVisible(false)}
            onChanged={onChanged}
          />
        </BreedingProvider>
      </div>

      <style>{`
        @media (max-width: 1800px) {
          .ph-breeding-panel {
            min-width: 80vw !important;
          }
        }
        @media (max-width: 980px) {
          /* Stack grid as 1x? if screen is narrow */
          .ph-breeding-panel .grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default BreedingHubModal;
