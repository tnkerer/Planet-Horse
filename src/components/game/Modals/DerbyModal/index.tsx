import React, {
    Dispatch,
    SetStateAction,
    useEffect,
    useMemo,
    useState,
    useCallback,
} from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import close from '@/assets/game/pop-up/fechar.png';
import ErrorModal from '../ErrorModal';
import InfoModal from '../InfoModal';
import { itemModifiers } from '@/utils/constants/items';
import { useUser } from '@/contexts/UserContext';
import type { Horse } from '@/domain/models/Horse';
import DerbyAdminPanel from '../DerbyAdminPanel';
import ReadOnlySingleHorse from '../ReadOnlySingleHorse';
import type { ReadOnlyHorse } from '@/domain/models/ReadOnlyHorse';

interface Props {
    status: boolean;
    setVisible: Dispatch<SetStateAction<boolean>>;
    horses: Horse[]; // domain Horse list (same as BreedingModal expects)
    reloadHorses?: () => Promise<void>;
}

type DerbyStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'PENDING';

interface DerbySummary {
    id: string;
    name: string;
    description?: string | null;
    status: DerbyStatus;
    registrationOpensAt: string;
    startsAt: string;
    maxMmr?: number | null;
    maxParticipants?: number | null;
    wronEntryFee: number;
    phorseEntryFee: number;
    wronPayoutPercent: number;
    pctFirst?: number;
    pctSecond?: number;
    pctThird?: number;
    allowedRarities: string[];
    totalEntries?: number;
    createdAt?: string;
}

interface DerbyEntry {
    id: string;
    raceId: string;
    userId: string;
    horseId: string;
    mmrAtEntry: number;
    isActive: boolean;
    createdAt: string;
    horse: {
        id: string;
        tokenId: string;
        name: string;
        nickname?: string | null;
        rarity: string;
        mmr?: number;
        currentPower: number;
        currentSprint: number;
        currentSpeed: number;
        items?: Array<{ name: string }>;
        profile?: {
            type_horse_slug: string;
            name_slug: string;
            name: string;
            nickname?: string | null;
        };
    };
    user: {
        id: string;
        wallet: string;
        discordTag: string;
    };
}

interface DerbyHistoryRow {
    id: string;
    raceId: string;
    horseId: string;
    userId: string;
    position: number;
    mmrBefore: number;
    mmrAfter: number;
    wronPrize: number;
    phorseBurned: number;
    createdAt: string;
    horse?: DerbyEntry['horse'];
    user?: {
        id: string;
        wallet: string;
        discordTag?: string | null;
    };
}


interface DerbyDetails extends DerbySummary {
    entries?: DerbyEntry[];
    history?: DerbyHistoryRow[];
}

interface HorseOdds {
    horseId: string;
    totalStaked: number;
    oddsMultiplier: number | null;
    userStake?: number;
    userPotentialPayout?: number;
}

interface DerbyOddsResponse {
    raceId: string;
    totalStaked: number;
    poolAmount: number;
    horses: HorseOdds[];
}



type Mode = 'list' | 'details' | 'selectHorse' | 'confirmEntry';

const rarityNormalize = (r: string | undefined | null) =>
    (r || '').trim().toLowerCase();

const DerbyModal: React.FC<Props> = ({
    status,
    setVisible,
    horses,
    reloadHorses,
}) => {
    const [derbies, setDerbies] = useState<DerbySummary[]>([]);
    const [selectedDerby, setSelectedDerby] = useState<DerbyDetails | null>(null);
    const [mode, setMode] = useState<Mode>('list');

    const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

    const [displayedText, setDisplayedText] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { phorse, wron, updateBalance, userAddress } = useUser() as any;

    const [odds, setOdds] = useState<DerbyOddsResponse | null>(null);
    const [bettingEntry, setBettingEntry] = useState<DerbyEntry | null>(null);
    const [betAmount, setBetAmount] = useState<number>(10); // default 10 WRON
    const [betLoading, setBetLoading] = useState(false);

    const [viewHorse, setViewHorse] = useState<ReadOnlyHorse | null>(null);
    const [viewHorseLoading, setViewHorseLoading] = useState(false);

    const closeViewHorse = () => setViewHorse(null);

    const openViewHorse = async (horseId: string) => {
        try {
            setViewHorseLoading(true);
            setErrorMessage(null);

            const res = await fetch(
                `${process.env.API_URL}/horses/public/${horseId}`,
                {
                    credentials: 'include',
                },
            );

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }

            const data = (await res.json()) as ReadOnlyHorse;
            setViewHorse(data);
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to load horse data.');
        } finally {
            setViewHorseLoading(false);
        }
    };

    // Normalized wallet for comparisons
    const currentWallet = (userAddress || '').toLowerCase();

    const handleBackToList = () => {
        setSelectedDerby(null);
        setOdds(null);
        setMode('list');
    };


    const loadDerbyOdds = useCallback(async (id: string) => {
        try {
            const res = await fetch(`${process.env.API_URL}/derby/${id}/odds`, {
                credentials: 'include',
            });
            if (!res.ok) {
                // optional: swallow silently – odds are “nice to have”
                console.error('Failed to load derby odds', res.status);
                return;
            }
            const data = (await res.json()) as DerbyOddsResponse;
            setOdds(data);
        } catch (e) {
            console.error(e);
        }
    }, []);


    // ----- Typing narrative -----
    const fullText = useMemo(() => {
        if (!selectedDerby) {
            return 'Welcome to the Derby Championship! Pick a race to see the rules.';
        }
        if (mode === 'details') {
            if (selectedDerby.status === 'OPEN') {
                return `Derby: ${selectedDerby.name}\nCheck the rules, then select which horse you will send to the track.`;
            }
            if (selectedDerby.status === 'CANCELLED') {
                return `Derby: ${selectedDerby.name} was cancelled because it had fewer than 5 participants.\nEntry fees were refunded to all registered players.`;
            }
            if (selectedDerby.status === 'COMPLETED') {
                return `Derby: ${selectedDerby.name} is over.\nScroll through the results.`;
            }
            return `Derby: ${selectedDerby.name}`;
        }
        if (mode === 'selectHorse') {
            return 'Choose one of your eligible horses below.';
        }
        if (mode === 'confirmEntry' && selectedHorse && selectedDerby) {
            return `You are about to join "${selectedDerby.name}" with horse #${selectedHorse.id}.\nEntry cost: ${selectedDerby.wronEntryFee} WRON and ${selectedDerby.phorseEntryFee} PHORSE.`;
        }
        return 'Welcome to the Derby Championship!';
    }, [mode, selectedDerby, selectedHorse]);


    useEffect(() => {
        if (!status) return;
        setDisplayedText('');
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayedText(fullText.slice(0, i));
            if (i >= fullText.length) {
                clearInterval(timer);
            }
        }, 25);
        return () => clearInterval(timer);
    }, [status, fullText]);

    // ----- Fetch derbies -----
    const loadDerbies = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage(null);
            // You may expose GET /derby (all). If you only have /derby/open,
            // split into 2 calls or adjust here.
            const res = await fetch(`${process.env.API_URL}/derby`, {
                credentials: 'include',
            });
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }
            const data = (await res.json()) as DerbySummary[];
            // Sort: OPEN first, then newest to oldest
            data.sort((a, b) => {
                if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
                if (b.status === 'OPEN' && a.status !== 'OPEN') return 1;
                return (
                    new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
                );
            });
            setDerbies(data);
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to load derbies');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!status) return;
        setMode('list');
        setSelectedDerby(null);
        setSelectedHorse(null);
        void loadDerbies();
    }, [status, loadDerbies]);

    const getHorseOdds = (horseId: string): HorseOdds | undefined => {
        return odds?.horses.find((h) => h.horseId === horseId);
    };




    // ----- Fetch single derby details -----
    const loadDerbyDetails = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setErrorMessage(null);
            const res = await fetch(`${process.env.API_URL}/derby/${id}`, {
                credentials: 'include',
            });
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }
            const data = (await res.json()) as DerbyDetails;
            setSelectedDerby(data);
            setMode('details');

            // load odds (fire and forget or await)
            void loadDerbyOdds(id);
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to load derby details');
        } finally {
            setLoading(false);
        }
    }, [loadDerbyOdds]);

    // ----- Helpers: horse extras & icon -----
    const calcExtras = useCallback((h: Horse) => {
        const itemsArr = (h as any).items ?? [];
        const extra = itemsArr.reduce(
            (acc: { extraPwr: number; extraSpt: number; extraSpd: number }, it: any) => {
                const mod = itemModifiers[it.name];
                if (!mod) return acc;
                acc.extraPwr += mod.extraPwr || 0;
                acc.extraSpt += mod.extraSpt || 0;
                acc.extraSpd += mod.extraSpd || 0;
                return acc;
            },
            { extraPwr: 0, extraSpt: 0, extraSpd: 0 },
        );
        return extra;
    }, []);

    const getHorseBaseStats = (h: Horse) => {
        // Adjust to your Horse shape; here I assume `staty` like elsewhere
        const staty = (h as any).staty ?? {};
        return {
            power: Number(staty.power ?? 0),
            sprint: Number(staty.sprint ?? 0),
            speed: Number(staty.speed ?? 0),
            mmr: Number(staty.mmr ?? 0),
        };
    };

    const imgPath = (h: Horse, hovered: boolean) => {
        // Same strategy as BreedingModal, adjust path if you want derby-specific sprite
        const profile = (h as any).profile ?? {};
        return `/assets/game/breeding/stable-horses/right/${String(profile.type_horse_slug)}/${String(profile.name_slug)}-${hovered ? 'hover' : 'regular'}.gif`;
    };

    // ----- Determine eligibility -----
    const eligibleHorses = useMemo(() => {
        if (!selectedDerby) return [];
        const allowed = selectedDerby.allowedRarities.map(rarityNormalize);
        const hasMmrCap = typeof selectedDerby.maxMmr === 'number' && selectedDerby.maxMmr > 0;

        return horses.filter((h) => {
            const profile = (h as any).profile ?? {};
            const rarity =
                (profile.type_horse as string | undefined) ||
                (profile.type_horse_slug as string | undefined) ||
                '';
            const horseRarity = rarityNormalize(rarity);
            if (!allowed.includes(horseRarity)) return false;

            const { mmr } = getHorseBaseStats(h);
            if (hasMmrCap && mmr > (selectedDerby.maxMmr ?? 0)) return false;

            // You may also restrict by status (e.g. IDLE only) if needed.
            return true;
        });
    }, [horses, selectedDerby, getHorseBaseStats]);

    // ----- Assign horse -----
    const handleJoinDerby = async () => {
        if (!selectedDerby || !selectedHorse) return;
        setLoading(true);
        setErrorMessage(null);
        try {
            const body = {
                // Adjust: if your DerbyService expects DB horse id vs tokenId, switch here
                horseId: String((selectedHorse as any).id),
            };

            const res = await fetch(
                `${process.env.API_URL}/derby/${selectedDerby.id}/assign`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                },
            );

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }

            await updateBalance?.();
            await reloadHorses?.();
            await loadDerbyDetails(selectedDerby.id);
            setMode('details');
            setInfoMessage('Horse successfully registered for the derby!');
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to join derby.');
        } finally {
            setLoading(false);
        }
    };

    const closeBetModal = () => {
        setBettingEntry(null);
        setBetAmount(10);
    };

    const handleConfirmBet = async () => {
        if (!selectedDerby || !bettingEntry) return;

        if (!betAmount || betAmount <= 0) {
            setErrorMessage('Bet amount must be greater than zero.');
            return;
        }

        if (betAmount > wron) {
            setErrorMessage(`You don't have enough WRON to place this bet.`);
            return;
        }

        try {
            setBetLoading(true);
            setErrorMessage(null);

            const res = await fetch(
                `${process.env.API_URL}/derby/${selectedDerby.id}/bet`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        horseId: bettingEntry.horseId,
                        amount: betAmount,
                    }),
                },
            );

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }

            await updateBalance?.();
            await loadDerbyOdds(selectedDerby.id); // refresh odds to show your bet/payout
            setInfoMessage('Bet placed successfully!');
            closeBetModal();
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to place bet.');
        } finally {
            setBetLoading(false);
        }
    };


    // ----- Remove horse (leave derby) -----
    const handleLeaveDerby = async () => {
        if (!selectedDerby) return;
        const derby = selectedDerby;
        if (!derby.entries) return;

        const myEntry = derby.entries.find(
            (e) =>
                e.user?.wallet &&
                e.user.wallet.toLowerCase() === currentWallet &&
                e.isActive,
        );

        if (!myEntry) {
            setErrorMessage('You are not registered in this derby.');
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        try {
            const body = {
                horseId: myEntry.horseId,
            };

            const res = await fetch(
                `${process.env.API_URL}/derby/${derby.id}/remove`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                },
            );

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }

            await updateBalance?.();
            await reloadHorses?.();
            await loadDerbyDetails(derby.id);
            setInfoMessage('Your horse was removed from this derby and entry fees were refunded.');
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to remove horse from derby.');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSpecificHorse = async (horseId: string) => {
        if (!selectedDerby) return;
        const derby = selectedDerby;

        setLoading(true);
        setErrorMessage(null);

        try {
            const body = { horseId };

            const res = await fetch(
                `${process.env.API_URL}/derby/${derby.id}/remove`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                },
            );

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }

            await updateBalance?.();
            await reloadHorses?.();
            await loadDerbyDetails(derby.id);
            setInfoMessage('Your horse was removed from this derby and entry fees were refunded.');
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to remove horse from derby.');
        } finally {
            setLoading(false);
        }
    };


    // ----- Finalize derby -----
    const handleFinalizeDerby = async () => {
        if (!selectedDerby) return;
        setLoading(true);
        setErrorMessage(null);
        try {
            const res = await fetch(
                `${process.env.API_URL}/derby/${selectedDerby.id}/finalize`,
                {
                    method: 'POST',
                    credentials: 'include',
                },
            );

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const err = await res.json();
                    if (err?.message) msg = err.message;
                } catch { }
                throw new Error(msg);
            }

            const data = (await res.json()) as { race: DerbyDetails; history: DerbyHistoryRow[] };
            // You may make your endpoint just return DerbyDetails; adjust here accordingly.
            const merged: DerbyDetails = {
                ...data.race,
                history: data.history,
            };
            setSelectedDerby(merged);
            setMode('details');
            await updateBalance?.();
            await reloadHorses?.();
            setInfoMessage('Derby finalized! Results are now available.');
            await loadDerbies();
        } catch (e: any) {
            console.error(e);
            setErrorMessage(e.message || 'Failed to finalize derby.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setVisible(false);
        setSelectedDerby(null);
        setSelectedHorse(null);
        setBettingEntry(null);
        setOdds(null);
        setMode('list');
    };

    const now = Date.now();
    const canFinalize =
        selectedDerby &&
        selectedDerby.status === 'OPEN' &&
        new Date(selectedDerby.startsAt).getTime() <= now;

    const canLeave =
        selectedDerby &&
        selectedDerby.status === 'OPEN' &&
        selectedDerby.entries &&
        selectedDerby.entries.some(
            (e) =>
                e.user?.wallet &&
                e.user.wallet.toLowerCase() === currentWallet &&
                e.isActive,
        ) &&
        new Date(selectedDerby.startsAt).getTime() - now > 30 * 60 * 1000;

    // -------- Render helpers for UI --------
    const renderDerbyList = () => {
        const last10 = [...derbies]
            .sort((a, b) => {
                const aOpen = a.status === 'OPEN';
                const bOpen = b.status === 'OPEN';

                // 1) OPEN first
                if (aOpen && !bOpen) return -1;
                if (!aOpen && bOpen) return 1;

                const aStart = new Date(a.startsAt).getTime();
                const bStart = new Date(b.startsAt).getTime();

                // 2) Among OPEN derbies: earlier start time first (closer to happening)
                if (aOpen && bOpen) {
                    return aStart - bStart; // ascending
                }

                // 3) Among non-open derbies, keep newest first (or swap to aStart - bStart if you prefer oldest first)
                return bStart - aStart;
            })
            .slice(0, 200);


        return (
            <div className={`${styles.derbyList} ${styles.scrollArea}`}>
                {last10.map((d) => {
                    const isOpen = d.status === 'OPEN';
                    const starts = new Date(d.startsAt);
                    const regOpens = new Date(d.registrationOpensAt);
                    const startsStr = starts.toLocaleString();
                    const regStr = regOpens.toLocaleString();

                    return (
                        <div key={d.id} className={styles.derbyCard}>
                            <div className={styles.derbyHeader}>
                                <span className={styles.derbyTitle}>{d.name}</span>
                                <span
                                    className={`${styles.statusPill} ${isOpen ? styles.statusOpen : styles.statusClosed
                                        }`}
                                >
                                    {d.status}
                                </span>
                            </div>

                            {d.description && (
                                <div className={styles.derbyDescription}>{d.description}</div>
                            )}

                            <div className={styles.derbyMeta}>
                                <div>
                                    <span className={styles.metaLabel}>Registration:</span>{' '}
                                    <span className={styles.metaValue}>{regStr}</span>
                                </div>
                                <div>
                                    <span className={styles.metaLabel}>Starts:</span>{' '}
                                    <span className={styles.metaValue}>{startsStr}</span>
                                </div>
                                <div>
                                    <span className={styles.metaLabel}>Rarities:</span>{' '}
                                    <span className={styles.metaValue}>
                                        {d.allowedRarities.join(', ')}
                                    </span>
                                </div>
                                <div>
                                    <span className={styles.metaLabel}>Entry:</span>{' '}
                                    <span className={styles.metaValue}>
                                        {d.wronEntryFee} WRON + {d.phorseEntryFee} PHORSE
                                    </span>
                                </div>
                            </div>

                            {d.status === 'CANCELLED' && (
                                <div className={styles.cancelBadgeSmall}>
                                    Cancelled – fewer than 5 participants (fees refunded)
                                </div>
                            )}

                            <div className={styles.derbyActions}>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={async () => loadDerbyDetails(d.id)}
                                >
                                    View
                                </button>
                                {isOpen && (
                                    <button
                                        className={styles.secondaryBtn}
                                        onClick={() => {
                                            void loadDerbyDetails(d.id);
                                        }}
                                    >
                                        Join
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {last10.length === 0 && !loading && (
                    <div className={styles.emptyState}>
                        No derbies available yet. Check back soon!
                    </div>
                )}
            </div>
        );
    };

    const renderParticipants = () => {
        if (!selectedDerby || !selectedDerby.entries || selectedDerby.entries.length === 0) {
            return null;
        }

        const d = selectedDerby;

        return (
            <div className={styles.participantsSection}>
                <h3 className={styles.sectionTitle}>Current Participants</h3>
                <div className={`${styles.horseTableWrapper} ${styles.scrollArea}`}>
                    <table className={styles.horseTable}>
                        <thead>
                            <tr>
                                <th>Horse</th>
                                <th>Bet</th>
                                <th>Owner</th>
                                <th>MMR</th>
                                <th>View Horse</th>
                                <th></th>
                            </tr>
                        </thead>

                        <tbody>
                            {d.entries.map((entry) => {
                                const isMe =
                                    !!entry.user?.wallet &&
                                    entry.user.wallet.toLowerCase() === currentWallet &&
                                    entry.isActive;

                                const horse = entry.horse;
                                const displayName =
                                    horse.nickname && horse.nickname.trim().length > 0
                                        ? horse.nickname
                                        : `#${horse.tokenId}`;

                                const ownerShort = entry.user.discordTag
                                    ? `${entry.user.discordTag}`
                                    : `${entry.user.wallet.slice(0, 6)}...${entry.user.wallet.slice(-4)}`;

                                const horseOdds = getHorseOdds(entry.horseId);
                                const userStake = horseOdds?.userStake ?? 0;
                                const hasUserBet = userStake > 0;
                                const userPayout =
                                    horseOdds?.userPotentialPayout ??
                                    (horseOdds?.oddsMultiplier
                                        ? userStake * horseOdds.oddsMultiplier
                                        : 0);

                                return (
                                    <tr key={entry.id}>
                                        <td>{displayName}</td>

                                        {/* BET column (unchanged logic) */}
                                        <td>
                                            {hasUserBet ? (
                                                <div className={styles.betInfoCell}>
                                                    <div>My bet: {userStake.toFixed(2)} WRON</div>
                                                    {userPayout > 0 && (
                                                        <div className={styles.betOddsSmall}>
                                                            Payout if wins: {userPayout.toFixed(2)} WRON
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    className={styles.secondaryBtn}
                                                    disabled={loading}
                                                    onClick={() => {
                                                        setBettingEntry(entry);
                                                        setBetAmount(10);
                                                    }}
                                                >
                                                    BET
                                                </button>
                                            )}
                                        </td>

                                        <td>{ownerShort}</td>
                                        <td>{horse.mmr ?? entry.mmrAtEntry}</td>

                                        {/* NEW: View Horse column */}
                                        <td>
                                            <button
                                                className={styles.secondaryBtn}
                                                disabled={viewHorseLoading}
                                                onClick={async () => openViewHorse(entry.horseId)}
                                            >
                                                View
                                            </button>
                                        </td>

                                        {/* Quit column */}
                                        <td>
                                            {isMe && (
                                                <button
                                                    className={styles.secondaryBtn}
                                                    disabled={loading}
                                                    onClick={async () => handleLeaveSpecificHorse(entry.horseId)}
                                                >
                                                    Quit Derby
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                    </table>
                </div>
            </div>
        );
    };

    const renderDerbyDetails = () => {
        if (!selectedDerby) return null;
        const d = selectedDerby;
        const isOpen = d.status === 'OPEN';

        const myActiveEntry =
            d.entries?.find(
                (e) =>
                    e.user?.wallet &&
                    e.user.wallet.toLowerCase() === currentWallet &&
                    e.isActive,
            ) ?? null;

        const myHorseToken =
            myActiveEntry?.horse?.tokenId ?? myActiveEntry?.horseId ?? null;


        const starts = new Date(d.startsAt);
        const regOpens = new Date(d.registrationOpensAt);
        const startsStr = starts.toLocaleString();
        const regStr = regOpens.toLocaleString();

        const entriesCount = d.entries?.length ?? d.totalEntries ?? 0;

        // For completed races, show leaderboard
        const historySorted = (d.history ?? []).slice().sort((a, b) => a.position - b.position);

        const myResults = historySorted.filter(
            (row) =>
                row.user?.wallet &&
                row.user.wallet.toLowerCase() === currentWallet,
        );

        const totalMyPrize = myResults.reduce((sum, row) => sum + (row.wronPrize || 0), 0);

        return (
            <div className={`${styles.derbyDetails} ${styles.scrollArea}`}>
                <div className={styles.detailsHeader}>
                    <h2 className={styles.derbyTitle}>{d.name}</h2>
                    <span
                        className={`${styles.statusPill} ${isOpen ? styles.statusOpen : styles.statusClosed
                            }`}
                    >
                        {d.status}
                    </span>
                </div>

                {d.description && (
                    <p className={styles.derbyDescription}>{d.description}</p>
                )}

                <div className={styles.detailsGrid}>
                    <div>
                        <span className={styles.metaLabel}>Registration:</span>{' '}
                        <span className={styles.metaValue}>{regStr}</span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Starts:</span>{' '}
                        <span className={styles.metaValue}>{startsStr}</span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Max MMR:</span>{' '}
                        <span className={styles.metaValue}>
                            {d.maxMmr ? d.maxMmr : 'No limit'}
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Rarities:</span>{' '}
                        <span className={styles.metaValue}>
                            {d.allowedRarities.join(', ')}
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Entry:</span>{' '}
                        <span className={styles.metaValue}>
                            {d.wronEntryFee} WRON + {d.phorseEntryFee} PHORSE
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Participants:</span>{' '}
                        <span className={styles.metaValue}>
                            {entriesCount}
                            {d.maxParticipants ? ` / ${d.maxParticipants}` : ''}
                        </span>
                    </div>
                </div>

                {d.status === 'CANCELLED' && historySorted.length === 0 && (
                    <div className={styles.cancelNotice}>
                        This derby was cancelled because it had fewer than 5 participants.
                        All entry fees were refunded to the registered players.
                    </div>
                )}

                {isOpen && renderParticipants()}

                {isOpen && (
                    <div className={styles.detailsActions}>
                        <button
                            className={styles.primaryBtn}
                            onClick={() => {
                                setMode('selectHorse');
                                setSelectedHorse(null);
                            }}
                        >
                            {myActiveEntry ? 'Change Horse' : 'Join Derby'}
                        </button>

                        {canLeave && (
                            <button
                                className={styles.secondaryBtn}
                                onClick={async () => handleLeaveDerby()}
                            >
                                Leave Derby
                            </button>
                        )}

                        {canFinalize && (
                            <button
                                className={styles.dangerBtn}
                                onClick={async () => handleFinalizeDerby()}
                            >
                                Finalize Derby
                            </button>
                        )}

                        {myActiveEntry && (
                            <div className={styles.infoHint}>
                                You are currently registered with horse #{myHorseToken}.
                            </div>
                        )}
                    </div>
                )}

                {!isOpen && historySorted.length > 0 && (
                    <div className={styles.resultsSection}>
                        <h3 className={styles.sectionTitle}>Results</h3>

                        {/* NEW: Per-user outcome banner */}
                        {myResults.length > 0 && (
                            <div
                                className={`${styles.resultOutcome} ${totalMyPrize > 0 ? styles.resultOutcomeWin : styles.resultOutcomeLose
                                    }`}
                            >
                                {totalMyPrize > 0 ? (
                                    <>
                                        You <strong>won {totalMyPrize} WRON</strong> in this derby. 🎉
                                    </>
                                ) : (
                                    <>
                                        You <strong>did not win any WRON</strong> in this derby.
                                    </>
                                )}
                            </div>
                        )}

                        <div className={`${styles.resultsTableWrapper} ${styles.scrollArea}`}>
                            <table className={styles.resultsTable}>
                                <thead>
                                    <tr>
                                        <th>POS</th>
                                        <th>Horse</th>
                                        <th>Owner</th>
                                        <th>MMR</th>
                                        <th>Δ MMR</th>
                                        <th>WRON Prize</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historySorted.map((row) => {
                                        const isMe =
                                            !!row.user?.wallet &&
                                            row.user.wallet.toLowerCase() === currentWallet;
                                        const mmrDelta = row.mmrAfter - row.mmrBefore;

                                        const ownerDisplay =
                                            row.user?.discordTag && row.user.discordTag.trim().length > 0
                                                ? row.user.discordTag
                                                : row.user?.wallet
                                                    ? `${row.user.wallet.slice(0, 6)}...${row.user.wallet.slice(-4)}`
                                                    : '';

                                        const horseLabel = row.horse
                                            ? row.horse.nickname || `#${row.horse.tokenId}`
                                            : `#${row.horseId}`;

                                        return (
                                            <tr
                                                key={row.id}
                                                className={isMe ? styles.highlightRow : undefined}
                                            >
                                                <td>{row.position}</td>
                                                <td>{horseLabel}</td>
                                                <td>{ownerDisplay}</td>
                                                <td>{row.mmrAfter}</td>
                                                <td
                                                    className={
                                                        mmrDelta > 0
                                                            ? styles.mmrUp
                                                            : mmrDelta < 0
                                                                ? styles.mmrDown
                                                                : ''
                                                    }
                                                >
                                                    {mmrDelta > 0 ? `+${mmrDelta}` : mmrDelta}
                                                </td>
                                                <td>{row.wronPrize}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className={styles.modalFooter}>
                    <button
                        className={styles.secondaryBtn}
                        onClick={() => {
                            setSelectedDerby(null);
                            setMode('list');
                        }}
                    >
                        ‹ Back to Derbies
                    </button>
                </div>
            </div>
        );
    };

    const renderHorseSelection = () => {
        if (!selectedDerby) return null;

        return (
            <div className={styles.horseSelect}>
                <h3 className={styles.sectionTitle}>Choose your horse</h3>

                <div className={`${styles.horseTableWrapper} ${styles.scrollArea}`}>
                    <table className={styles.horseTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Icon</th>
                                <th>Name</th>
                                <th>Power</th>
                                <th>Sprint</th>
                                <th>Speed</th>
                                <th>MMR</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {eligibleHorses.map((h) => {
                                const { extraPwr, extraSpt, extraSpd } = calcExtras(h);
                                const base = getHorseBaseStats(h);

                                const power = base.power + extraPwr;
                                const sprint = base.sprint + extraSpt;
                                const speed = base.speed + extraSpd;

                                const profile = (h as any).profile ?? {};
                                const displayName =
                                    (profile.nickname && profile.nickname.trim().length > 0
                                        ? profile.nickname
                                        : profile.name) || `Horse #${h.id}`;

                                return (
                                    <tr key={(h as any).id}>
                                        <td>#{(h as any).id}</td>
                                        <td>
                                            <div className={styles.iconCell}>
                                                <img
                                                    src={imgPath(h, false)}
                                                    alt={displayName}
                                                    className={styles.horseIcon}
                                                    onMouseOver={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = imgPath(h, true);
                                                    }}
                                                    onMouseOut={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = imgPath(h, false);
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td>{displayName}</td>
                                        <td>
                                            {power}
                                            {extraPwr > 0 && (
                                                <span className={styles.bonusStat}>+{extraPwr}</span>
                                            )}
                                        </td>
                                        <td>
                                            {sprint}
                                            {extraSpt > 0 && (
                                                <span className={styles.bonusStat}>+{extraSpt}</span>
                                            )}
                                        </td>
                                        <td>
                                            {speed}
                                            {extraSpd > 0 && (
                                                <span className={styles.bonusStat}>+{extraSpd}</span>
                                            )}
                                        </td>
                                        <td>{base.mmr}</td>
                                        <td>
                                            <button
                                                className={styles.primaryBtn}
                                                onClick={() => {
                                                    setSelectedHorse(h);
                                                    setMode('confirmEntry');
                                                }}
                                            >
                                                Race
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {eligibleHorses.length === 0 && (
                                <tr>
                                    <td colSpan={8} className={styles.emptyState}>
                                        You currently have no horses eligible for this derby.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.horseSelectActions}>
                    <button
                        className={styles.secondaryBtn}
                        onClick={() => setMode('details')}
                    >
                        Back
                    </button>
                </div>
            </div>
        );
    };

    const renderConfirmEntry = () => {
        if (!selectedDerby || !selectedHorse) return null;
        const d = selectedDerby;
        const { extraPwr, extraSpt, extraSpd } = calcExtras(selectedHorse);
        const base = getHorseBaseStats(selectedHorse);
        const totalCostWron = d.wronEntryFee;
        const totalCostPhorse = d.phorseEntryFee;

        const notEnoughWron = wron < totalCostWron;
        const notEnoughPhorse = phorse < totalCostPhorse;

        return (
            <div className={`${styles.confirmBox} ${styles.scrollArea}`}>
                <h3 className={styles.sectionTitle}>Confirm entry</h3>

                <p className={styles.confirmText}>
                    You are about to register horse #{(selectedHorse as any).id} in{' '}
                    <b>{d.name}</b>.
                </p>

                <div className={styles.confirmStats}>
                    <div>
                        <span className={styles.metaLabel}>Power:</span>{' '}
                        <span className={styles.metaValue}>
                            {base.power + extraPwr}
                            {extraPwr > 0 && (
                                <span className={styles.bonusStat}>+{extraPwr}</span>
                            )}
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Sprint:</span>{' '}
                        <span className={styles.metaValue}>
                            {base.sprint + extraSpt}
                            {extraSpt > 0 && (
                                <span className={styles.bonusStat}>+{extraSpt}</span>
                            )}
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Speed:</span>{' '}
                        <span className={styles.metaValue}>
                            {base.speed + extraSpd}
                            {extraSpd > 0 && (
                                <span className={styles.bonusStat}>+{extraSpd}</span>
                            )}
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>MMR:</span>{' '}
                        <span className={styles.metaValue}>{base.mmr}</span>
                    </div>
                </div>

                <div className={styles.costBox}>
                    <div>
                        <span className={styles.metaLabel}>WRON Cost:</span>{' '}
                        <span
                            className={`${styles.metaValue} ${notEnoughWron ? styles.costInsufficient : ''
                                }`}
                        >
                            {totalCostWron} (You: {wron})
                        </span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>PHORSE Cost:</span>{' '}
                        <span
                            className={`${styles.metaValue} ${notEnoughPhorse ? styles.costInsufficient : ''
                                }`}
                        >
                            {totalCostPhorse} (You: {phorse})
                        </span>
                    </div>
                </div>

                <div className={styles.confirmActions}>
                    <button
                        className={styles.secondaryBtn}
                        onClick={() => setMode('selectHorse')}
                        disabled={loading}
                    >
                        Back
                    </button>
                    <button
                        className={styles.primaryBtn}
                        disabled={loading || notEnoughWron || notEnoughPhorse}
                        onClick={async () => handleJoinDerby()}
                    >
                        {loading ? 'Joining...' : 'Confirm'}
                    </button>
                </div>

                {(notEnoughWron || notEnoughPhorse) && (
                    <div className={styles.infoHint}>
                        You don&apos;t have enough balance to join this derby.
                    </div>
                )}
            </div>
        );
    };

    if (!status) return null;

    return (
        <>
            {bettingEntry && selectedDerby && (
                <div className={styles.betModalBackdrop}>
                    <div className={styles.betModal}>
                        <h3 className={styles.sectionTitle}>Place a bet</h3>
                        <p className={styles.betText}>
                            You are betting on{' '}
                            <b>
                                {bettingEntry.horse.nickname && bettingEntry.horse.nickname.trim().length > 0
                                    ? bettingEntry.horse.nickname
                                    : `#${bettingEntry.horse.tokenId}`}
                            </b>{' '}
                            in <b>{selectedDerby.name}</b>.
                        </p>

                        <p className={styles.betText}>
                            Your balance: <b>{wron.toFixed(2)} WRON</b>
                        </p>

                        <label className={styles.betLabel}>
                            Bet amount (WRON):
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className={styles.betInput}
                                disabled={betLoading}
                            />
                        </label>

                        {(() => {
                            const odds = getHorseOdds(bettingEntry.horseId);
                            if (!odds || !odds.oddsMultiplier) return null;
                            const potential = Number(betAmount || 0) * odds.oddsMultiplier;
                            return (
                                <p className={styles.betHint}>
                                    Current pool odds: x{odds.oddsMultiplier.toFixed(2)}.
                                    <br />
                                    If this horse wins, this bet would pay around{' '}
                                    <b>{potential.toFixed(2)} WRON</b>.
                                </p>
                            );
                        })()}

                        <div className={styles.betActions}>
                            <button
                                className={styles.secondaryBtn}
                                onClick={closeBetModal}
                                disabled={betLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.primaryBtn}
                                onClick={handleConfirmBet}
                                disabled={betLoading}
                            >
                                {betLoading ? 'Placing...' : 'Confirm Bet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {errorMessage && (
                <ErrorModal text={errorMessage} onClose={() => setErrorMessage(null)} />
            )}
            {infoMessage && (
                <InfoModal text={infoMessage} onClose={() => setInfoMessage(null)} />
            )}
            {viewHorse && (
                <div className={styles.viewHorseBackdrop}>
                    <div className={styles.viewHorseModal}>
                        <div className={styles.modalClose} onClick={closeViewHorse}>
                            ✕
                        </div>
                        <ReadOnlySingleHorse horse={viewHorse} />
                    </div>
                </div>
            )}

            <DerbyAdminPanel onDerbyCreated={() => console.log("New Derby Created")} />

            <div
                className={`
          ${styles.modalRecovery}
          ${status ? styles.modalActive : styles.modalInactive}
        `}
            >
                <div className={styles.modalFull}>
                    <div
                        className={styles.modalContent}

                    >
                        <div className={styles.modalClose} onClick={handleClose}>
                            <Image src={close} alt="Close" width={30} height={30} />
                        </div>

                        {/* Main content inside box */}
                        <div className={styles.contentInner}>
                            {mode === 'list' && renderDerbyList()}
                            {mode === 'details' && renderDerbyDetails()}
                            {mode === 'selectHorse' && renderHorseSelection()}
                            {mode === 'confirmEntry' && renderConfirmEntry()}
                        </div>
                    </div>

                    {/* Runner character + dialog box */}
                    <div className={styles.dialogWrapper}>
                        <img
                            src="/assets/characters/runner.png"
                            alt="Runner"
                            className={styles.runnerCharacter}
                        />

                        <div className={styles.rpgDialogBox}>
                            <div className={styles.dialogText}>
                                {displayedText}
                                <span className={styles.cursor}>|</span>
                            </div>

                            {/* You could add contextual quick buttons here if you want */}
                            {derbies.length === 0 && mode === 'list' && !loading && (
                                <div className={styles.answerBox}>
                                    <div
                                        className={styles.answerOption}
                                        onClick={async () => loadDerbies()}
                                    >
                                        Refresh
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DerbyModal;
