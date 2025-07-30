"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import styles from "./styles.module.scss";
import CopyButton from "../CopyButton";
import CustomLinkModal from "../CustomLinkModal";
import ErrorModal from "@/components/game/Modals/ErrorModal";

const ReferralGenerator: React.FC = () => {
  const [referralLink, setReferralLink] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Error state
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  const linkInputRef = useRef<HTMLInputElement>(null);

  // Load default referral code on mount
  useEffect(() => {
    let isMounted = true;

    const fetchRefCode = async () => {
      try {
        const res = await fetch(`${process.env.API_URL}/user/ref-code`, {
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
        if (json.refCode && isMounted) {
          setReferralLink(`https://planethorse.io/?ref=${String(json.refCode)}`);
        }
      } catch (err: any) {
        console.error("Failed to load referral code:", err);
        setErrorMessage(err.message || "Failed to load referral code");
        setShowError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRefCode();

    return () => {
      isMounted = false;
    };
  }, []);

  const generateDefaultLink = async () => {
    setIsGenerating(true);

    try {
      const res = await fetch(`${process.env.API_URL}/user/ref-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
      setReferralLink(`https://planethorse.io/?ref=${String(json.refCode)}`);
    } catch (err: any) {
      console.error("Error generating referral code:", err);
      setErrorMessage(err.message || "Error generating referral code");
      setShowError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomLink = async (customCode: string) => {
    try {
      const res = await fetch(`${process.env.API_URL}/user/ref-code`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom: customCode }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch {}
        throw new Error(msg);
      }

      setReferralLink(`https://planethorse.io/?ref=${customCode}`);
      setShowCustomModal(false);
    } catch (err: any) {
      console.error("Error creating custom referral code:", err);
      setErrorMessage(err.message || "Error creating custom referral code");
      setShowError(true);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>🔗 Generate Your Referral Link</h2>
        <p className={styles.description}>
          Share your link and earn rewards for every friend who joins!
        </p>
      </div>

      <div className={styles.linkSection}>
        <div className={styles.inputContainer}>
          <input
            ref={linkInputRef}
            type="text"
            value={referralLink}
            readOnly
            className={styles.linkInput}
            placeholder="Your referral link will appear here..."
          />
          <CopyButton text={referralLink} />
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.generateButton} ${
              isGenerating ? styles.loading : ""
            }`}
            onClick={generateDefaultLink}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className={styles.spinner}></span>
                Generating...
              </>
            ) : (
              <>
                <span className={styles.icon}>⚡</span>
                Generate Default
              </>
            )}
          </button>

          <button
            className={styles.customButton}
            onClick={() => setShowCustomModal(true)}
          >
            <span className={styles.icon}>✨</span>
            Create Custom
          </button>
        </div>
      </div>

      {showCustomModal && (
        <CustomLinkModal
          onConfirm={handleCustomLink}
          onClose={() => setShowCustomModal(false)}
        />
      )}

      {/* 🔹 Show Error Modal */}
      {showError && (
        <ErrorModal text={errorMessage} onClose={() => setShowError(false)} />
      )}
    </div>
  );
};

export default ReferralGenerator;
