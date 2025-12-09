/* ========================================
 * 🏇 DERBY ADMIN PANEL - RESTRICTED ACCESS
 *
 * Only allowlisted admin wallets can create PvP Derbies.
 * Backend enforces access via /derby/admin/panel + /derby/create
 * ======================================== */

import React, { useState } from 'react';
import styles from './styles.module.scss';
import { useAuthFetch } from '@/utils/hooks/use-auth-fetch';
import InfoModal from '../InfoModal';
import ErrorModal from '../ErrorModal';

type Props = {
    onDerbyCreated?: () => void;
};

const ALL_RARITIES = [
    'Common',
    'Uncommon',
    'Rare',
    'Epic',
    'Legendary',
    'Mythic',
];

const DerbyAdminPanel: React.FC<Props> = ({ onDerbyCreated }) => {
    const authFetch = useAuthFetch();

    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');

    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // --- Form state ---
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [registrationOpensAt, setRegistrationOpensAt] = useState(''); // datetime-local
    const [startsAt, setStartsAt] = useState('');
    const [maxMmr, setMaxMmr] = useState<string>('');
    const [wronEntryFee, setWronEntryFee] = useState<string>('0');
    const [wronPayoutPercent, setWronPayoutPercent] = useState<string>('80');
    const [phorseEntryFee, setPhorseEntryFee] = useState<string>('0');
    const [maxParticipants, setMaxParticipants] = useState<string>('60');
    const [allowedRarities, setAllowedRarities] = useState<string[]>([...ALL_RARITIES]);

    const apiBase = process.env.API_URL || 'http://localhost:3001';

    const toggleRarity = (rarity: string) => {
        setAllowedRarities((prev) =>
            prev.includes(rarity)
                ? prev.filter((r) => r !== rarity)
                : [...prev, rarity]
        );
    };

    const checkAdminAccess = async () => {
        setIsCheckingAdmin(true);
        setError('');
        try {
            const res = await authFetch(`${apiBase}/derby/admin/panel`);
            if (res.status === 200) {
                setIsAdmin(true);
            } else if (res.status === 403) {
                setIsAdmin(false);
                setError('Access denied. Derby admin privileges required.');
            } else {
                setIsAdmin(false);
                setError(`Unexpected status: ${res.status}`);
            }
        } catch (err) {
            console.error('Derby admin access check failed:', err);
            setIsAdmin(false);
            setError('Access denied. Derby admin privileges required.');
        } finally {
            setIsCheckingAdmin(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            checkAdminAccess();
        }
        setIsOpen(!isOpen);
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    const toIsoOrThrow = (value: string, label: string): string => {
        if (!value) {
            throw new Error(`${label} is required`);
        }
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) {
            throw new Error(`${label} is invalid`);
        }
        return d.toISOString();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!name.trim()) {
                throw new Error('Derby name is required');
            }

            const regIso = toIsoOrThrow(registrationOpensAt, 'Registration opens at');
            const startIso = toIsoOrThrow(startsAt, 'Starts at');

            if (allowedRarities.length === 0) {
                throw new Error('You must select at least one allowed rarity');
            }

            const maxMmrNum = maxMmr.trim() ? Number(maxMmr) : null;
            if (maxMmrNum !== null && (Number.isNaN(maxMmrNum) || maxMmrNum < 0)) {
                throw new Error('Max MMR must be a non-negative number or empty');
            }

            const wronFeeNum = Number(wronEntryFee || 0);
            const wronPayoutNum = Number(wronPayoutPercent || 0);
            const phorseFeeNum = Number(phorseEntryFee || 0);
            const maxPartNum = maxParticipants.trim() ? Number(maxParticipants) : null;

            if (Number.isNaN(wronFeeNum) || wronFeeNum < 0) {
                throw new Error('WRON entry fee must be a non-negative number');
            }
            if (Number.isNaN(phorseFeeNum) || phorseFeeNum < 0) {
                throw new Error('PHORSE entry fee must be a non-negative number');
            }
            if (Number.isNaN(wronPayoutNum) || wronPayoutNum < 0 || wronPayoutNum > 100) {
                throw new Error('WRON payout percent must be between 0 and 100');
            }
            if (maxPartNum !== null && (Number.isNaN(maxPartNum) || maxPartNum < 2)) {
                throw new Error('Max participants must be at least 2 if provided');
            }

            const payload = {
                name: name.trim(),
                description: description.trim() || undefined,
                registrationOpensAt: regIso,
                startsAt: startIso,
                maxMmr: maxMmrNum,
                wronEntryFee: wronFeeNum,
                wronPayoutPercent: wronPayoutNum,
                phorseEntryFee: phorseFeeNum,
                allowedRarities,
                maxParticipants: maxPartNum,
            };

            setIsSubmitting(true);
            const res = await authFetch(`${apiBase}/derby/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const body = await res.json();
                    if (body?.message) msg = body.message;
                } catch {
                    // ignore
                }
                throw new Error(msg);
            }

            setModalMessage('Derby created successfully!');
            setShowInfoModal(true);

            // Reset form to defaults
            setName('');
            setDescription('');
            setRegistrationOpensAt('');
            setStartsAt('');
            setMaxMmr('');
            setWronEntryFee('1');
            setWronPayoutPercent('80');
            setPhorseEntryFee('0');
            setMaxParticipants('60');
            setAllowedRarities([...ALL_RARITIES]);

            if (onDerbyCreated) onDerbyCreated();
        } catch (err: any) {
            console.error('Failed to create derby:', err);
            setModalMessage(err?.message || 'Failed to create derby');
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating toggle button, similar to Quest Admin */}
            <button
                className={styles.toggleButton}
                onClick={handleToggle}
                title="Derby Admin Panel (Admin Only)"
            >
                {isOpen && isAdmin ? '✕' : '⚙'}
            </button>

            {isOpen && (
                <div className={styles.panelOverlay} onClick={handleOverlayClick}>
                    <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h2>Derby Admin Panel</h2>
                            <span className={styles.devBadge}>ADMIN ONLY</span>
                        </div>

                        {isCheckingAdmin && (
                            <div className={styles.accessMessage}>
                                <div className={styles.loadingMessage}>
                                    <p>Checking derby admin privileges...</p>
                                </div>
                            </div>
                        )}

                        {!isCheckingAdmin && !isAdmin && (
                            <div className={styles.accessMessage}>
                                <strong>Access Denied</strong>
                                <div className={styles.errorMessage}>
                                    <p>{error || 'You are not a derby admin.'}</p>
                                    <p>Only authorized admin wallets can access this panel.</p>
                                </div>
                            </div>
                        )}

                        {!isCheckingAdmin && isAdmin && (
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Derby Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="e.g., Beginners Derby #1"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe the rules / flavor text..."
                                        rows={3}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Registration Opens At</label>
                                    <input
                                        type="datetime-local"
                                        value={registrationOpensAt}
                                        onChange={(e) => setRegistrationOpensAt(e.target.value)}
                                        required
                                    />
                                    <small>UTC time is recommended. It will be sent as ISO-8601.</small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Starts At</label>
                                    <input
                                        type="datetime-local"
                                        value={startsAt}
                                        onChange={(e) => setStartsAt(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Max MMR (optional)</label>
                                    <input
                                        type="number"
                                        value={maxMmr}
                                        onChange={(e) => setMaxMmr(e.target.value)}
                                        min={0}
                                        placeholder="e.g., 1000 (leave empty = no cap)"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>WRON Entry Fee</label>
                                    <input
                                        type="number"
                                        value={wronEntryFee}
                                        onChange={(e) => setWronEntryFee(e.target.value)}
                                        min={0}
                                        step="0.0001"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>WRON Payout Percent (%)</label>
                                    <input
                                        type="number"
                                        value={wronPayoutPercent}
                                        onChange={(e) => setWronPayoutPercent(e.target.value)}
                                        min={0}
                                        max={100}
                                    />
                                    <small>Portion of total WRON entry pool paid out to winners.</small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>PHORSE Entry Fee</label>
                                    <input
                                        type="number"
                                        value={phorseEntryFee}
                                        onChange={(e) => setPhorseEntryFee(e.target.value)}
                                        min={0}
                                        step="1"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Max Participants (optional)</label>
                                    <input
                                        type="number"
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(e.target.value)}
                                        min={2}
                                        placeholder="e.g., 60 (leave empty = no limit)"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Allowed Rarities</label>
                                    <div className={styles.rarityGrid}>
                                        {ALL_RARITIES.map((rarity) => (
                                            <label key={rarity} className={styles.rarityItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={allowedRarities.includes(rarity)}
                                                    onChange={() => toggleRarity(rarity)}
                                                />
                                                <span>{rarity}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <small>Select at least one rarity.</small>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={styles.submitButton}
                                >
                                    {isSubmitting ? 'Creating Derby...' : 'Create Derby'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {showInfoModal && (
                <InfoModal text={modalMessage} onClose={() => setShowInfoModal(false)} />
            )}

            {showErrorModal && (
                <ErrorModal text={modalMessage} onClose={() => setShowErrorModal(false)} />
            )}
        </>
    );
};

export default DerbyAdminPanel;
