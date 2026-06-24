"use client";

import { useSession, signIn } from "next-auth/react";
import styles from "./Popup.module.css";
import { Frown, Trophy, X } from "lucide-react";
import AppButton from "../Buttons/AppButton";
import { GoogleIcon } from "@/app/page";
import { usePlayer } from "@/hooks/usePlayer";

interface PopupProps {
  gameStatus: "won" | "lost";
  targetWord: string;
  isOpen: boolean;
  onClose: () => void;
  chances: number;
  challengeId: string;
  isCreator: boolean;
  playedGuesses: string[];
}

const askToLogin =
  "Log in to save your score and see where you stand in the ForgeWord arena!";

export default function Popup({
  gameStatus,
  targetWord,
  isOpen,
  onClose,
  chances,
  challengeId,
  isCreator,
  playedGuesses,
}: PopupProps) {
  const { player } = usePlayer();

  const isWon = gameStatus === "won";

  const handleLoginClick = async () => {
    const pendingMatchData = {
      challengeId,
      isCreator,
      guesses: playedGuesses,
      targetWord,
    };
    localStorage.setItem(
      "pending_game_score",
      JSON.stringify(pendingMatchData),
    );
    const statusPageURL = `${window.location.origin}/status/${challengeId}`;
    signIn("google", { callbackUrl: statusPageURL });
  };

  if (!isOpen || !player) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div onClick={onClose} className={styles.closeButton}>
          <X size={15} />
        </div>

        <div className={styles.statusIcon}>
          {isWon ? <Trophy size={48} color="gold" /> : <Frown size={48} />}
        </div>

        <h2>{isWon ? "Splendid!" : "Next Time!"}</h2>

        {!isWon && (
          <p>
            The word was: <strong>{targetWord.toUpperCase()}</strong>
          </p>
        )}

        <p>
          You {isWon ? `got it in ${chances} ${chances>1?"guesses":"guess"}!` : "ran out of guesses."}
        </p>

        {/* If they are a guest, politely suggest they log in */}
        {player.isGuest && <p style={{ paddingTop: "1rem" }}>{askToLogin}</p>}

        {/* Dynamic Action Area */}
        <div className={styles.buttonGroup}>
          {player.isGuest && (
            <AppButton
              onClick={handleLoginClick}
              text="Log in with Google"
              startIcon={<GoogleIcon />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
