"use client"

import type React from "react"
import { useState } from "react"
import styles from "./styles.module.scss"

interface CopyButtonProps {
  text: string
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setIsAnimating(true)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
        setIsAnimating(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <button
      className={`${styles.copyButton} ${copied ? styles.copied : ""} ${isAnimating ? styles.animating : ""}`}
      onClick={handleCopy}
      disabled={!text}
    >
      <span className={styles.icon}>{copied ? "✅" : "📋"}</span>
      <span className={styles.text}>{copied ? "Copied!" : "Copy"}</span>

{/*       {isAnimating && (
        <div className={styles.particles}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${styles.particle} ${styles[`particle${i + 1}`]}`}>
              ✨
            </div>
          ))}
        </div>
      )} */}
    </button>
  )
}

export default CopyButton
