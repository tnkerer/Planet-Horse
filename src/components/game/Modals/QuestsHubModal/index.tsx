import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './styles.module.scss';
import closeIcon from '@/assets/game/pop-up/fechar.png';

interface Quest {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  claimed: boolean;
  rewards: {
    name: string;
    src: string;
    quantity: number;
  }[];
}

type Props = {
  status: boolean;
  setVisible: (v: boolean) => void;
};

// TODO: integrate with real API (test generated mock quests)
const generateMockQuests = (count: number): Quest[] => {
  const titles = ['Daily Check-in', 'Win 3 Races', 'Breed a Horse', 'Level Up Horse', 'Complete Training'];
  const descriptions = [
    'Do a daily check in into the game',
    'Win 3 races with any horse',
    'Breed two horses together',
    'Level up any horse to the next level',
    'Complete a training session',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: titles[i % titles.length],
    description: descriptions[i % descriptions.length],
    completed: i % 3 !== 2,
    claimed: i % 4 === 0, 
    rewards: [
      { name: 'Medal Bag', src: 'medal_bag', quantity: 1 },
    ],
  }));
};

const QUESTS_PER_PAGE = 5;
const TOTAL_QUESTS = 20; 
const SCROLL_THRESHOLD = 5;

const QuestsHubModal: React.FC<Props> = ({ status, setVisible }) => {
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [visibleQuests, setVisibleQuests] = useState<Quest[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!status) return;

    const initialQuests = generateMockQuests(TOTAL_QUESTS);
    setAllQuests(initialQuests);
    setVisibleQuests(initialQuests.slice(0, QUESTS_PER_PAGE));
    setLoadedCount(QUESTS_PER_PAGE);
  }, [status]);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    // Show down arrow if not at bottom and there are more quests to load OR content is scrollable
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
    const hasMoreQuests = loadedCount < TOTAL_QUESTS;
    const hasScrollableContent = scrollHeight > clientHeight;
    setShowScrollDown(!isAtBottom && (hasMoreQuests || hasScrollableContent));

    // Show up arrow ONLY if scrolled down (strict check at 0)
    const isAtTop = scrollTop < SCROLL_THRESHOLD;
    setShowScrollUp(!isAtTop && scrollTop > 0);
  }, [loadedCount]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || loadedCount >= TOTAL_QUESTS) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (scrolledToBottom) {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }

      loadMoreTimeoutRef.current = setTimeout(() => {
        setIsLoading(true);

        setTimeout(() => {
          const nextCount = Math.min(loadedCount + QUESTS_PER_PAGE, TOTAL_QUESTS);
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

    // TODO: Replace with actual API call
    // await fetch(`${process.env.API_URL}/quests/${questId}/claim`, {
    //   method: 'POST',
    //   credentials: 'include',
    // });

    setTimeout(() => {
      setAllQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === questId ? { ...q, claimed: true } : q
        )
      );
      setVisibleQuests(prevQuests =>
        prevQuests.map(q =>
          q.id === questId ? { ...q, claimed: true } : q
        )
      );
      setClaiming(null);
    }, 500);
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
          {visibleQuests.map((quest) => (
            <div key={quest.id} className={styles.questItem}>
              <div className={styles.questInfo}>
                <h3 className={styles.questTitle}>{quest.title}</h3>
                <p className={styles.questDescription}>{quest.description}</p>
              </div>

              <button
                className={`${styles.claimButton} ${
                  !quest.completed || quest.claimed ? styles.claimButtonDisabled : ''
                } ${claiming === quest.id ? styles.claimButtonClaiming : ''}`}
                onClick={() => handleClaim(quest.id)}
                disabled={!quest.completed || quest.claimed || claiming === quest.id}
              >
                <span className={styles.claimButtonText}>
                  {quest.claimed ? 'CLAIMED' : claiming === quest.id ? 'CLAIMING...' : 'CLAIM'}
                </span>
              </button>

              <div className={styles.rewardsContainer}>
                {quest.rewards.map((reward, idx) => (
                  <div key={idx} className={styles.rewardSlot}>
                    <div className={styles.rewardImage}>
                      <img
                        src={`/assets/items/${reward.src}.webp`}
                        alt={reward.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `/assets/items/${reward.src}.gif`;
                        }}
                      />
                    </div>
                    <span className={styles.rewardQuantity}>{reward.quantity}</span>
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
    </div>
  );
};

export default QuestsHubModal;
