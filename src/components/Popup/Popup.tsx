"use client";

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

const askToLogin = "Log in to save your score and see where you stand in the ForgeWord arena!";

export default function Popup({
  gameStatus,
  targetWord,
  isOpen,
  onClose,
  chances,
  challengeId,
}: PopupProps) {
  const { data: session } = useSession();

  const isWon = gameStatus === "won";

  const handleLoginClick = () => {
    // Trigger NextAuth sign-in and redirect exactly back to this challenge link
    signIn("google", { callbackUrl: window.location.href });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div onClick={onClose} className={styles.closeButton}>
          <X size={15} />
        </div>
        
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

        {/* If they are a guest, politely suggest they log in */}
        {!session && <p style={{ paddingTop: "1rem" }}>{askToLogin}</p>}

        {/* Dynamic Action Area */}
        <div className={styles.buttonGroup}>
          {!session ? (
            <AppButton 
              onClick={handleLoginClick} 
              text="Log in with Google" 
              startIcon={<GoogleIcon />} 
            />
          ) : (
            // Since challenges are strictly 1v1 now, routing them to their Duel History is best
            <AppButton 
              routeURL="/challenges" 
              text="View Duel History" 
            />
          )}
        </div>
      </div>
    </div>
  );
}