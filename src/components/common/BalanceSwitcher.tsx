// src/components/common/BalanceSwitcher.tsx
import React from 'react';
import Image, { StaticImageData } from 'next/image';

type BalanceKey = 'PHORSE' | 'MEDALS' | 'WRON' | 'SHARDS';

export type BalanceItem = {
  key: BalanceKey;
  value: number | undefined | null;
  decimals?: number;        // default 0
  icon: StaticImageData | string;
  iconW: number;
  iconH: number;
  alt: string;
  id: string;               // e.g. 'phorse-balance'
};

type ClassNames = {
  container?: string;       // wrapper around the switcher (positioning, etc.)
  button?: string;          // the clickable button
  dropdown?: string;        // dropdown container
  row?: string;             // each currency row
  chevUp?: string;          // up chevron class
  chevDown?: string;        // down chevron class
};

interface Props {
  balances: BalanceItem[];
  /**
   * Which currency to show if no cookie exists or cookie is invalid.
   * Example: 'PHORSE' for primary, 'SHARDS' for secondary.
   * Default: 'PHORSE'
   */
  initialKey?: BalanceKey;
  /**
   * Unique cookie key per switcher instance.
   * Example: 'balances:primary' and 'balances:secondary'
   * Default: 'selectedCurrency'
   */
  cookieKey?: string;
  classes: ClassNames;
  buttonAriaLabel?: string;
}

const formatNum = (n: number | undefined | null, decimals = 0) =>
  (n ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const writeCookie = (name: string, value: string, days = 180) => {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
};

const BalanceSwitcher: React.FC<Props> = ({
  balances,
  initialKey = 'PHORSE',
  cookieKey = 'selectedCurrency',
  classes,
  buttonAriaLabel = 'Open balances',
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);

  // decide initial selection
  const cookieSel = (readCookie(cookieKey) as BalanceKey | null);
  const hasCookieSel = cookieSel && balances.some(b => b.key === cookieSel);
  const safeInitial = (hasCookieSel ? cookieSel : initialKey);

  const [selected, setSelected] = React.useState<BalanceKey>(safeInitial);

  // keep selection in sync if cookie changes dynamically (rare)
  React.useEffect(() => {
    const c = readCookie(cookieKey) as BalanceKey | null;
    if (c && balances.some(b => b.key === c) && c !== selected) {
      setSelected(c);
    }
  }, [cookieKey]);

  // close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const selectedItem = balances.find(b => b.key === selected) ?? balances[0];

  const onPick = (key: BalanceKey) => {
    setSelected(key);
    writeCookie(cookieKey, key);
    setOpen(false);
  };

  return (
    <div className={classes.container} ref={containerRef}>
      <button
        className={classes.button}
        onClick={() => setOpen(s => !s)}
        aria-label={buttonAriaLabel}
      >
        {selectedItem && (
          <>
            <Image
              src={selectedItem.icon}
              width={selectedItem.iconW}
              height={selectedItem.iconH}
              alt={selectedItem.alt}
            />
            <span id={selectedItem.id}>
              {formatNum(selectedItem.value, selectedItem.decimals ?? 0)}
            </span>
            <i className={open ? classes.chevUp : classes.chevDown} aria-hidden />
          </>
        )}
      </button>

      {open && (
        <div className={classes.dropdown}>
          {balances.map(b => (
            <div
              key={b.key}
              className={classes.row}
              onClick={() => onPick(b.key)}
              role="button"
              tabIndex={0}
            >
              <Image src={b.icon} width={b.iconW} height={b.iconH} alt={b.alt} />
              <span id={b.id}>{formatNum(b.value, b.decimals ?? 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BalanceSwitcher;
