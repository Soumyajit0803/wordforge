import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { leaderboard, challenges, games } from "@/app/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import styles from "../leaderboard/leaderboard.module.css"; // Reuse existing styles
import LeaderboardClient from "../leaderboard/LeaderboardClient"; // Reuse the Client Component!
import AppButton from "@/components/Buttons/AppButton";

export default async function MyChallengesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <main className={styles.container}>
        <h2>Members Only</h2>
        <p>Please log in to view your created challenges.</p>
        <Link href="/api/auth/signin" className={styles.primaryBtn}>Log In</Link>
      </main>
    );
  }

  const userId = session.user.id;

  // 1. Fetch ALL challenges created by this user
  const myCreatedChallenges = await db
    .select({
      challengeId: challenges.id,
      word: games.targetWord,
    })
    .from(challenges)
    .innerJoin(games, eq(challenges.gameId, games.id))
    .where(eq(challenges.creatorId, userId));

  const myChallengeIds = myCreatedChallenges.map((c) => c.challengeId);

  // If they haven't created any challenges, show empty state
  if (myChallengeIds.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.emptyState}>
          <h2>No Challenges Created</h2>
          <p>You haven't stumped anyone yet. Go create a word!</p>
          <AppButton text={"Create Challenge"} routeURL="/create" />
        </div>
      </main>
    );
  }

  // 2. Fetch the scores for these specific challenges
  const rawScores = await db
    .select({
      challengeId: leaderboard.challengeId,
      playerName: leaderboard.playerName,
      playerId: leaderboard.playerId,
      guessesUsed: leaderboard.guessesUsed,
    })
    .from(leaderboard)
    .where(inArray(leaderboard.challengeId, myChallengeIds))
    .orderBy(asc(leaderboard.guessesUsed));

  // 3. Group the data for the Client Component
  type ScoreEntry = { playerName: string; playerId: string; guessesUsed: number };
  type GroupedData = Record<string, { word: string; challenger: string; scores: ScoreEntry[] }>;
  
  const groupedData: GroupedData = {};

  // Initialize ALL created challenges first (so they show up even with 0 plays)
  myCreatedChallenges.forEach((challenge) => {
    groupedData[challenge.challengeId] = {
      word: challenge.word,
      challenger: "Me", // The dropdown will nicely read: "WORD (from Me)"
      scores: [],
    };
  });

  // Populate the ones that actually have scores
  rawScores.forEach((entry) => {
    // We already initialized the array above, so we just push
    groupedData[entry.challengeId].scores.push({
      playerName: entry.playerName,
      playerId: entry.playerId,
      guessesUsed: entry.guessesUsed,
    });
  });

  // 4. Render using the exact same Client Component
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>My Challenges</h1>
        <p>See who has attempted the words you created.</p>
      </header>

      <LeaderboardClient groupedData={groupedData} currentUserId={userId} />
    </main>
  );
}