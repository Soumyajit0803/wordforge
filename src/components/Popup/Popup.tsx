"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import styles from "./Popup.module.css";
import { Frown, Trophy, X } from "lucide-react";
import AppButton from "../Buttons/AppButton";
import { GoogleIcon } from "@/app/page";

interface PopupProps {
  gameStatus: "won" | "lost";
  targetWord: string;
  isOpen: boolean;
  onClose: () => void;
  chances: number;
  challengeId: string;
}

const askToLogin = "Log in to save your score and see where you stand in the wordforge arena!";

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
        <div onClick={onClose} className={styles.closeButton}><X size={15} /></div>
        <div className={styles.statusIcon}>
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

        {
          !session && <p style={{paddingTop: "1rem"}}>{askToLogin}</p>
        }

        {/* Dynamic Action Area */}
        <div className={styles.buttonGroup}>
          {!session ? (
            <AppButton onClick={handleLoginClick} text="Log in with Google" startIcon={<GoogleIcon />} />
          ) : (
            <AppButton routeURL={`/leaderboard?challenge=${challengeId}`} text="View Leaderboard" />
          )}
        </div>
      </div>
    </div>
  );
}