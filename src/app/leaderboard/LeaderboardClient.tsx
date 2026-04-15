"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./leaderboard.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleIcon } from "../page";
import { signIn } from "next-auth/react";
import AppButton from "@/components/Buttons/AppButton";

// UPDATE: Add efficiencyScore to the types
type ScoreEntry = { 
  playerName: string; 
  playerId: string | null; 
  guessesUsed: number;
  efficiencyScore: number; 
};

type GroupedData = Record<
  string,
  { word: string; challenger: string; scores: ScoreEntry[] }
>;

interface LeaderboardClientProps {
  groupedData: GroupedData;
  currentUserId: string;
}

export default function LeaderboardClient({
  groupedData,
  currentUserId,
}: LeaderboardClientProps) {
  if (!groupedData || Object.keys(groupedData).length === 0) {
    return (
      <AppButton 
        onClick={() => signIn("google", { callbackUrl: window.location.href })} 
        text="Log in with Google" 
        startIcon={<GoogleIcon />} 
        fixWidth 
      />
    );
  }
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlChallengeId = searchParams.get("challenge");
  const challengeIds = Object.keys(groupedData);

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (urlChallengeId && challengeIds.includes(urlChallengeId)) {
      return urlChallengeId;
    }
    return challengeIds[0] || "";
  });

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedId(newId);
    router.replace(`/leaderboard?challenge=${newId}`);
  };

  if (!selectedId || !groupedData[selectedId]) return null;

  const activeData = groupedData[selectedId];

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        <label htmlFor="challenge-select" className={styles.dropdownLabel}>
          Select Challenge:
        </label>
        <select
          id="challenge-select"
          value={selectedId}
          onChange={handleDropdownChange}
          className={styles.dropdown}
        >
          {challengeIds.map((id) => (
            <option key={id} value={id}>
              {groupedData[id].word.toUpperCase()} (from {groupedData[id].challenger})
            </option>
          ))}
        </select>
      </div>

      <section className={styles.boardCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.wordTitle}>
            <span style={{fontSize: "1.2rem", fontWeight: "400"}}>Word: </span>
            {activeData.word.toUpperCase()}
          </h3>
          <Link href={`/play/${selectedId}`} className={styles.playLink}>
            View Challenge
          </Link>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Efficiency IQ</th> {/* NEW COLUMN */}
                <th>Guesses</th>
              </tr>
            </thead>
            <tbody>
              {activeData.scores.map((score, index) => {
                const isMe = score.playerId === currentUserId;
                return (
                  <tr key={index} className={isMe ? styles.highlightRow : ""}>
                    <td className={styles.rankCol}>
                      {`${index + 1}.`}
                    </td>
                    <td className={styles.nameCol}>
                      {score.playerName.split(" ")[0]}
                      {isMe && <span className={styles.youBadge}> (You)</span>}
                    </td>
                    {/* Render the Efficiency Score, rounded to 1 decimal */}
                    <td className={styles.scoreCol}>
                      <strong>{score.efficiencyScore.toFixed(1)}</strong>
                    </td>
                    <td className={styles.scoreCol}>
                      <span className={styles.guessPill}>
                        {score.guessesUsed}/6
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}