import type React from "react";
import { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import ReferralGenerator from "../../components/referral/ReferralGenerator";
import ReferralStats from "../../components/referral/ReferralStats";
import BonusSection from "../../components/referral/BonusSection";
import ReferralBySection from "../../components/referral/ReferralBySection";
import type { ReferralData } from "../../utils/referral/types";

const ReferralPage: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

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
          } catch { }
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
          <ReferralBySection
            referredByRefCode={referralData.referredByRefCode}
            onApplied={() => {
              // reload stats after applying code
              setLoading(true);
              fetch(`${process.env.API_URL}/user/referral/stats`, { credentials: "include" })
                .then(async (res) => res.json())
                .then((json) => setReferralData(json))
                .finally(() => setLoading(false));
            }}
          />
          <ReferralStats data={referralData} />
        </div>

        <div className={styles.rightColumn}>
          <BonusSection referralLevel={referralData.level} xp={referralData.xp} />
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
