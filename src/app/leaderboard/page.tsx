import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { leaderboard, challenges, games, users } from "@/app/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { PackageOpen, Trophy } from "lucide-react";
import styles from "./leaderboard.module.css";
import LeaderboardClient from "./LeaderboardClient"; // We will create this next!
import { Suspense } from "react";

export async function generateMetadata() {
  return {
    title: "ForgeWord | Leaderboard",
    description: "View your rankings on the challenges you've completed!",
  };
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h2>Members Only</h2>
          <p>Please log in to view leaderboards.</p>
        </div>
        <LeaderboardClient groupedData={{}} currentUserId={""} />
      </main>
    );
  }

  const userId = session.user.id;

  // 1. Find all challenges the user has played
  const userAttempts = await db
    .select({ challengeId: leaderboard.challengeId })
    .from(leaderboard)
    .where(eq(leaderboard.playerId, userId));

  const playedChallengeIds = [
    ...new Set(userAttempts.map((a) => a.challengeId)),
  ];

  if (playedChallengeIds.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <PackageOpen size={100} color="#d3d6da" />
          <h2>No Data Yet</h2>
          <p>
            You haven't completed any challenges. Go play some games to rank up!
          </p>
        </div>
      </main>
    );
  }

  // 2. Fetch the leaderboards AND the Creator's Name
  const rawLeaderboards = await db
    .select({
      challengeId: leaderboard.challengeId,
      playerName: leaderboard.playerName,
      playerId: leaderboard.playerId,
      guessesUsed: leaderboard.guessesUsed,
      targetWord: games.targetWord,
      challengerName: users.name, // Join with users table to get the creator's name
    })
    .from(leaderboard)
    .innerJoin(challenges, eq(leaderboard.challengeId, challenges.id))
    .innerJoin(games, eq(challenges.gameId, games.id))
    .innerJoin(users, eq(challenges.creatorId, users.id))
    .where(inArray(leaderboard.challengeId, playedChallengeIds))
    .orderBy(asc(leaderboard.guessesUsed));

  // 3. Group the data for the Client Component
  type ScoreEntry = {
    playerName: string;
    playerId: string;
    guessesUsed: number;
  };
  type GroupedData = Record<
    string,
    { word: string; challenger: string; scores: ScoreEntry[] }
  >;

  const groupedData: GroupedData = {};

  rawLeaderboards.forEach((entry) => {
    if (!groupedData[entry.challengeId]) {
      groupedData[entry.challengeId] = {
        word: entry.targetWord,
        // Provide a fallback if the left join returns null
        challenger: entry.challengerName,
        scores: [],
      };
    }
    groupedData[entry.challengeId].scores.push({
      // Provide fallbacks for the player data as well
      playerName: entry.playerName,
      playerId: entry.playerId,
      guessesUsed: entry.guessesUsed,
    });
  });

  // 4. Pass the data to the interactive Client Component
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Leaderboard</h1>
        <p>Rankings for the challenges you've completed.</p>
      </header>

      <Suspense
        fallback={<p style={{ textAlign: "center" }}>Loading your ranks...</p>}
      >
        <LeaderboardClient groupedData={groupedData} currentUserId={userId} />
      </Suspense>
    </main>
  );
}
