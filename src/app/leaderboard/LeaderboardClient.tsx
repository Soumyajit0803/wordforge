"use client";

import { useState } from "react";
import { Medal } from "lucide-react";
import Link from "next/link";
import styles from "./leaderboard.module.css";

// Define the shape of our props
type ScoreEntry = { playerName: string; playerId: string; guessesUsed: number };
type GroupedData = Record<string, { word: string; challenger: string; scores: ScoreEntry[] }>;

interface LeaderboardClientProps {
  groupedData: GroupedData;
  currentUserId: string;
}

export default function LeaderboardClient({ groupedData, currentUserId }: LeaderboardClientProps) {
  // Extract all challenge IDs to use as keys/options
  const challengeIds = Object.keys(groupedData);
  
  // State to track which challenge is currently selected in the dropdown
  // Default to the first one in the list
  const [selectedId, setSelectedId] = useState<string>(challengeIds[0]);

  // Get the data for the currently selected challenge
  const activeData = groupedData[selectedId];

  return (
    <div className={styles.boardsWrapper}>
      
      {/* --- THE DROPDOWN CONTROLS --- */}
      <div className={styles.controls}>
        <label htmlFor="challenge-select" className={styles.dropdownLabel}>
          Select Challenge:
        </label>
        <select 
          id="challenge-select"
          value={selectedId} 
          onChange={(e) => setSelectedId(e.target.value)}
          className={styles.dropdown}
        >
          {challengeIds.map((id) => (
            <option key={id} value={id}>
              {groupedData[id].word.toUpperCase()} (from {groupedData[id].challenger})
            </option>
          ))}
        </select>
      </div>

      {/* --- THE ACTIVE TABLE --- */}
      <section className={styles.boardCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.wordTitle}>Word: {activeData.word.toUpperCase()}</h3>
          <Link href={`/play/${selectedId}`} className={styles.playLink}>
            Play Again
          </Link>
        </div>

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
                    {index === 0 ? <Medal size={18} color="#c9b458" /> : `#${index + 1}`}
                  </td>
                  <td className={styles.nameCol}>
                    {score.playerName} {isMe && <span className={styles.youBadge}>(You)</span>}
                  </td>
                  <td className={styles.scoreCol}>
                    <span className={styles.guessPill}>{score.guessesUsed}/6</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}