"use client";

import styles from "./Popup.module.css"; // Or wherever your modal styles live
import AppButton from "../Buttons/AppButton"; // Adjust path as needed

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.helpModal}>
        <h2 className={styles.helpTitle}>How To Play</h2>

        <div className={styles.helpContent}>
          <div className={styles.explanation}>
            <p>Guess the word in 6 tries.</p>
            <ul>
              <li>Each guess must be a valid 5-letter word.</li>
              <li>
                The color of the tiles will change to show how close your guess
                was to the original word.
              </li>
            </ul>
          </div>

          <div className={styles.examplesSection}>
            <p className={styles.examplesTitle}>
              <strong>Examples</strong>
            </p>

            {/* Example 1: GREEN */}
            <div className={styles.wordRow}>
              <span className={`${styles.tile} ${styles.correct}`}>W</span>
              <span className={styles.tile}>E</span>
              <span className={styles.tile}>A</span>
              <span className={styles.tile}>R</span>
              <span className={styles.tile}>Y</span>
            </div>
            <p>
              <strong>W</strong> is in the word and in the correct spot.
            </p>

            {/* Example 2: YELLOW */}
            <div className={styles.wordRow}>
              <span className={styles.tile}>P</span>
              <span className={`${styles.tile} ${styles.present}`}>I</span>
              <span className={styles.tile}>L</span>
              <span className={styles.tile}>L</span>
              <span className={styles.tile}>S</span>
            </div>
            <p>
              <strong>I</strong> is in the word but in the wrong spot.
            </p>

            {/* Example 3: GRAY */}
            <div className={styles.wordRow}>
              <span className={styles.tile}>V</span>
              <span className={styles.tile}>A</span>
              <span className={styles.tile}>G</span>
              <span className={`${styles.tile} ${styles.absent}`}>U</span>
              <span className={styles.tile}>E</span>
            </div>
            <p>
              <strong>U</strong> is not in the word in any spot.
            </p>
          </div>
        </div>

        <div className={styles.buttonWrapper}>
          <AppButton onClick={onClose} text="Got It!" variant="primary" />
        </div>
      </div>
    </div>
  );
}
