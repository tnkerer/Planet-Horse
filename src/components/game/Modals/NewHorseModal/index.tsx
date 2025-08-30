import React, { useEffect, useState } from 'react';
import styles from './styles.module.scss';

type Attribute = {
  trait_type: string;
  value: string | number;
  display_type?: string;
};

type Meta = {
  name: string;
  description?: string;
  external_url?: string;
  image: string;
  attributes: Attribute[];
};

interface Props {
  tokenId: number;
  onClose: () => void;
}

const NewHorseModal: React.FC<Props> = ({ tokenId, onClose }) => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://api.planethorse.io/metadata/horse/${tokenId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (alive) setMeta(j);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load metadata');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tokenId]);

  const A = (name: string) => meta?.attributes?.find(a => a.trait_type.toLowerCase() === name.toLowerCase())?.value;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`New horse #${tokenId}`}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <h2 className={styles.title}>{meta?.name ?? `New Horse #${tokenId}`}</h2>

        <div className={styles.content}>
          <div className={styles.imageWrap}>
            {loading ? (
              <div className={styles.skeleton} />
            ) : error ? (
              <div className={styles.errorBox}>{error}</div>
            ) : (
              <img src={meta?.image} alt={meta?.name || `Horse #${tokenId}`} />
            )}
          </div>

          <div className={styles.info}>
            {meta?.description && <p className={styles.desc}>{meta.description}</p>}

            <div className={styles.grid}>
              <div><span className={styles.k}>Rarity:</span> <span className={styles.v}>{A('rarity') ?? '-'}</span></div>
              <div><span className={styles.k}>Gender:</span> <span className={styles.v}>{A('gender') ?? '-'}</span></div>
              <div><span className={styles.k}>Level:</span> <span className={styles.v}>{A('level') ?? '-'}</span></div>
              <div><span className={styles.k}>EXP: </span> <span className={styles.v}>{A('exp') ?? '-'}</span></div>
              <div><span className={styles.k}>Power:</span> <span className={styles.v}>{A('current power') ?? A('base power') ?? '-'}</span></div>
              <div><span className={styles.k}>Sprint:</span> <span className={styles.v}>{A('current sprint') ?? A('base sprint') ?? '-'}</span></div>
              <div><span className={styles.k}>Speed:</span> <span className={styles.v}>{A('current speed') ?? A('base speed') ?? '-'}</span></div>
              <div><span className={styles.k}>Energy:</span> <span className={styles.v}>{A('energy') ?? '-'}</span></div>
              <div><span className={styles.k}>Max Energy:</span> <span className={styles.v}>{A('max energy') ?? '-'}</span></div>
              <div><span className={styles.k}>Gen:</span> <span className={styles.v}>{A('gen') ?? '-'}</span></div>
              <div><span className={styles.k}>Breeding Count:</span> <span className={styles.v}>{A('breeding count') ?? '-'}</span></div>
              <div><span className={styles.k}>Type:</span> <span className={styles.v}>{A('horse type') ?? '-'}</span></div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <span className={styles.token}>Mint Request for Horse Token ID: {tokenId} Placed in the Queue!</span>
          {meta?.external_url && (
            <a href={meta.external_url} target="_blank" rel="noreferrer" className={styles.link}>
              View Project
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewHorseModal;
