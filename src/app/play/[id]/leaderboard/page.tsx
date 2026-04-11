import { db } from "@/app/db/index";
import { leaderboard, challenges, games } from "@/app/db/schema";
import { eq, asc } from "drizzle-orm";
import { Trophy, Medal, Clock } from "lucide-react";
import Link from "next/link";
import styles from "./leaderboard.module.css"; // Reuse your existing styles!

export default async function ChallengeLeaderboardPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  // 1. Fetch the challenge and game details
  const challengeInfo = await db
    .select({
      word: games.targetWord,
    })
    .from(challenges)
    .innerJoin(games, eq(challenges.gameId, games.id))
    .where(eq(challenges.id, id))
    .limit(1);

  if (!challengeInfo.length) {
    return (
      <main className={styles.container}>
        <div className={styles.emptyState}>
          <h2>Challenge Not Found</h2>
          <p>This challenge link doesn't exist or has been removed.</p>
        </div>
      </main>
    );
  }

  // 2. Fetch all scores for this specific challenge
  const scores = await db
    .select({
      playerName: leaderboard.playerName,
      guessesUsed: leaderboard.guessesUsed,
      timeSeconds: leaderboard.timeSeconds, // If you plan to add a timer!
    })
    .from(leaderboard)
    .where(eq(leaderboard.challengeId, id))
    .orderBy(asc(leaderboard.guessesUsed)); // Rank by fewest guesses

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Challenge Leaderboard</h1>
        <p className={styles.wordTitle}>
          Target Word: <strong>{challengeInfo[0].word.toUpperCase()}</strong>
        </p>
        <Link href={`/play/${id}`} className={styles.playLink}>
          Back to Game
        </Link>
      </header>

      {scores.length === 0 ? (
        <div className={styles.emptyState}>
          <Trophy size={48} color="#d3d6da" />
          <h2>No one has played yet!</h2>
          <p>Be the first to submit a score for this challenge.</p>
        </div>
      ) : (
        <section className={styles.boardCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Guesses</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={index}>
                  <td className={styles.rankCol}>
                    {index === 0 ? <Medal size={18} color="#c9b458" /> : `#${index + 1}`}
                  </td>
                  <td className={styles.nameCol}>{score.playerName}</td>
                  <td className={styles.scoreCol}>
                    <span className={styles.guessPill}>{score.guessesUsed}/6</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}