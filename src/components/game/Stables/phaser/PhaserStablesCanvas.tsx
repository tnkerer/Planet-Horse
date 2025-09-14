// src/components/game/Stables/phaser/PhaserStablesCanvas.tsx
import React from 'react';
import ItemBag from '@/components/game/Modals/ItemBag';
import MineModal from '@/components/game/Modals/MineModal';
import RacesModal from '@/components/game/Modals/RacesModal';
import ui from './styles.module.scss';
import type { Horse } from '../types/horse';
import { bus } from './bus';

type Props = {
  horseList: Horse[];
  reloadHorses: () => Promise<void>;  // + NEW
};

const PhaserStablesCanvas: React.FC<Props> = ({ horseList, reloadHorses }) => {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const [bagOpen, setBagOpen] = React.useState(false);
  const [mineOpen, setMineOpen] = React.useState(false);
  const [showHUD, setShowHUD] = React.useState(false);
  const [modalRaces, setModalRaces] = React.useState(false);
  // const { horseList, loadHorses, nextRecoveryTs } = useHorseList('level');

  // Keep the latest list in a ref, so we can emit it right after loadHorses:
  const horseListRef = React.useRef<Horse[]>([]);
  React.useEffect(() => {
    horseListRef.current = horseList;
    bus.emit('horses:update', horseList);  // push to Phaser on every change
  }, [horseList]);

  // Use this wherever you need to "Race All" or reload from a modal:
  const reloadHorsesAndEmit = React.useCallback(async () => {
    await reloadHorses();                     // triggers state update
    // emit on next frame so state has settled
    requestAnimationFrame(() => {
      bus.emit('horses:update', horseListRef.current);
    });
  }, [reloadHorses]);

  const idleHorses = React.useMemo(
    () => horseList.filter(h => h.staty.status === 'IDLE'),
    [horseList]
  );

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
  }, []); // ← no horseList dep

  // stream horse updates to Phaser without re-creating the game
  React.useEffect(() => {
    bus.emit('horses:update', horseList);
  }, [horseList]);

  React.useEffect(() => {
    const sendNow = () => bus.emit('horses:update', horseList);
    bus.on('horses:request', sendNow);

    // also push once on next frame to cover initial mount timing
    const raf = requestAnimationFrame(sendNow);

    return () => {
      bus.off('horses:request', sendNow);
      cancelAnimationFrame(raf);
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
            className={ui.raceAllButton}
            onClick={() => { setModalRaces(true); setTimeout(() => bus.emit('ui:click'), 0); }}
            disabled={idleHorses.length === 0}
            aria-label="Race All"
            title={idleHorses.length ? `Race ${idleHorses.length} idle horse(s)` : 'No idle horses'}
          />

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
      {showHUD && modalRaces && (
        <RacesModal
          setVisible={setModalRaces}
          status={modalRaces}
          totalHorses={idleHorses.length}
          horses={idleHorses}
          reloadHorses={reloadHorsesAndEmit}
        />
      )}
    </div>
  );
};

export default PhaserStablesCanvas;
