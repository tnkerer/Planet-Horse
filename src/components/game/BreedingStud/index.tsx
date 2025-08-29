import React, { useEffect, useMemo, useState } from 'react';
import styles from './styles.module.scss';
import type { Horse } from '../BreedFarm';
import { useBreeding } from '@/contexts/BreedingContext';
import phorseToken from '@/assets/utils/logos/animted-phorse-coin.gif';
import wronIcon from '@/assets/icons/wron.gif';

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
  const stud = studs[studId];


  // resolve picked horse objects for rendering
  const picked = useMemo(() => {
    return stud.horseIds
      .map(id => horses.find(h => h.id === id))
      .filter((h): h is Horse => Boolean(h));
  }, [stud.horseIds, horses]);


  // local submit error (POST /user/breed failures)
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
  const resetDisabled = isActive || stud.horseIds.length === 0;
  const startDisabled = isActive || !hasTwo || !stud.eligible;
  const finishDisabled = !isActive || timeLeft !== '00:00:00';

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
      try { data = await res.json(); } catch { }

      if (res.ok) {
        console.log('✅ Breeding has started.', data);
        clearSlot(studId);
        await loadActiveBreeds();
      } else {
        const msg =
          (data && (data.message || data.error || JSON.stringify(data))) ||
          `HTTP ${res.status}`;
        setSubmitError(msg);
        console.error('❌ Start breeding failed:', msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Network error';
      setSubmitError(msg);
      console.error('❌ Start breeding failed:', msg);
    }
  };

  const handleFinish = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log(`Finish Breeding for stud ${studId} (server id: ${stud.active?.id})`);
  };

  // Compute overlay errors (red) without affecting layout
  const overlayErrors: string[] = [];
  if (hasTwo && !stud.eligible && stud.reasons?.length) {
    overlayErrors.push(...stud.reasons);
  }
  if (submitError) overlayErrors.push(submitError);

  return (
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
          <img
            className={styles.horseSolo}
            src={imgPath(picked[0], false)}
            onMouseOver={(e) => (e.currentTarget.src = imgPath(picked[0], true))}
            onMouseOut={(e) => (e.currentTarget.src = imgPath(picked[0], false))}
            alt={`Horse #${picked[0].id}`}
          />
        )}
        {picked.length === 2 && (
          <div className={styles.horsePair}>
            {picked.map(h => (
              <img
                key={h.id}
                className={styles.horseImg}
                src={imgPath(h, false)}
                onMouseOver={(e) => (e.currentTarget.src = imgPath(h, true))}
                onMouseOut={(e) => (e.currentTarget.src = imgPath(h, false))}
                alt={`Horse #${h.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* bottom-right UI */}
      <div className={styles.safeArea}>
        <div className={styles.actions}>
          {/* LEFT side of the row */}
          {stud.active && <div className={styles.timer}>⏱ {timeLeft}</div>}
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

          {/* RIGHT side (icon + buttons) */}
          <button
            className={`${styles.iconBtn} ${styles.resetIcon}`}
            onClick={handleReset}
            disabled={resetDisabled}
            aria-label="Reset pair"
            title="Reset pair"
          >
            {/* white refresh icon */}
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
  );
};

export default BreedingStud;
