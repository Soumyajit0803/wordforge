"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy } from "lucide-react";
import ReplayBoard from "@/components/ReplayBoard/ReplayBoard";
import AppButton from "@/components/Buttons/AppButton";
import styles from "./ChallengeStats.module.css";

interface ChallengeStatsProps {
  id: string;
  currentUserId: string | null;
  duelData: any;
  bothFinished: boolean;
  meFinishedPlaying: boolean;
  hasOpponent: boolean;
  isCreator: boolean;
  isOpponent: boolean;
  myEfficiency: number;
  opponentEfficiency: number;
}

export default function ChallengeStats({
  id,
  currentUserId,
  duelData,
  bothFinished,
  meFinishedPlaying,
  hasOpponent,
  isCreator,
  isOpponent,
  myEfficiency,
  opponentEfficiency,
}: ChallengeStatsProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}/play/${id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Status Badge */}
      <div
        className={`${styles.statusBadge} ${
          bothFinished ? styles.badgeComplete : styles.badgeActive
        }`}
      >
        {!bothFinished ? "Active challenge!" : "Challenge completed!"}
      </div>

      <ReplayBoard duelData={duelData} currentUserId={currentUserId} />

      {/* State 1: Active Game, User Needs to Play */}
      {!meFinishedPlaying && hasOpponent ? (
        <div className={styles.actionContainer}>
          <p className={styles.infoText}>
            Seems like you have not yet finished your challenge. Complete your
            challenge now!
          </p>

          <Link href={`/play/${id}`} className={styles.playLink}>
            Go to Play Area <ArrowRight size={18} />
          </Link>
        </div>
      ) : /* State 2: Waiting for Opponent */
      !hasOpponent ? (
        <div className={styles.waitingContainer}>
          <p className={styles.waitingText}>
            Waiting for an opponent... <br />
            <strong>Share the link below</strong> to start the game!
          </p>
          <div className={styles.linkGroup}>
            <input type="text" readOnly value={url} />
            <AppButton
              text=""
              startIcon={
                copied ? (
                  <Check size={20} className={styles.popIcon} />
                ) : (
                  <Copy size={20} />
                )
              }
              onClick={handleCopy}
              fixWidth
              styles={{
                padding: "0.7rem"
              }}
            />
          </div>
        </div>
      ) : /* State 3: Game Over, Both Finished */
      null}

      {bothFinished && (isCreator || isOpponent) && (
        <div className={styles.actionContainer}>
          <p className={styles.infoText}>
            {myEfficiency === opponentEfficiency
              ? "It's a tie! Both you and your opponent had the same efficiency score. Great minds think alike!"
              : myEfficiency > opponentEfficiency
                ? "Wow! You won! You had a higher efficiency score than your opponent."
                : "Dang you lost! Your opponent had a higher efficiency score than you."}
          </p>
        </div>
      )}
    </div>
  );
}
