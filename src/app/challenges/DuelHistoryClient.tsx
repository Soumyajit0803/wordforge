"use client";

import styles from "./history.module.css";
import Link from "next/link";

type DuelRecord = {
  id: string;
  date: string;
  myWordToGuess: string;
  myIQ: number;
  opponentIQ: number;
  outcome: string;
};

export default function DuelHistoryClient({ history }: { history: DuelRecord[] }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Target Word</th>
              <th>My IQ</th>
              <th>Opponent IQ</th>
              <th>Result</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((duel) => (
              <tr key={duel.id}>
                <td className={styles.dateCol}>{duel.date}</td>
                <td className={styles.wordCol}>{duel.myWordToGuess.toUpperCase()}</td>
                <td className={styles.iqCol}>
                  <strong>{duel.myIQ.toFixed(1)}</strong>
                </td>
                <td className={styles.iqCol}>{duel.opponentIQ.toFixed(1)}</td>
                <td className={styles.outcomeCol}>
                  <span
                    className={
                      duel.outcome === "WON"
                        ? styles.pillWon
                        : duel.outcome === "LOST"
                        ? styles.pillLost
                        : styles.pillDraw
                    }
                  >
                    {duel.outcome}
                  </span>
                </td>
                <td>
                  {/* Replay link for future GSAP board playback */}
                  <Link href={`/play/${duel.id}`} className={styles.replayLink}>
                    View Board
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}