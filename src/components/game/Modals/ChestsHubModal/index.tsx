// src/components/game/Modals/ChestsHubModal.tsx
import React from 'react';
import itemsStyles from '@/components/game/Items/styles.module.scss'
import ShopChestCard from '../../ShopChestCard';

type Props = {
  status: boolean;
  setVisible: (v: boolean) => void;
};

const ChestsHubModal: React.FC<Props> = ({ status, setVisible }) => {
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
        zIndex: 4, // above canvas & sidebar
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setVisible(false);
      }}
    >
      <div
        style={{
          borderRadius: 12,
          minWidth: 880,
          maxWidth: '80vw',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'SpaceHorse, sans-serif', fontSize: 18, letterSpacing: 1 }}>Chests</div>
          <button
            onClick={() => setVisible(false)}
            style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: 18 }}
            aria-label="Close chests"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 12 }}>
          {/* same grid as Items page */}
          <div className={itemsStyles.cardItems}>
            {/* <PresaleList /> */}
            <ShopChestCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChestsHubModal;
