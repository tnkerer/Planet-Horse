// src/components/game/Stables/phaser/PhaserStablesCanvas.tsx
import React from 'react';
import ItemBag from '@/components/game/Modals/ItemBag';
import MineModal from '@/components/game/Modals/MineModal';
import ui from './styles.module.scss';
import type { Horse } from '../types/horse';
import { bus } from './bus';

type Props = { horseList: Horse[] };

const PhaserStablesCanvas: React.FC<Props> = ({ horseList }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [bagOpen, setBagOpen] = React.useState(false);
  const [mineOpen, setMineOpen] = React.useState(false);
  const [showHUD, setShowHUD] = React.useState(false); // NEW

  React.useEffect(() => {
    let dispose: (() => void) | null = null;
    let mounted = true;

    const onShow = () => setShowHUD(true);
    const onHide = () => { setShowHUD(false); setBagOpen(false); setMineOpen(false); };

    bus.on('hud:show', onShow);
    bus.on('hud:hide', onHide);

    (async () => {
      if (!hostRef.current) return;
      const { createGame } = await import('./core/createGame');
      if (!mounted) return;
      dispose = createGame(hostRef.current, { horseList });
    })();

    return () => {
      mounted = false;
      dispose?.();
      bus.off('hud:show', onShow);
      bus.off('hud:hide', onHide);
    };
  }, [horseList]);

  return (
    <div ref={hostRef} className={ui.host}>
      {/* Phaser will inject its <canvas> here */}

      {/* Bottom ACTIONS row (now only while MainScene is active) */}
      {showHUD && (
        <div className={ui.bottomBar}>
          <button
            className={`${ui.bagButton} ${bagOpen ? ui.bagOpened : ''}`}
            onClick={() => {
              setBagOpen(true);
              // fire-and-forget so any sfx errors can’t block UI
              setTimeout(() => bus.emit('ui:click'), 0);
            }}
            aria-label="Open Bag"
            title="Open Bag"
          >
            <span className={ui.notificationBadge} />
          </button>

          <button
            className={ui.upgradeButton}
            onClick={() => {
              setMineOpen(true);
              // fire-and-forget so any sfx errors can’t block UI
              setTimeout(() => bus.emit('ui:click'), 0);
            }}
            aria-label="Upgrade Stables"
            title="Upgrade Stables"
          />
        </div>
      )}

      {/* React modals (also gated by showHUD for safety) */}
      {showHUD && bagOpen && (
        <ItemBag status={bagOpen} closeModal={() => setBagOpen(false)} />
      )}
      {showHUD && (
        <MineModal setVisible={setMineOpen} status={mineOpen} />
      )}
    </div>
  );
};

export default PhaserStablesCanvas;
