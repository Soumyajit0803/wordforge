import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { leaderboard, challenges, games } from "@/app/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import styles from "../leaderboard/leaderboard.module.css";
import LeaderboardClient from "../leaderboard/LeaderboardClient";
import AppButton from "@/components/Buttons/AppButton";
import { PackageOpen } from "lucide-react";

export async function generateMetadata() {
  return {
    title: "ForgeWord | My Challenges",
    description: "View the challenges you've created and see how others have fared against them!",
  };
}

export default async function MyChallengesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h2>Members Only</h2>
          <p>Please log in to view your created challenges.</p>
        </div>
        <LeaderboardClient groupedData={{}} currentUserId={""} /> {/* Show empty state of the same component for consistency */}
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
        <div className={styles.header}>
          <PackageOpen size={100} color="#d3d6da" />
          <h2>No Challenges Created</h2>
          <p>You haven't stumped anyone yet. Go create a word!</p>
        </div>
        <AppButton
          text={"Create Challenge"}
          routeURL="/challenges/create"
          fixWidth
          variant="primary"
        />
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
