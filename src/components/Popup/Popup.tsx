"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import styles from "./Popup.module.css";
import { Frown, Trophy } from "lucide-react";
import AppButton from "../Buttons/AppButton";

interface PopupProps {
  gameStatus: "won" | "lost";
  targetWord: string;
  isOpen: boolean;
  onClose: () => void;
  chances: number;
  challengeId: string;
}

export default function Popup({
  gameStatus,
  targetWord,
  isOpen,
  onClose,
  chances,
  challengeId,
}: PopupProps) {
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // Replace the state with a ref to make it Strict-Mode-proof
  const hasSavedRef = useRef(false);

  const isWon = gameStatus === "won";

  // --- THE BULLETPROOF AUTO-SAVE LOGIC ---
  useEffect(() => {
    // Only run if the modal is open, the user is logged in, and we haven't saved yet
    if (isOpen && session && !hasSavedRef.current && !isSaving) {
      hasSavedRef.current = true; // Lock immediately so the second pass ignores this
      saveScoreToDatabase();
    }
  }, [isOpen, session]); // Removed hasSaved and isSaving to prevent re-triggers

  const saveScoreToDatabase = async () => {
    setIsSaving(true);
    setSaveMessage("Saving your score...");

    try {
      const res = await fetch("/api/challenge/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          guessesUsed: chances,
        }),
      });

      if (res.ok) {
        setSaveMessage("Score saved to Leaderboard!");
      } else {
        // Unlock the ref if it fails so it can potentially be retried
        hasSavedRef.current = false;
        const errorData = await res.json();
        setSaveMessage(errorData.error || "Failed to save score.");
      }
    } catch (error) {
      hasSavedRef.current = false;
      setSaveMessage("Network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoginClick = () => {
    // Trigger NextAuth sign-in and redirect exactly back to this challenge link
    signIn("google", { callbackUrl: window.location.href });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={isWon ? styles.iconWon : styles.iconLost}>
          {isWon ? <Trophy size={48} /> : <Frown size={48} />}
        </div>

        <h2>{isWon ? "Splendid!" : "Next Time!"}</h2>
        {!isWon && (
          <p>
            The word was: <strong>{targetWord.toUpperCase()}</strong>
          </p>
        )}
        <p>
          You {isWon ? `got it in ${chances} guesses!` : "ran out of guesses."}
        </p>

        {/* Optional: Visual feedback for the saving process */}
        {saveMessage && session && (
          <p className={styles.feedbackMsg} style={{ fontSize: "0.875rem", color: "#787c7e", marginBottom: "1rem" }}>
            {saveMessage}
          </p>
        )}

        {/* Dynamic Action Area */}
        <div className={styles.buttonGroup}>
          {!session ? (
            <AppButton onClick={handleLoginClick} text="Save Game" />
          ) : (
            <AppButton routeURL={`/leaderboard?challenge=${challengeId}`} text="View Leaderboard" />
          )}
          <AppButton onClick={onClose} text="Close" />
        </div>
      </div>
    </div>
  );
}