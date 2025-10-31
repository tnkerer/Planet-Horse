import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';
import { useAuthFetch } from '@/utils/hooks/use-auth-fetch';
import { QuestService, UserQuestProgress, QuestDifficulty } from '@/services/questService';
import QuestAdminPanel from '../QuestAdminPanel';
import ErrorModal from '../ErrorModal';

type Props = {
  status: boolean;
  setVisible: (v: boolean) => void;
};

const QUESTS_PER_PAGE = 5;
const SCROLL_THRESHOLD = 5;

const QuestsHubModal: React.FC<Props> = ({ status, setVisible }) => {
  const authFetch = useAuthFetch();
  const questService = new QuestService(authFetch);

  const [allQuests, setAllQuests] = useState<UserQuestProgress[]>([]);
  const [visibleQuests, setVisibleQuests] = useState<UserQuestProgress[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [checkinStatus, setCheckinStatus] = useState<{
    canCheckin: boolean;
    streak: number;
    nextCheckinAt: string | null;
  } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!status) return;

    const fetchQuests = async () => {
      setIsLoadingQuests(true);
      try {
        const quests = await questService.listQuests();
        setAllQuests(quests);
        setVisibleQuests(quests.slice(0, QUESTS_PER_PAGE));
        setLoadedCount(QUESTS_PER_PAGE);
      } catch (error) {
        console.error('Failed to fetch quests:', error);
      } finally {
        setIsLoadingQuests(false);
      }
    };

    const fetchCheckinStatus = async () => {
      try {
        const status = await questService.getCheckinStatus();
        setCheckinStatus({
          canCheckin: status.canCheckin,
          streak: status.streak,
          nextCheckinAt: status.nextCheckinAt,
        });
      } catch (error) {
        console.error('Failed to fetch checkin status:', error);
      }
    };

    fetchQuests();
    fetchCheckinStatus();
  }, [status]);

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    const isAtBottom = scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
    const hasMoreQuests = loadedCount < allQuests.length;
    const hasScrollableContent = scrollHeight > clientHeight;
    setShowScrollDown(!isAtBottom && (hasMoreQuests || hasScrollableContent));

    const isAtTop = scrollTop < SCROLL_THRESHOLD;
    setShowScrollUp(!isAtTop && scrollTop > 0);
  }, [loadedCount, allQuests.length]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || loadedCount >= allQuests.length) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (scrolledToBottom) {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }

      loadMoreTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);

        setTimeout(() => {
          const nextCount = Math.min(loadedCount + QUESTS_PER_PAGE, allQuests.length);
          setVisibleQuests(allQuests.slice(0, nextCount));
          setLoadedCount(nextCount);
          setIsLoading(false);
        }, 300);
      }, 150);
    }
  }, [allQuests, loadedCount, isLoading]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      handleScroll();
      checkScrollPosition();
    };

    container.addEventListener('scroll', onScroll);
    checkScrollPosition();

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [handleScroll, checkScrollPosition]);

  useEffect(() => {
    const timer = setTimeout(() => checkScrollPosition(), 100);
    return () => clearTimeout(timer);
  }, [visibleQuests, isLoading, checkScrollPosition]);

  const handleClaim = async (questId: number) => {
    setClaiming(questId);

    try {
      await questService.claimQuest(questId);

      setAllQuests(prevQuests =>
        prevQuests.map(q =>
          q.quest.id === questId ? { ...q, claimed: true, claimedAt: new Date().toISOString() } : q
        )
      );
      setVisibleQuests(prevQuests =>
        prevQuests.map(q =>
          q.quest.id === questId ? { ...q, claimed: true, claimedAt: new Date().toISOString() } : q
        )
      );
    } catch (error) {
      console.error('Failed to claim quest:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to claim quest');
      setShowErrorModal(true);
    } finally {
      setClaiming(null);
    }
  };

  const handleCheckin = async () => {
    if (!checkinStatus?.canCheckin || isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const result = await questService.dailyCheckin();

      setCheckinStatus({
        canCheckin: false,
        streak: result.streak,
        nextCheckinAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const quests = await questService.listQuests();
      setAllQuests(quests);
      setVisibleQuests(quests.slice(0, Math.max(loadedCount, QUESTS_PER_PAGE)));
    } catch (error) {
      console.error('Failed to check in:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const scrollToTop = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => checkScrollPosition(), 400);
    }
  };

  const scrollToBottom = () => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      setTimeout(() => checkScrollPosition(), 400);
    }
  };

  const getDifficultyClass = (difficulty: QuestDifficulty): string => {
    switch (difficulty) {
      case 'SIMPLE':
        return styles.difficultySimple;
      case 'MEDIUM':
        return styles.difficultyMedium;
      case 'ADVANCED':
        return styles.difficultyAdvanced;
      default:
        return '';
    }
  };

  if (!status) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) setVisible(false);
      }}
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeButton}
          onClick={() => setVisible(false)}
          aria-label="Close"
        >
          <Image src={closeIcon} alt="Close" width={30} height={30} />
        </button>

        <button
          className={`${styles.checkinButton} ${!checkinStatus?.canCheckin ? styles.checkinDisabled : ''}`}
          onClick={handleCheckin}
          disabled={!checkinStatus?.canCheckin || isCheckingIn}
          aria-label="Daily Check-in"
        >
          {!checkinStatus?.canCheckin && (
            <span className={styles.streakNumber}>{checkinStatus?.streak || 0}</span>
          )}
        </button>

        <QuestAdminPanel />

        {showScrollUp && (
          <button
            className={`${styles.scrollIndicator} ${styles.scrollUp}`}
            onClick={scrollToTop}
            aria-label="Scroll up"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4L4 12H9V20H15V12H20L12 4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}

        <div className={styles.questList} ref={scrollContainerRef}>
          {isLoadingQuests ? (
            <div className={styles.loadingIndicator}>
              <span className={styles.loadingText}>Loading quests...</span>
            </div>
          ) : (
            <>
              {visibleQuests.map((userQuest) => (
                <div key={userQuest.quest.id} className={`${styles.questItem} ${getDifficultyClass(userQuest.quest.difficulty)}`}>
                  <div className={styles.questInfo}>
                    <h3 className={styles.questTitle}>{userQuest.quest.title}</h3>
                    <p className={styles.questDescription}>{userQuest.quest.description}</p>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${(userQuest.progress / userQuest.quest.questsToComplete) * 100}%` }}
                      />
                      <span className={styles.progressText}>
                        {userQuest.progress}/{userQuest.quest.questsToComplete}
                      </span>
                    </div>
                  </div>

                  <button
                    className={`${styles.claimButton} ${
                      !userQuest.completed || userQuest.claimed ? styles.claimButtonDisabled : ''
                    } ${claiming === userQuest.quest.id ? styles.claimButtonClaiming : ''}`}
                    onClick={async () => await handleClaim(userQuest.quest.id)}
                    disabled={!userQuest.completed || userQuest.claimed || claiming === userQuest.quest.id}
                  >
                    <span className={styles.claimButtonText}>
                      {userQuest.claimed ? 'CLAIMED' : claiming === userQuest.quest.id ? 'CLAIMING...' : 'CLAIM'}
                    </span>
                  </button>

                  <div className={styles.rewardsContainer}>
                    {userQuest.quest.reward.map((reward, idx) => (
                      <div key={idx} className={styles.rewardSlot}>
                        <div className={styles.rewardImage}>
                          <img
                            src={`/assets/items/${reward.type === 'item' ? reward.itemName : reward.type}.webp`}
                            alt={reward.type}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `/assets/items/${reward.type === 'item' ? reward.itemName : reward.type}.gif`;
                            }}
                          />
                        </div>
                        <span className={styles.rewardQuantity}>{reward.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className={styles.loadingIndicator}>
                  <span className={styles.loadingText}>Loading more quests...</span>
                </div>
              )}
            </>
          )}
        </div>

        {showScrollDown && (
          <button
            className={`${styles.scrollIndicator} ${styles.scrollDown}`}
            onClick={scrollToBottom}
            aria-label="Scroll down"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 20L20 12H15V4H9V12H4L12 20Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>

      {showErrorModal && (
        <ErrorModal
          text={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default QuestsHubModal;
