"use client";

import React, { useState } from "react";
import styles from "./styles.module.scss";
import ErrorModal from "@/components/game/Modals/ErrorModal";
import ConfirmModal from "@/components/game/Modals/ConfirmModal";

interface ReferralBySectionProps {
  referredByRefCode: string | null;
  onApplied: () => void;
}

const ReferralBySection: React.FC<ReferralBySectionProps> = ({
  referredByRefCode,
  onApplied,
}) => {
  const [showInputModal, setShowInputModal] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Modals for error/success
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!refCode) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.API_URL}/user/set-referred-by`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refCode }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch {}
        throw new Error(msg);
      }

      // Success
      setShowInputModal(false);
      setShowSuccess(true);
      onApplied(); // refresh parent stats
    } catch (err: any) {
      console.error("Error applying referral code:", err);
      setErrorMessage(err.message || "Failed to apply referral code");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {referredByRefCode ? (
        <div className={styles.infoBox}>
          <span className={styles.label}>You have been referred by:</span>
          <span className={styles.refCode}>{referredByRefCode}</span>
        </div>
      ) : (
        <div className={styles.inputBox}>
          <span className={styles.label}>Not referred yet?</span>
          <button
            className={styles.applyButton}
            onClick={() => setShowInputModal(true)}
          >
            Apply Referral Code
          </button>
        </div>
      )}

      {showInputModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3>Apply Referral Code</h3>
            <input
              className={styles.input}
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="Enter referral code"
            />
            <div className={styles.actions}>
              <button onClick={() => setShowInputModal(false)}>Cancel</button>
              <button disabled={loading} onClick={handleConfirm}>
                {loading ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showError && (
        <ErrorModal text={errorMessage} onClose={() => setShowError(false)} />
      )}

      {showSuccess && (
        <ConfirmModal
          text={<span>Referral code applied successfully!</span>}
          onClose={() => setShowSuccess(false)}
          onConfirm={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default ReferralBySection;
