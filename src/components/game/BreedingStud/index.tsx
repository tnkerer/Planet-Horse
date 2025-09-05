import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles.module.scss';
import type { Horse } from '../BreedFarm';
import { useBreeding } from '@/contexts/BreedingContext';
import { useUser } from '@/contexts/UserContext';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import wronIcon from '@/assets/icons/wron.gif';
import NewHorseModal from '@/components/game/Modals/NewHorseModal';

interface BreedingStudProps {
  index: number;
  horses: Horse[];
  id?: string | number;
  onOpen?: (studId: string | number) => void;
}

const formatHHMMSS = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600).toString().padStart(2, '0');
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

const BreedingStud: React.FC<BreedingStudProps> = ({ index, horses, id, onOpen }) => {
  const studId = (id ?? index) as 0 | 1;
  const { studs, clearSlot, loadActiveBreeds } = useBreeding();
  const { updateBalance } = useUser();
  const stud = studs[studId];

  // resolve picked horse objects for rendering
  const picked = useMemo(() => {
    return stud.horseIds
      .map(id => horses.find(h => h.id === id))
      .filter((h): h is Horse => Boolean(h));
  }, [stud.horseIds, horses]);

  // local submit error (POST failures)
  const [submitError, setSubmitError] = useState<string | null>(null);

  // countdown for active breed
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  useEffect(() => {
    if (!stud.active) { setTimeLeft('00:00:00'); return; }
    const end = stud.active.startedAtMs + 24 * 60 * 60 * 1000;
    const tick = () => setTimeLeft(formatHHMMSS(Math.max(0, end - Date.now())));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [stud.active?.startedAtMs]);

  const isActive = !!stud.active;
  const hasTwo = stud.horseIds.length === 2;

  // ── Finalize-check state (only after timer hits 00:00:00) ──────────────
  const [finalizeEligible, setFinalizeEligible] = useState(false);
  const [finalizeReasons, setFinalizeReasons] = useState<string[] | null>(null);
  const [offspringTokenId, setOffspringTokenId] = useState<number | null>(null);
  const [checkingFinalize, setCheckingFinalize] = useState(false);
  const lastCheckedKeyRef = useRef<string | null>(null);

  const pairKey = stud.horseIds.join('-');

  const resetFinalizeState = () => {
    setFinalizeEligible(false);
    setFinalizeReasons(null);
    setOffspringTokenId(null);
    setCheckingFinalize(false);
    lastCheckedKeyRef.current = null;
  };

  useEffect(() => {
    // reset finalize state whenever pair changes or activity resets
    resetFinalizeState();
  }, [pairKey, isActive]);

  const doFinalizeCheck = async () => {
    if (!isActive || stud.horseIds.length !== 2) return;
    const [a, b] = stud.horseIds;
    const key = `${a}-${b}`;
    if (lastCheckedKeyRef.current === key) return; // already checked for this pair

    try {
      setCheckingFinalize(true);
      const res = await fetch(
        `${process.env.API_URL}/user/finalize/check?a=${a}&b=${b}`,
        { credentials: 'include' }
      );
      const data = await res.json().catch(() => ({} as any));
      lastCheckedKeyRef.current = key;

      setFinalizeEligible(!!data?.eligible);
      setFinalizeReasons(Array.isArray(data?.reasons) ? data.reasons : null);
      setOffspringTokenId(
        typeof data?.tokenId === 'number' ? data.tokenId : null
      );
    } catch (e: any) {
      setFinalizeEligible(false);
      setFinalizeReasons([e?.message || 'Finalize check failed']);
    } finally {
      setCheckingFinalize(false);
    }
  };

  // When timer is done, trigger the finalize-check once.
  useEffect(() => {
    if (isActive && timeLeft === '00:00:00') {
      void doFinalizeCheck();
    }
  }, [isActive, timeLeft]);

  // ── Buttons enabled/disabled ───────────────────────────────────────────
  const resetDisabled = isActive || stud.horseIds.length === 0;
  const startDisabled = isActive || !hasTwo || !stud.eligible; // stud.eligible from preflight in context
  const finishDisabled = !isActive || !(timeLeft === '00:00:00' && finalizeEligible);

  const imgPath = (h: Horse, hovered: boolean) =>
    `/assets/game/breeding/stable-horses/right/${h.profile.type_horse_slug}/${h.profile.name_slug}-${hovered ? 'hover' : 'regular'}.gif`;

  const handleActivate = () => {
    if (isActive) {
      console.log(`Stud ${studId} is being used (active breeding).`);
      return;
    }
    onOpen?.(studId);
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (resetDisabled) return;
    clearSlot(studId);
    setSubmitError(null);
    resetFinalizeState();
  };

  const handleStart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (startDisabled) return;
    setSubmitError(null);

    const [a, b] = stud.horseIds.map(String);

    try {
      const res = await fetch(`${process.env.API_URL}/user/breed`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, b }),
      });

      let data: any = null;
      try { data = await res.json(); } catch { /* no body */ }

      if (res.ok) {
        console.log('✅ Breeding has started.', data);
        clearSlot(studId);
        await loadActiveBreeds();
        updateBalance();
        resetFinalizeState();
      } else {
        const msg = (data && (data.message || data.error || JSON.stringify(data))) || `HTTP ${res.status}`;
        setSubmitError(msg);
        console.error('❌ Start breeding failed:', msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Network error';
      setSubmitError(msg);
      console.error('❌ Start breeding failed:', msg);
    }
  };

  // New offspring modal state
  const [showOffspring, setShowOffspring] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null);

  const handleFinish = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!isActive) return;

    // Safety: if timer done but we haven't enabled yet, force a check
    if (timeLeft === '00:00:00' && !finalizeEligible) {
      await doFinalizeCheck();
      if (!finalizeEligible) return; // still not eligible
    }

    const [a, b] = stud.horseIds.map(String);

    try {
      const res = await fetch(`${process.env.API_URL}/user/finalize-breed`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a, b }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (res.ok) {
        const mintedId: number | null =
          data?.mintRequest?.tokenId ??
          offspringTokenId ??
          null;

        console.log('✅ Breeding finalized.', data);

        await loadActiveBreeds(); // refresh occupied/available studs
        clearSlot(studId);       // clear any local picks on the slot

        if (mintedId != null) {
          setMintedTokenId(mintedId);
          setShowOffspring(true);
        }
        // Clear error state
        setSubmitError(null);
        resetFinalizeState();
      } else {
        const msg = (data && (data.message || data.error || JSON.stringify(data))) || `HTTP ${res.status}`;
        setSubmitError(msg);
        console.error('❌ Finalize breeding failed:', msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Network error';
      setSubmitError(msg);
      console.error('❌ Finalize breeding failed:', msg);
    }
  };

  // Compose overlay errors (red)
  const overlayErrors: string[] = [];
  if (hasTwo && !stud.eligible && stud.reasons?.length) {
    overlayErrors.push(...stud.reasons);
  }
  if (timeLeft === '00:00:00' && !finalizeEligible && finalizeReasons?.length) {
    overlayErrors.push(...finalizeReasons);
  }
  if (submitError) overlayErrors.push(submitError);

  return (
    <>
      <div
        className={styles.studCard}
        data-index={index}
        role="button"
        tabIndex={0}
        aria-label={`Breeding stud ${studId}`}
        onClick={handleActivate}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleActivate(); } }}
      >
        <div className={styles.bg} />

        {/* NON-INTRUSIVE ERROR OVERLAY (top) */}
        {overlayErrors.length > 0 && (
          <div className={styles.errorOverlay} aria-live="polite">
            {overlayErrors.length === 1 ? (
              <span>{overlayErrors[0]}</span>
            ) : (
              <ul>{overlayErrors.map((m, i) => <li key={i}>{m}</li>)}</ul>
            )}
          </div>
        )}

        {/* horses safe area */}
        <div className={styles.horseSafeArea}>
          {picked.length === 1 && (
            <div className={`${styles.horseWrap} ${styles.single}`}>
              <img
                className={styles.horseImg}
                src={imgPath(picked[0], false)}
                onMouseOver={(e) => (e.currentTarget.src = imgPath(picked[0], true))}
                onMouseOut={(e) => (e.currentTarget.src = imgPath(picked[0], false))}
                alt={`Horse #${picked[0].id}`}
              />
              <div className={styles.horseLabel}>
                <span className={styles.horseIdBadge}>#{picked[0].id}</span>
                <span className={styles.horseName}>
                  {(picked[0].profile.nickname?.trim()?.length
                    ? picked[0].profile.nickname
                    : picked[0].profile.name) || ''}
                </span>
              </div>
            </div>
          )}

          {picked.length === 2 && (
            <div className={styles.horsePair}>
              {picked.map((h, i) => (
                <div key={h.id} className={styles.horseWrap}>
                  <img
                    className={styles.horseImg}
                    src={imgPath(h, false)}
                    onMouseOver={(e) => (e.currentTarget.src = imgPath(h, true))}
                    onMouseOut={(e) => (e.currentTarget.src = imgPath(h, false))}
                    alt={`Horse #${h.id}`}
                  />
                  <div className={styles.horseLabel}>
                    <span className={styles.horseName}>#{h.id}</span>
                    {/* <span className={styles.horseName}>
                      {(h.profile.nickname?.trim()?.length
                        ? h.profile.nickname
                        : h.profile.name) || ''}
                    </span> */}
                  </div>
                </div>
              ))}

              {/* 💗 only show while this stud is actively breeding */}
              {isActive && (
                <img
                  className={styles.heartOverlay}
                  src="/assets/game/breeding/heat.gif"
                  alt="Breeding"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>

        {/* bottom-right UI */}
        <div className={styles.safeArea}>
          <div className={styles.actions}>
            {/* LEFT side: timer + costs */}
            {stud.active && <div className={styles.timer}>⏱ {timeLeft}{checkingFinalize && timeLeft === '00:00:00' ? ' • checking…' : ''}</div>}

            {stud.costs && (
              <div className={styles.costs}>
                <span className={styles.costItem}>
                  <img src={wronIcon.src} alt="WRON" /> {stud.costs.ronCost}
                </span>
                <span className={styles.costItem}>
                  <img src={phorseToken.src} alt="PHORSE" /> {stud.costs.phorseCost}
                </span>
              </div>
            )}

            {/* RIGHT side: reset icon + buttons */}
            <button
              className={`${styles.iconBtn} ${styles.resetIcon}`}
              onClick={handleReset}
              disabled={resetDisabled}
              aria-label="Reset pair"
              title="Reset pair"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12a9 9 0 0 1-9 9 9 9 0 1 1 6.36-15.36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3v6h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              className={`${styles.btn} ${styles.startBtn} ${startDisabled ? styles.disabled : ''}`}
              onClick={handleStart}
              disabled={startDisabled}
            >
              Start Breeding
            </button>

            <button
              className={`${styles.btn} ${styles.finishBtn} ${finishDisabled ? styles.disabled : ''}`}
              onClick={handleFinish}
              disabled={finishDisabled}
            >
              Finish Breeding
            </button>
          </div>
        </div>
      </div>

      {/* New Offspring modal */}
      {showOffspring && mintedTokenId != null && (
        <NewHorseModal
          tokenId={mintedTokenId}
          onClose={() => setShowOffspring(false)}
        />
      )}
    </>
  );
};

export default BreedingStud;
