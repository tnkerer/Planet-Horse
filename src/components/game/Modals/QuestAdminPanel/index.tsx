/* ========================================
 * 🔐 QUEST ADMIN PANEL - RESTRICTED ACCESS
 *
 * This panel is only accessible to the authorized admin wallet.
 * Backend enforces wallet verification via QuestAdminGuard.
 *
 * SECURITY NOTES:
 * - All requests are protected by JWT authentication
 * - Only wallet 0x4dF7707Bb8BBf59C7f30F7403865a7C1aA837D6A can create quests
 * - Unauthorized access attempts are logged and blocked
 * ======================================== */

import React, { useState } from 'react';
import styles from './styles.module.scss';
import { useAuthFetch } from '@/utils/hooks/use-auth-fetch';
import { QuestService, QuestDifficulty, QuestReward, QuestType, QUEST_TYPE_LABELS } from '@/services/questService';
import InfoModal from '../InfoModal';
import ErrorModal from '../ErrorModal';

type Props = {
  onQuestCreated?: () => void;
};

const QuestAdminPanel: React.FC<Props> = ({ onQuestCreated }) => {
  const authFetch = useAuthFetch();
  const questService = new QuestService(authFetch);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [questId, setQuestId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [questType, setQuestType] = useState<QuestType>('RUN_RACES');
  const [questsToComplete, setQuestsToComplete] = useState<string>('1');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('SIMPLE');
  const [isDailyQuest, setIsDailyQuest] = useState<boolean>(false);
  const [horsesToUnlock, setHorsesToUnlock] = useState<string>('0');

  const [rewards, setRewards] = useState<QuestReward[]>([
    { type: 'phorse', amount: 100 },
  ]);

  const checkAdminAccess = async () => {
    try {
      await authFetch(`${process.env.API_URL || 'http://localhost:3001'}/quest/admin/panel`);
      setIsAdmin(true);
      setError('');
    } catch (err) {
      setIsAdmin(false);
      setError('Access denied. Admin privileges required.');
      console.error('Admin access check failed:', err);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      checkAdminAccess();
    }
    setIsOpen(!isOpen);
  };

  const getDifficultyFromId = (id: number): QuestDifficulty => {
    if (id >= 1 && id <= 9999) return 'SIMPLE';
    if (id >= 10000 && id <= 19999) return 'MEDIUM';
    if (id >= 20000 && id <= 29999) return 'ADVANCED';
    return 'SIMPLE';
  };

  const handleIdChange = (value: string) => {
    setQuestId(value);
    const id = parseInt(value);
    if (!isNaN(id) && id > 0) {
      setDifficulty(getDifficultyFromId(id));
    }
  };

  const addReward = () => {
    setRewards([...rewards, { type: 'phorse', amount: 10 }]);
  };

  const removeReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  const updateReward = (index: number, field: keyof QuestReward, value: any) => {
    const newRewards = [...rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setRewards(newRewards);
  };

  const handleSync = async () => {
    if (!confirm('This will sync quest seed data to all users. Continue?')) {
      return;
    }

    setIsSyncing(true);

    try {
      const result = await questService.syncQuestSeedData();
      setModalMessage(
        `Quest sync complete!\n\n` +
        `✓ ${result.questsUpserted} quests upserted\n` +
        `✓ ${result.usersProcessed} users processed\n` +
        `✓ ${result.userQuestsInitialized} UserQuest records initialized\n` +
        `Duration: ${(result.durationMs / 1000).toFixed(2)}s`
      );
      setShowInfoModal(true);

      if (onQuestCreated) {
        onQuestCreated();
      }
    } catch (error) {
      console.error('Failed to sync quest data:', error);
      setModalMessage(error instanceof Error ? error.message : 'Failed to sync quest data');
      setShowErrorModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = parseInt(questId);
    if (isNaN(id) || id < 1 || id > 29999) {
      setModalMessage('Quest ID must be between 1 and 29999');
      setShowErrorModal(true);
      return;
    }

    const questsToCompleteNum = parseInt(questsToComplete);
    if (isNaN(questsToCompleteNum) || questsToCompleteNum < 1) {
      setModalMessage('Quests to complete must be at least 1');
      setShowErrorModal(true);
      return;
    }

    const horsesToUnlockNum = parseInt(horsesToUnlock);
    if (isNaN(horsesToUnlockNum) || horsesToUnlockNum < 0) {
      setModalMessage('Horses to unlock must be 0 or greater');
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await questService.createQuest({
        id,
        title,
        description,
        questType,
        reward: rewards,
        questsToComplete: questsToCompleteNum,
        difficulty,
        isDailyQuest,
        horsesToUnlock: horsesToUnlockNum,
      });

      setModalMessage('Quest created successfully!');
      setShowInfoModal(true);

      setQuestId('');
      setTitle('');
      setDescription('');
      setQuestType('RUN_RACES');
      setQuestsToComplete('1');
      setDifficulty('SIMPLE');
      setIsDailyQuest(false);
      setHorsesToUnlock('0');
      setRewards([{ type: 'phorse', amount: 100 }]);

      if (onQuestCreated) {
        onQuestCreated();
      }
    } catch (error) {
      console.error('Failed to create quest:', error);
      setModalMessage(error instanceof Error ? error.message : 'Failed to create quest');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        className={styles.toggleButton}
        onClick={handleToggle}
        title="Quest Admin Panel (Admin Only)"
      >
        {isOpen ? '✕' : '⚙'}
      </button>

      {isOpen && (
        <div className={styles.panelOverlay}>
          <div className={styles.panel}>
            <div className={styles.header}>
              <h2>Quest Admin Panel</h2>
              <span className={styles.devBadge}>ADMIN ONLY</span>
            </div>

            {isAdmin === null && (
              <div className={styles.accessMessage}>
                <div className={styles.loadingMessage}>
                  <p>Checking admin privileges...</p>
                </div>
              </div>
            )}

            {isAdmin === false && (
              <div className={styles.accessMessage}>
                <strong>Access Denied</strong>
                <div className={styles.errorMessage}>
                  <p>{error}</p>
                  <p>Only authorized admin wallets can access this panel.</p>
                  <p>Contact the development team if you believe this is an error.</p>
                </div>
              </div>
            )}

            {isAdmin === true && (
              <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Quest ID</label>
                <input
                  type="number"
                  value={questId}
                  onChange={(e) => handleIdChange(e.target.value)}
                  required
                  min="1"
                  max="29999"
                  placeholder="1-9999 (SIMPLE), 10000-19999 (MEDIUM), 20000-29999 (ADVANCED)"
                />
                <small>Difficulty: <strong>{difficulty}</strong></small>
              </div>

              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g., Win 3 Races"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Describe the quest objective..."
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Quest Type</label>
                <select
                  value={questType}
                  onChange={(e) => setQuestType(e.target.value as QuestType)}
                  required
                >
                  {(Object.keys(QUEST_TYPE_LABELS) as QuestType[]).map((type) => (
                    <option key={type} value={type}>
                      {QUEST_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Quests to Complete</label>
                <input
                  type="number"
                  value={questsToComplete}
                  onChange={(e) => setQuestsToComplete(e.target.value)}
                  required
                  min="1"
                  placeholder="How many times to complete"
                />
              </div>

              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={isDailyQuest}
                    onChange={(e) => setIsDailyQuest(e.target.checked)}
                  />
                  Daily Quest (Resets at 00:00 UTC)
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Horses to Unlock</label>
                <input
                  type="number"
                  value={horsesToUnlock}
                  onChange={(e) => setHorsesToUnlock(e.target.value)}
                  required
                  min="0"
                  placeholder="Minimum horses required (0 = no restriction)"
                />
                <small>Quest will only show to users with this many horses or more</small>
              </div>

              <div className={styles.formGroup}>
                <label>Rewards</label>
                {rewards.map((reward, index) => (
                  <div key={index} className={styles.rewardRow}>
                    <select
                      value={reward.type}
                      onChange={(e) => updateReward(index, 'type', e.target.value)}
                      required
                    >
                      <option value="phorse">PHORSE</option>
                      <option value="wron">WRON</option>
                      <option value="medals">Medals</option>
                      <option value="item">Item</option>
                    </select>

                    <input
                      type="number"
                      value={reward.amount}
                      onChange={(e) => updateReward(index, 'amount', parseInt(e.target.value))}
                      required
                      min="1"
                      placeholder="Amount"
                    />

                    {reward.type === 'item' && (
                      <input
                        type="text"
                        value={reward.itemName || ''}
                        onChange={(e) => updateReward(index, 'itemName', e.target.value)}
                        placeholder="Item name"
                        required
                      />
                    )}

                    {rewards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReward(index)}
                        className={styles.removeButton}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReward}
                  className={styles.addButton}
                >
                  + Add Reward
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? 'Creating...' : 'Create Quest'}
              </button>

              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className={styles.syncButton}
              >
                {isSyncing ? 'Syncing...' : '🔄 Sync Seed Data to All Users'}
              </button>
            </form>
            )}
          </div>
        </div>
      )}

      {showInfoModal && (
        <InfoModal
          text={modalMessage}
          onClose={() => setShowInfoModal(false)}
        />
      )}

      {showErrorModal && (
        <ErrorModal
          text={modalMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </>
  );
};

export default QuestAdminPanel;