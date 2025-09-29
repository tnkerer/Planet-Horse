// src/components/game/Stables/phaser/PhaserStablesCanvas.tsx
import React from 'react';
import ItemBag from '@/components/game/Modals/ItemBag';
import MineModal from '@/components/game/Modals/MineModal';
import RacesModal from '@/components/game/Modals/RacesModal';
import BreedingHubModal from '@/components/game/Modals/BreedingHubModal';
import ui from './styles.module.scss';
import type { Horse } from '../types/horse';
import { bus } from './bus';
import ChestsHubModal from '../../Modals/ChestsHubModal';
import { burnHorseToken } from '../utils/burnHorse';
import ConfirmModal from '@/components/game/Modals/ConfirmModal';
import ErrorModal from '@/components/game/Modals/ErrorModal';
import ModalRaceStart from '@/components/game/Modals/RaceStart';
import RecoveryCenter from '@/components/game/Modals/RecoveryCenter';
import SingleHorse from '@/components/game/SingleHorse'
import StableHorsesModal from '@/components/game/Modals/StableHorsesModal';
import Image from 'next/image';
import close from '@/assets/game/pop-up/fechar.png';

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
  const [modalBreeding, setModalBreeding] = React.useState(false);
  const [modalChests, setModalChests] = React.useState(false);
  // const { horseList, loadHorses, nextRecoveryTs } = useHorseList('level');

  const [sidebarTop, setSidebarTop] = React.useState<number>(140);
  const [confirmBurn, setConfirmBurn] = React.useState<{ open: boolean; id: number | null; label: string }>({
    open: false, id: null, label: ''
  });
  const [burning, setBurning] = React.useState(false);
  const [errorText, setErrorText] = React.useState<string | null>(null);

  const [openedHorseId, setOpenedHorseId] = React.useState<number | null>(null);

  const [raceModalOpen, setRaceModalOpen] = React.useState(false);
  const [raceHorse, setRaceHorse] = React.useState<Horse | null>(null);

  const [restoreModalOpen, setRestoreModalOpen] = React.useState(false);
  const [restoreHorse, setRestoreHorse] = React.useState<Horse | null>(null);

  const [stableHorsesOpen, setStableHorsesOpen] = React.useState(false);
  const [stableTokenId, setStableTokenId] = React.useState<string | null>(null);

  const [isWide, setIsWide] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 952);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const RARITY_MOD: Record<string, number> = {
    common: 1,
    uncommon: 1.3,
    rare: 1.6,
    epic: 1.9,
    legendary: 2.2,
    mythic: 2.5,
  };
  const BASE_DENOM = 24;
  const calcRecoveryCost = React.useCallback((h: Horse) => {
    const mod = (RARITY_MOD[h.profile.type_horse_slug] ?? 1) * (260 / BASE_DENOM);
    return Number((parseInt(h.staty.level) * mod).toFixed(2));
  }, []);

  const openedHorse = React.useMemo(
    () => (openedHorseId == null ? null : horseList.find(h => h.id === openedHorseId) ?? null),
    [horseList, openedHorseId]
  );

  React.useEffect(() => {
    const onRace = ({ id }: { id: number }) => {
      const h = horseListRef.current.find(hh => hh.id === id);
      if (!h) return;
      if (h.staty.status !== 'IDLE') return; // safety
      setRaceHorse(h);
      setRaceModalOpen(true);
    };

    const onRestore = ({ id }: { id: number }) => {
      const h = horseListRef.current.find(hh => hh.id === id);
      if (!h) return;
      if (h.staty.status !== 'BRUISED') return; // safety
      setRestoreHorse(h);
      setRestoreModalOpen(true);
    };

    bus.on('horse:race', onRace);
    bus.on('horse:restore', onRestore);
    return () => {
      bus.off('horse:race', onRace);
      bus.off('horse:restore', onRestore);
    };
  }, []);

  React.useEffect(() => {
    const onOpenStableHorses = ({ tokenId }: { tokenId: string }) => {
      setStableTokenId(tokenId);
      setStableHorsesOpen(true);
    };
    bus.on('stable:horses-open', onOpenStableHorses);
    return () => { bus.off('stable:horses-open', onOpenStableHorses); };
  }, []);

  React.useEffect(() => {
    const onBounds = (b: { left: number; top: number; width: number; height: number }) => {
      // place sidebar a bit below the HUD
      const pad = 12;
      setSidebarTop(Math.max(0, Math.round(b.top + b.height + pad)));
    };
    bus.on('ui:profile-bounds', onBounds);
    return () => { bus.off('ui:profile-bounds', onBounds); };
  }, []);

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
    const onBurnReq = ({ id }: { id: number }) => {
      const h = horseListRef.current.find(x => x.id === id);
      const label = h ? (h.profile.nickname?.trim() || h.profile.name) : `#${id}`;
      setConfirmBurn({ open: true, id, label });
    };
    bus.on('horse:burn', onBurnReq as any);
    return () => { bus.off('horse:burn', onBurnReq as any); };
  }, []);

  const doConfirmBurn = React.useCallback(async () => {
    if (!confirmBurn.open || confirmBurn.id == null) return;
    setBurning(true);
    try {
      await burnHorseToken(confirmBurn.id);
      // Close confirm first so users see the canvas again
      setConfirmBurn({ open: false, id: null, label: '' });

      await reloadHorsesAndEmit();
      bus.emit('game:horse:changed'); // optional nudge to Phaser
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong. Failed to burn horse.';
      setConfirmBurn({ open: false, id: null, label: '' });
      setErrorText('Something went wrong. Failed to burn horse.');
    } finally {
      setBurning(false);
    }
  }, [confirmBurn, reloadHorsesAndEmit]);

  const gameDisposeRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    let mounted = true;

    // If not wide, ensure any existing game is torn down and bail
    if (!isWide) {
      gameDisposeRef.current?.();
      gameDisposeRef.current = null;
      return;
    }

    const onShow = () => setShowHUD(true);
    const onHide = () => { setShowHUD(false); setBagOpen(false); setMineOpen(false); };
    const onOpenHorse = (id: number) => setOpenedHorseId(id);
    const onCloseHorse = () => setOpenedHorseId(null);

    bus.on('hud:show', onShow);
    bus.on('hud:hide', onHide);
    bus.on('ui:open-horse', onOpenHorse);
    bus.on('ui:close-horse', onCloseHorse);

    let dispose: (() => void) | null = null;

    (async () => {
      if (!hostRef.current) return;
      const { createGame } = await import('./core/createGame');
      if (!mounted) return;
      dispose = createGame(hostRef.current, {
        horseList,
        apiBase: process.env.API_URL,
      });
      gameDisposeRef.current = dispose;
    })();

    return () => {
      mounted = false;
      dispose?.();
      if (gameDisposeRef.current === dispose) gameDisposeRef.current = null;

      bus.off('hud:show', onShow);
      bus.off('hud:hide', onHide);
      bus.off('ui:open-horse', onOpenHorse);
      bus.off('ui:close-horse', onCloseHorse);
    };
  }, [isWide]);

  React.useEffect(() => {
    const onOpen = ({ id }: { id: number }) => {
      const h = horseListRef.current.find(x => x.id === id);
      if (!h) {
        setErrorText('Horse not found or out of sync.');
        return;
      }
      setOpenedHorseId(h.id);
    };
    bus.on('horse:open', onOpen as any);
    return () => { bus.off('horse:open', onOpen as any); };
  }, []);

  React.useEffect(() => {
    // Dedup clicks that happen within this window (ms)
    let lastEmit = 0;

    const onAnyClick = (ev: MouseEvent) => {
      const host = hostRef.current;
      if (!host) return;

      const target = ev.target as Node | null;

      // Ignore clicks that hit the Phaser canvas (Phaser will handle its own sfx)
      const canvas = host.querySelector('canvas');
      if (canvas && target && canvas.contains(target)) return;

      // Optional: skip clicks explicitly marked as "silent"
      if (target instanceof HTMLElement && target.closest('[data-silent-click]')) return;

      const now = performance.now();
      if (now - lastEmit < 120) return; // dedupe burst/double emits
      lastEmit = now;

      bus.emit('ui:click');
    };

    // Use capture so we see the event even if some handlers stop propagation
    document.addEventListener('click', onAnyClick, true);
    return () => document.removeEventListener('click', onAnyClick, true);
  }, []);

  if (!isWide) {
    return (
      <div className={ui.unavailable}>
        <div>
          <h3>Game unavailable on mobile</h3>
          <p>Please use a device with a width of at least 952&nbsp;px.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={hostRef} className={ui.host}>
      {/* Phaser will inject its <canvas> here */}

      {/* Left sidebar (vertical actions), only while MainScene is active */}
      {showHUD && (
        <div className={ui.sideBar} style={{ top: sidebarTop }}>
          <button
            className={`${ui.bagButton} ${bagOpen ? ui.bagOpened : ''}`}
            onClick={() => setBagOpen(true)}
            aria-label="Open Bag"
            title="Open Bag"
          >
            <span className={ui.notificationBadge} />
          </button>

          <button
            className={ui.raceAllButton}
            onClick={() => setModalRaces(true)}
            disabled={idleHorses.length === 0}
            aria-label="Race All"
            title={idleHorses.length ? `Race ${idleHorses.length} idle horse(s)` : 'No idle horses'}
          />

          <button
            className={ui.breedingButton}
            onClick={() => setModalBreeding(true)}
            aria-label="Breeding"
            title="Breeding"
          />

          <button
            className={ui.upgradeButton}
            onClick={() => setMineOpen(true)}
            aria-label="Upgrade Stables"
            title="Upgrade Stables"
          />

          <button
            className={ui.chestsButton}
            onClick={() => setModalChests(true)}
            aria-label="Chests"
            title="Chests"
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
      {showHUD && modalBreeding && (
        <BreedingHubModal
          status={modalBreeding}
          setVisible={setModalBreeding}
          horses={horseList}
          onChanged={async () => {
            // When breeding completes, gently refresh horses + nudge Phaser
            await reloadHorsesAndEmit();
            bus.emit('game:horse:changed');
          }}
        />
      )}
      {showHUD && modalChests && (
        <ChestsHubModal
          status={modalChests}
          setVisible={setModalChests}
        />
      )}
      {showHUD && raceModalOpen && raceHorse && (
        <ModalRaceStart
          status={raceModalOpen}
          horse={raceHorse}
          setVisible={setRaceModalOpen}
          onRaceEnd={reloadHorsesAndEmit}
        />
      )}

      {showHUD && restoreModalOpen && restoreHorse && (
        <RecoveryCenter
          status={restoreModalOpen}
          horseId={restoreHorse.id}
          cost={calcRecoveryCost(restoreHorse)}
          setVisible={setRestoreModalOpen}
          onRestored={reloadHorsesAndEmit}
        />
      )}
      {showHUD && stableHorsesOpen && stableTokenId && (
        <StableHorsesModal
          status={stableHorsesOpen}
          stableTokenId={stableTokenId}
          horses={horseList}
          onClose={() => setStableHorsesOpen(false)}
          reloadHorses={reloadHorsesAndEmit}
        />
      )}
      {openedHorse && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 5, // above canvas & sidebar; navbar is z=3
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenedHorseId(null); }}
        >
          <div
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Optional close button */}
            <button
              onClick={() => setOpenedHorseId(null)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 25,
                right: 15,
                cursor: 'pointer',
                zIndex: 7,         // above the SingleHorse card
                background: 'none',
                border: 'none',
                padding: 0,
                lineHeight: 0,
              }}
            >
              <Image src={close} alt="Close" width={30} height={30} />
            </button>

            <SingleHorse
              horse={openedHorse}
              reloadHorses={reloadHorsesAndEmit}
            />
          </div>
        </div>
      )}
      {/* Burn confirmation modal */}
      {confirmBurn.open && (
        <ConfirmModal
          text={
            <span>
              Burn horse <strong>{confirmBurn.label}</strong>? This is <em>irreversible</em>.
            </span>
          }
          onClose={() => { if (!burning) setConfirmBurn({ open: false, id: null, label: '' }); }}
          onConfirm={() => { if (!burning) { void doConfirmBurn(); } }}
        />
      )}

      {/* Error modal (shown on failure) */}
      {errorText && (
        <ErrorModal text={errorText} onClose={() => setErrorText(null)} />
      )}
    </div>
  );
};

export default PhaserStablesCanvas;
