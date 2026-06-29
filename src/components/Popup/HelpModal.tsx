"use client";

import styles from "./Popup.module.css"; // Or wherever your modal styles live
import AppButton from "../Buttons/AppButton"; // Adjust path as needed
import { useState } from "react";
import { Cross, Crosshair, X } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PageTwo = () => {
  return (
    <div className={styles.helpContent}>
      <div className={styles.explanation}>
        <p>Guessing rules.</p>
        <ul>
          <li>Maximum 6 Guesses to guess a word.</li>
          <li>Each guess must be a valid 5-letter word.</li>
          <li>
            The color of the tiles will change to show how close your guess was
            to the original word.
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
  );
};
const PageOne = () => {
  return (
    <div className={styles.helpContent}>
      <div className={styles.explanation}>
        <p>Two-Player guessing game</p>
        <ul>
          <li>Challenger first creates the challenge with a word for opponent to guess.</li>
          <li>
            Opponent gets the link from challenger, and submits a word for challenger to guess
          </li>
          <li>
            Once both the players get their words, guessing game begins! Guessing follows classic wordle rules.
          </li>
        </ul>
      </div>


    </div>
  );
};

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;
  const [page, setPage] = useState<number>(1);
  const onNext = () => {
    if (page == 1) {
      setPage(2);
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.helpModal}>
        <X size={20} className={styles.closeIcon} onClick={onClose} />
        <h2 className={styles.helpTitle}>How To Play</h2>

        {page == 1 && <PageOne />}
        {page == 2 && <PageTwo />}

        <div className={styles.buttonWrapper}>
          <AppButton onClick={onNext} text={page===1?"Next":"Got It!"} variant="primary" />
        </div>
      </div>
    </div>
  );
}
