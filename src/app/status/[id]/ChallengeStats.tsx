"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Info } from "lucide-react";
import ReplayBoard from "@/components/ReplayBoard/ReplayBoard";
import AppButton from "@/components/Buttons/AppButton";
import styles from "./ChallengeStats.module.css";
import { isGuest } from "@/app/challenges/create/CreateChallengeClient";

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
  const [isSyncing, setIsSyncing] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}/play/${id}`;

  useEffect(() => {
    const pendingDataRaw = localStorage.getItem("pending_game_score");

    if (pendingDataRaw) {
      setIsSyncing(true);

      const pendingData = JSON.parse(pendingDataRaw);
      console.log("Attempting migration");
      console.log("Migration available");

      // 2. Post the data to the backend
      fetch("/api/challenge/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pendingData,
          isMigration: true,
        }),
      })
        .then((res) => {
          if (res.ok) {
            // 3. Clear storage so a page refresh doesn't trigger a duplicate API call
            localStorage.removeItem("pending_game_score");
            console.log("Score successfully attached to your new account!");
          }
        })
        .catch((err) => console.error("Failed to sync score:", err))
        .finally(() => {
          setIsSyncing(false);
          window.location.reload();
        });
    } else {
      console.log(currentUserId);
      console.log(duelData);
      console.log("isCreator: ", isCreator);
      console.log("isOpponent: ", isOpponent);
    }
  }, []);

  const handleShareLink = async () => {
    const shareData = {
      title: "ForgeWord Match Link",
      text: `Can you beat me in this forgeword challenge?`,
      url: url, // Or a specific dynamic share URL like `/match/${duelData.id}`
    };

    try {
      // Check if the browser supports native sharing (most mobiles do)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!"); // Replace with your own toast notification
      }
    } catch (err) {
      console.error("Error sharing link:", err);
    }
  };

  if (isSyncing) {
    return <div style={{ marginTop: "4rem" }}>Preparing your account...</div>;
  }

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

      <ReplayBoard matchEnded={bothFinished} duelData={duelData} currentUserId={currentUserId} />

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
              onClick={handleShareLink}
              fixWidth
              styles={{
                padding: "0.7rem",
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
      {(isGuest(duelData.creatorId) || isGuest(duelData.opponentId)) && (
        <p
          style={{
            background: "#ededed",
            padding: "0.5rem",
            border: "1px solid #bcbcbc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            margin: "0.5rem 0",
            fontSize: "0.8rem"
          }}
        >
          <Info size={20} />
          Challenge is in guest mode. It will not be saved in ForgeWord leaderboard.
        </p>
      )}
    </div>
  );
}
