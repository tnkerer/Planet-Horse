import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.scss';
import ConfirmModal from '@/components/game/Modals/ConfirmModal';
import ErrorModal from '@/components/game/Modals/ErrorModal';
import InfoModal from '@/components/game/Modals/InfoModal';
// Reuse Phaser constants to compute upgrade costs, etc.
import { STABLE_LEVELS } from '@/components/game/Stables/phaser/constants/stables';

type StableStatus = {
  tokenId: string;
  level: number;
  upgrading: boolean;
  upgradeStarted: string | null;     // ISO
  upgradeEndsAt: string | null;      // ISO
  upgradeRemainingSeconds: number | null;
};

type Props = {
  // minimal DTO
  tokenId: string;
  level: number;
  onOpenHorses: (tokenId: string) => void;
  onUpgraded?: (freshLevel: number) => void; // parent can react if needed
};

const BG_BY_LEVEL: Record<1 | 2 | 3 | 4, string> = {
  1: '/assets/game/phaser/misc/background_simple_1.png',
  2: '/assets/game/phaser/misc/background_simple_2.png',
  3: '/assets/game/phaser/misc/background_simple_3.png',
  4: '/assets/game/phaser/misc/background_simple_4.png',
};

function fmtHMS(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

export default function SingleStable({ tokenId, level, onOpenHorses, onUpgraded }: Props) {
  const [status, setStatus] = useState<StableStatus>({
    tokenId,
    level,
    upgrading: false,
    upgradeStarted: null,
    upgradeEndsAt: null,
    upgradeRemainingSeconds: null,
  });

  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);

  const [nextStableTs, setNextStableTs] = useState<number | null>(null);
  const [stableRemain, setStableRemain] = useState<number>(0);

  const maxed = status.level >= 4;

  // Next level & cost (we use current level entry’s cost for next bump)
  const nextLevel = Math.min(4, Math.max(1, status.level + 1)) as 1 | 2 | 3 | 4;
  const upgradeCostPhorse = useMemo(() => {
    const curLv = Math.max(1, Math.min(4, status.level)) as 1 | 2 | 3 | 4;
    return STABLE_LEVELS[curLv]?.upgradeCostPhorse ?? 0;
  }, [status.level]);

  // Derived remaining (live countdown) -----------------------------
  const [remaining, setRemaining] = useState<number>(status.upgradeRemainingSeconds ?? 0);

  // Ticking every 1s from endsAt when upgrading
  useEffect(() => {
    let t: number | null = null;

    const tick = () => {
      if (!status.upgrading) { setRemaining(0); return; }
      let remain = 0;
      if (status.upgradeEndsAt) {
        remain = Math.max(0, Math.ceil((Date.parse(status.upgradeEndsAt) - Date.now()) / 1000));
      } else if (status.upgradeRemainingSeconds != null) {
        remain = Math.max(0, status.upgradeRemainingSeconds);
      }
      setRemaining(remain);
    };

    tick();
    t = window.setInterval(tick, 1000);
    return () => { if (t) window.clearInterval(t); };
  }, [status.upgrading, status.upgradeEndsAt, status.upgradeRemainingSeconds]);

  // Poll status every 10s
  useEffect(() => {
    let cancelled = false;
    let iv: number | null = null;

    const load = async () => {
      try {
        const res = await fetch(`${process.env.API_URL}/stable/${tokenId}/status`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `Status ${res.status}`);
        if (!cancelled) setStatus(data);
      } catch (e: any) {
        if (!cancelled) setErrorText(e?.message || 'Failed to load stable status');
      }
    };

    // initial + every 10s
    load();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    iv = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      if (iv) window.clearInterval(iv);
    };
  }, [tokenId]);

  useEffect(() => {
    let cancelled = false;
    let iv: number | null = null;

    const fetchNext = async () => {
      try {
        const res = await fetch(`${process.env.API_URL}/horses/next-stable-energy`, {
          credentials: 'include'
        });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data?.message || `Next stable tick ${res.status}`);
        if (!cancelled && typeof data?.nextTimestamp === 'number') {
          setNextStableTs(data.nextTimestamp);
        }
      } catch {
        // silent (no popup needed)
      }
    };

    const tick = () => {
      if (nextStableTs == null) return;
      const remain = Math.max(0, Math.ceil((nextStableTs - Date.now()) / 1000));
      setStableRemain(remain);
      if (remain <= 0) {
        // grab the next window when this one elapses
        void fetchNext();
      }
    };

    void fetchNext();              // initial
    iv = window.setInterval(tick, 1000); // safe (non-async callback)

    return () => {
      cancelled = true;
      if (iv) window.clearInterval(iv);
    };
  }, [nextStableTs]);

  // Outside click to close dropdown
  useEffect(() => {
    if (!showMenu) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) && cardRef.current && !cardRef.current.contains(t)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('click', onDoc, true);
    return () => document.removeEventListener('click', onDoc, true);
  }, [showMenu]);

  // ⬇️ compute extra per tick from current level
  const extraPerTick =
    STABLE_LEVELS[Math.max(1, Math.min(4, status.level)) as 1 | 2 | 3 | 4]?.extraEnergyPerTick ?? 0;

  // ⬇️ NEW: stable-tick segment
  const stableTickSeg = nextStableTs
    ? `+${extraPerTick} Energy in ${fmtHMS(stableRemain)}`
    : '';

  // API helpers ----------------------------------------------------
  const callStartUpgrade = async () => {
    const res = await fetch(`${process.env.API_URL}/stable/${tokenId}/upgrade`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    let body: any = null;
    try { body = await res.json(); } catch { /* ignore */ }
    if (!res.ok) throw new Error(body?.message || `Upgrade ${res.status}`);
    return body;
  };

  const callFinishUpgrade = async () => {
    const res = await fetch(`${process.env.API_URL}/stable/${tokenId}/upgrade/finish`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    let body: any = null;
    try { body = await res.json(); } catch { /* ignore */ }
    if (!res.ok) throw new Error(body?.message || `Finish ${res.status}`);
    return body;
  };

  // Actions --------------------------------------------------------
  const onClickUpgrade = async () => {
    if (maxed) return;
    if (status.upgrading) {
      // If timer hit zero → Finish
      if ((remaining ?? 0) <= 0) {
        try {
          await callFinishUpgrade();
          const res = await fetch(`${process.env.API_URL}/stable/${tokenId}/status`, { credentials: 'include' });
          const fresh = await res.json();
          if (!res.ok) throw new Error(fresh?.message || `Status ${res.status}`);
          setStatus(fresh);
          setInfoText('Upgrade finalized!');
          onUpgraded?.(fresh.level);
        } catch (e: any) {
          setErrorText(e?.message || 'Failed to finalize upgrade');
        } finally {
          setShowMenu(false);
        }
      }
      return;
    }
    // Not upgrading → open confirm
    setShowConfirm(true);
  };

  const onConfirmUpgrade = async () => {
    setShowConfirm(false);
    try {
      await callStartUpgrade();
      // Refresh
      const res = await fetch(`${process.env.API_URL}/stable/${tokenId}/status`, { credentials: 'include' });
      const fresh = await res.json();
      if (!res.ok) throw new Error(fresh?.message || `Status ${res.status}`);
      setStatus(fresh);
      setInfoText('Upgrade started!');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to start upgrade');
    } finally {
      setShowMenu(false);
    }
  };

  const labelLine1 = `Stable #${status.tokenId}`;
  const labelLine2 = status.upgrading
    ? `Lvl ${status.level} • Upgrading ${fmtHMS(remaining)}`
    : `Lvl ${status.level} • Open`;
  const labelLine3 = stableTickSeg;

  const dropdownUpgradeLabel = maxed
    ? 'Max Level'
    : status.upgrading
      ? ((remaining ?? 1) <= 0 ? 'Finish Upgrade' : `Upgrading… ${fmtHMS(remaining)}`)
      : 'Upgrade';

  const dropdownUpgradeEnabled = !maxed && (!status.upgrading || (remaining ?? 1) <= 0);

  const bgUrl = BG_BY_LEVEL[Math.max(1, Math.min(4, status.level)) as 1 | 2 | 3 | 4];

  return (
    <>
      {/* card */}
      <div
        ref={cardRef}
        className={styles.stableCard}
        role="button"
        tabIndex={0}
        aria-label={`Stable ${status.tokenId}`}
        onClick={() => setShowMenu(v => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowMenu(v => !v); } }}
        style={{ backgroundImage: `url('${bgUrl}')` }}
      >
        {/* always-visible label (like Phaser) */}
        <div className={styles.labelBox}>
          <div className={styles.l1}>{labelLine1}</div>
          <div className={styles.l2}>{labelLine2}</div>
          <div className={styles.l2}>{labelLine3}</div>
        </div>

        {/* dropdown */}
        {showMenu && (
          <div ref={menuRef} className={styles.dropdown}>
            <button
              className={styles.ddItem}
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onOpenHorses(status.tokenId); }}
            >
              Horses
            </button>

            <button
              className={`${styles.ddItem} ${!dropdownUpgradeEnabled ? styles.disabled : ''}`}
              disabled={!dropdownUpgradeEnabled}
              onClick={(e) => { e.stopPropagation(); void onClickUpgrade(); }}
            >
              {dropdownUpgradeLabel}
            </button>
          </div>
        )}
      </div>

      {/* Confirm for Upgrade */}
      {showConfirm && (
        <ConfirmModal
          text={
            <span>
              Upgrade Stable to <b>Level {nextLevel}</b> for{' '}
              <b>{upgradeCostPhorse.toLocaleString()}</b> PHORSE?
            </span>
          }
          onClose={() => setShowConfirm(false)}
          onConfirm={() => { void onConfirmUpgrade(); }}
        />
      )}

      {errorText && <ErrorModal text={errorText} onClose={() => setErrorText(null)} />}
      {infoText && <InfoModal text={infoText} onClose={() => setInfoText(null)} />}
    </>
  );
}
