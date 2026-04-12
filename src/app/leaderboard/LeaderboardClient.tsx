"use client";

import { useState } from "react";
import { Medal } from "lucide-react";
import Link from "next/link";
import styles from "./leaderboard.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleIcon } from "../page";
import { signIn } from "next-auth/react";
import AppButton from "@/components/Buttons/AppButton";

// Define the shape of our props
type ScoreEntry = { playerName: string; playerId: string; guessesUsed: number };
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
  // Extract all challenge IDs to use as keys/options
  if(!groupedData || Object.keys(groupedData).length === 0) {
    return (
      <AppButton onClick={() => signIn("google", { callbackUrl: window.location.href })} text="Log in with Google" startIcon={<GoogleIcon />} fixWidth />
    );
  }
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlChallengeId = searchParams.get("challenge");
  const challengeIds = Object.keys(groupedData);

  // State to track which challenge is currently selected in the dropdown
  // Default to the first one in the list
  const [selectedId, setSelectedId] = useState<string>(() => {
    // If the URL has an ID and it exists in our data, select it!
    if (urlChallengeId && challengeIds.includes(urlChallengeId)) {
      return urlChallengeId;
    }
    // Otherwise, fallback to the first item
    return challengeIds[0] || "";
  });

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedId(newId);
    // Replace the URL so it's shareable/bookmarkable
    router.replace(`/leaderboard?challenge=${newId}`);
  };

  if (!selectedId || !groupedData[selectedId]) return null;

  // Get the data for the currently selected challenge
  const activeData = groupedData[selectedId];

  return (
    <div className={styles.wrapper}>
      {/* --- THE DROPDOWN CONTROLS --- */}
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
              {groupedData[id].word.toUpperCase()} (from{" "}
              {groupedData[id].challenger})
            </option>
          ))}
        </select>
      </div>

      {/* --- THE ACTIVE TABLE --- */}
      <section className={styles.boardCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.wordTitle}>
            <span style={{fontSize: "1.2rem", fontWeight: "400"}}>Word: </span>{activeData.word.toUpperCase()}
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
                <th>Guesses</th>
              </tr>
            </thead>
            <tbody>
              {activeData.scores.map((score, index) => {
                const isMe = score.playerId === currentUserId;
                return (
                  <tr key={index} className={isMe ? styles.highlightRow : ""}>
                    <td className={styles.rankCol}>
                      {(
                        `${index + 1}.`
                      )}
                    </td>
                    <td className={styles.nameCol}>
                      {score.playerName.split(" ")[0]}
                      {isMe && <span className={styles.youBadge}>(You)</span>}
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
