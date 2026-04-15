import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
// UPDATE: Import matchResults instead of leaderboard, and remove games
import { matchResults, challenges, users } from "@/app/db/schema";
// UPDATE: Import desc for sorting by highest efficiency
import { eq, inArray, desc } from "drizzle-orm";
import { PackageOpen } from "lucide-react";
import styles from "./leaderboard.module.css";
import LeaderboardClient from "./LeaderboardClient"; 
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

  // 1. Find all challenges the user has played using the new matchResults table
  const userAttempts = await db
    .select({ challengeId: matchResults.challengeId })
    .from(matchResults)
    .where(eq(matchResults.playerId, userId));

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

  // 2. Fetch the match results, the Challenge data, and the Creator's Name
  const rawLeaderboards = await db
    .select({
      challengeId: matchResults.challengeId,
      playerName: matchResults.playerName,
      playerId: matchResults.playerId,
      guessesUsed: matchResults.guessesUsed,
      efficiencyScore: matchResults.efficiencyScore, // Fetch the new metric!
      targetWord: challenges.wordForB, // Use wordForB from the merged challenges table
      challengerName: users.name, 
    })
    .from(matchResults)
    .innerJoin(challenges, eq(matchResults.challengeId, challenges.id))
    // Use leftJoin for users just in case the creator was a Guest and has no user row
    .leftJoin(users, eq(challenges.creatorId, users.id)) 
    .where(inArray(matchResults.challengeId, playedChallengeIds))
    // Sort by the smartest player first!
    .orderBy(desc(matchResults.efficiencyScore)); 

  // 3. Group the data for the Client Component
  // Update the type to include efficiencyScore
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

  const groupedData: GroupedData = {};

  rawLeaderboards.forEach((entry) => {
    if (!groupedData[entry.challengeId]) {
      groupedData[entry.challengeId] = {
        word: entry.targetWord,
        challenger: entry.challengerName || "Guest Challenger",
        scores: [],
      };
    }
    groupedData[entry.challengeId].scores.push({
      playerName: entry.playerName,
      playerId: entry.playerId,
      guessesUsed: entry.guessesUsed,
      efficiencyScore: entry.efficiencyScore,
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