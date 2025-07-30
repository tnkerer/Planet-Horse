import type React from "react";
import { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import ReferralGenerator from "../../components/referral/ReferralGenerator";
import ReferralStats from "../../components/referral/ReferralStats";
import BonusSection from "../../components/referral/BonusSection";
import MilestonesSection from "../../components/referral/MilestonesSection";
import RewardModal from "../../components/referral/RewardModal";
import type { ReferralData, Milestone } from "../../utils/referral/types";

const ReferralPage: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReferralStats = async () => {
      try {
        const res = await fetch(`${process.env.API_URL}/user/referral/stats`, {
          credentials: "include",
        });

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson?.message) msg = errJson.message;
          } catch {}
          throw new Error(msg);
        }

        const json = await res.json();
        if (isMounted) {
          setReferralData(json);
        }
      } catch (err) {
        console.error("Error loading referral stats:", err);
        if (isMounted) setReferralData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadReferralStats();

    return () => {
      isMounted = false;
    };
  }, []);

/*   useEffect(() => {
    if (!referralData) return;

    const unlockedMilestones = milestones.filter(
      (milestone) =>
        referralData.totalReferrals >= milestone.requiredReferrals &&
        !milestone.claimed
    );

    if (unlockedMilestones.length > 0) {
      const nextMilestone = unlockedMilestones[0];
      setNewMilestone(nextMilestone);
      setShowRewardModal(true);
    }
  }, [referralData]); */

  const handleClaimReward = async (milestoneId: string) => {
    try {
      const res = await fetch(
        `${process.env.API_URL}/user/referral/milestones/${milestoneId}/claim`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch {}
        throw new Error(msg);
      }

      // Update UI state after claiming
      setShowRewardModal(false);
      setNewMilestone(null);
      // Optionally reload referral stats to reflect claimed milestone
    } catch (err) {
      console.error("Error claiming milestone:", err);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (!referralData)
    return <div className={styles.error}>Failed to load referral data.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Referral Program</h1>
        <p className={styles.subtitle}>
          Invite friends and earn amazing rewards together!
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <ReferralGenerator />
          <ReferralStats data={referralData} />
        </div>

        <div className={styles.rightColumn}>
          <BonusSection referralLevel={referralData.level} xp={referralData.xp} />
          {/* <MilestonesSection
            totalReferrals={referralData.totalReferrals}
            milestones={milestones}
            onClaimReward={handleClaimReward}
          /> */}
        </div>
      </div>

{/*       {showRewardModal && newMilestone && (
        <RewardModal
          milestone={newMilestone}
          onClaim={() => handleClaimReward(newMilestone.id)}
          onClose={() => setShowRewardModal(false)}
        />
      )} */}
    </div>
  );
};

export default ReferralPage;
