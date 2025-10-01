import React, { useEffect, useMemo, useState } from 'react';
import styles from './styles.module.scss';
import type { Horse } from '@/components/game/Stables/types/horse'; // same shape you use for modals
import SingleStable from './SingleStable';
import StableHorsesModal from '@/components/game/Modals/StableHorsesModal';

type Props = {
    horses: Horse[];
    reloadHorses: () => Promise<void>;
};

type StableRow = {
    tokenId: string;
    level: number;
};

export default function StableMobile({ horses, reloadHorses }: Props) {
    const [row, setRow] = useState<StableRow | null>(null);
    const [openHorses, setOpenHorses] = useState<{ open: boolean; tokenId: string | null }>({ open: false, tokenId: null });

    // Load the single stable for this user
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch(`${process.env.API_URL}/stable/blockchain`, { credentials: 'include' });
                const data = await res.json().catch(() => ([]));
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const first = Array.isArray(data) && data.length ? data[0] : null;
                if (first && !cancelled) setRow({ tokenId: String(first.tokenId), level: Number(first.level) });
            } catch (e) {
                if (!cancelled) setRow(null);
            }
        };
        void load();
        return () => { cancelled = true; };
    }, []);

    React.useEffect(() => {
        let cancelled = false;

        const fetchOnce = async () => {
            if (!cancelled) {
                // fetch logic here (only runs if still mounted)
                // e.g. await loadStableStatus();
            }
        };

        void fetchOnce(); // initial
        const id = window.setInterval(() => { void fetchOnce(); }, 10_000);

        return () => {
            cancelled = true;
            window.clearInterval(id);
        };
    }, []);

    const modalTokenId = openHorses.tokenId ?? (row?.tokenId ?? null);

    return (
        <div className={styles.mobileHost}>
            {row ? (
                <SingleStable
                    tokenId={row.tokenId}
                    level={row.level}
                    onOpenHorses={(tid) => setOpenHorses({ open: true, tokenId: tid })}
                    onUpgraded={(lv) => setRow((r) => (r ? { ...r, level: lv } : r))}
                />
            ) : (
                <div className={styles.loadingBox}>Loading your stable…</div>
            )}

            {openHorses.open && modalTokenId && (
                <StableHorsesModal
                    status={openHorses.open}
                    stableTokenId={modalTokenId}
                    horses={horses}
                    onClose={() => setOpenHorses({ open: false, tokenId: null })}
                    reloadHorses={reloadHorses}
                />
            )}
        </div>
    );
}
