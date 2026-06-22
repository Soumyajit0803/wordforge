import { db } from "@/app/db/index";
import { users, userStats } from "@/app/db/schema";
import { desc, gt } from "drizzle-orm";
import styles from "./leaderboard.module.css";
import { Trophy } from "lucide-react";
import LeaderboardClient from "./LeaderboardClient";

export async function generateMetadata() {
  return {
    title: "ForgeWord | Global Leaderboard",
    description: "The top ranked players in the ForgeWord arena.",
  };
}

export default async function GlobalLeaderboardPage() {
  // Fetch the Top 50 players who have actually completed a game
  const topPlayers = await db
    .select({
      id: userStats.userId,
      name: userStats.playerName,
      gamesPlayed: userStats.totalGamesPlayed,
      totalWins: userStats.totalWins,
      averageIQ: userStats.averageEfficiencyScore,
      highestIQ: userStats.highestEfficiencyScore,
      winStreak: userStats.currentWinStreak
    })
    .from(userStats)
    .where(gt(userStats.totalGamesPlayed, 0)) // Must have played at least 1 game
    .orderBy(desc(userStats.averageEfficiencyScore))
    .limit(50);
  
    console.log("Top Players:", topPlayers); // Debugging line to check the fetched data

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Trophy size={48} color="#fbbc04" className={styles.trophyIcon} />
        <h1>Global Leaderboard</h1>
        <p>Ranked by Average Efficiency IQ across all duels.</p>
      </header>

      {topPlayers.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No games have been completed yet. Be the first to rank up!</p>
        </div>
      ) : (
        <LeaderboardClient players={topPlayers} />
      )}
    </main>
  );
}