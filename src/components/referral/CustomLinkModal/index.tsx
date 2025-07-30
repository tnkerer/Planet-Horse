"use client"

import type React from "react"
import { useState } from "react"
import styles from "./styles.module.scss"

interface CustomLinkModalProps {
  onConfirm: (customCode: string) => void
  onClose: () => void
}

const CustomLinkModal: React.FC<CustomLinkModalProps> = ({ onConfirm, onClose }) => {
  const [customCode, setCustomCode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState("")

  const checkAvailability = async (code: string) => {
    if (code.length < 3) {
      setIsAvailable(null)
      setError("")
      return
    }

    setIsChecking(true)
    setError("")

    // Simulate API call to check availability
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Mock validation logic
    const unavailableCodes = ["admin", "test", "api", "www", "planethorse"]
    const available = !unavailableCodes.includes(code.toLowerCase()) && /^[a-zA-Z0-9_-]+$/.test(code)

    if (!available && unavailableCodes.includes(code.toLowerCase())) {
      setError("This code is reserved and cannot be used")
    } else if (!available) {
      setError("Code can only contain letters, numbers, hyphens, and underscores")
    }

    setIsAvailable(available)
    setIsChecking(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "")
    setCustomCode(value)
    checkAvailability(value)
  }

  const handleConfirm = () => {
    if (isAvailable && customCode) {
      onConfirm(customCode)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{"🎨 Create Custom Referral Link"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            {"Create a personalized referral code that's easy to remember and share!"}
          </p>

          <div className={styles.inputSection}>
            <label htmlFor="customCode">{"Your Custom Code"}</label>
            <div className={styles.inputContainer}>
              <span className={styles.prefix}>{"planethorse.io/?ref="}</span>
              <input
                id="customCode"
                type="text"
                value={customCode}
                onChange={handleInputChange}
                placeholder="your-code"
                className={`${styles.input} ${isAvailable ? styles.available : !isAvailable ? styles.unavailable : ""
                  }`}
                maxLength={20}
              />
              <div className={styles.status}>
                {isChecking && <span className={styles.checking}>⏳</span>}
                {isAvailable && <span className={styles.available}>✅</span>}
                {!isAvailable && <span className={styles.unavailable}>❌</span>}
              </div>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.requirements}>
            <h4>{"Requirements:"}</h4>
            <ul>
              <li className={customCode.length >= 3 ? styles.met : ""}>{"At least 3 characters"}</li>
              <li className={/^[a-zA-Z0-9_-]+$/.test(customCode) ? styles.met : ""}>
                {"Only letters, numbers, hyphens, and underscores"}
              </li>
              {/* <li className={isAvailable === true ? styles.met : ""}>{"Must be available"}</li> */}
            </ul>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            {"Cancel"}
          </button>
          <button className={styles.confirmButton} onClick={handleConfirm} disabled={!isAvailable || isChecking}>
            {"Create Link"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomLinkModal
