// src/components/game/Modals/BreedingHubModal.tsx
import React, { useState } from 'react';
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

const StudsInner: React.FC<{ horses: Horse[]; onCloseAll: () => void; onChanged?: () => void }> = ({ horses, onCloseAll, onChanged }) => {
    const { studs } = useBreeding();
    const [studModalOpen, setStudModalOpen] = useState(false);
    const [activeStudId, setActiveStudId] = useState<number | string | null>(null);

    const openStud = (slot: 0 | 1) => {
        if (studs[slot].active) return;
        setActiveStudId(slot);
        setStudModalOpen(true);
    };

    const closeBreeding = () => {
        setStudModalOpen(false);
        setActiveStudId(null);
        // Give the caller a chance to refresh balances/horses
        onChanged?.();
    };

    return (
        <>
            <div style={{
                display: 'flex',
                gap: 16,
                alignItems: 'stretch',
                justifyContent: 'center',
                padding: 12,
            }}>
                <BreedingStud index={0} horses={horses} id={0} onOpen={() => openStud(0)} />
                <BreedingStud index={1} horses={horses} id={1} onOpen={() => openStud(1)} />
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
        @media (max-width: 1160px) {
          .ph-breeding-panel {
            min-width: 90vw !important;
          }
        }
      `}</style>
        </div >
    );
};

export default BreedingHubModal;
