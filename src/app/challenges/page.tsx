import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { challenges, users } from "@/app/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import styles from "./history.module.css";
import DuelHistoryClient from "./DuelHistoryClient";
import AppButton from "@/components/Buttons/AppButton";
import { Swords } from "lucide-react";

export async function generateMetadata() {
  return {
    title: "ForgeWord | My Duels",
    description: "View your past 1v1 battle logs.",
  };
}

export default async function MyChallengesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h2>Members Only</h2>
          <p>Please log in to view your match history.</p>
        </div>
      </main>
    );
  }

  const userId = session.user.id;

  // Fetch all completed 1v1 duels for this user
  const myDuels = await db
    .select({
      id: challenges.id,
      creatorId: challenges.creatorId,
      opponentId: challenges.opponentId,
      wordForB: challenges.wordForB,
      wordForA: challenges.wordForA,
      playerA_Efficiency: challenges.playerA_Efficiency,
      playerB_Efficiency: challenges.playerB_Efficiency,
      winnerId: challenges.winnerId,
      completedAt: challenges.completedAt,
    })
    .from(challenges)
    .where(
      and(
        or(eq(challenges.creatorId, userId), eq(challenges.opponentId, userId)),
        eq(challenges.status, "completed")
      )
    )
    .orderBy(desc(challenges.completedAt));

  if (myDuels.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <Swords size={80} color="#d3d6da" />
          <h2>No Battle History</h2>
          <p>You haven't completed any duels yet. Go set a trap or accept a challenge!</p>
        </div>
        <AppButton text="Create Challenge" routeURL="/challenges/create" fixWidth />
      </main>
    );
  }

  // Format the data so the client component doesn't have to do the heavy lifting
  const formattedHistory = myDuels.map((duel) => {
    const isCreator = duel.creatorId === userId;
    
    // If I am the creator, I guess wordForA. My opponent guesses wordForB.
    const myWordToGuess = isCreator ? duel.wordForA : duel.wordForB;
    const myIQ = isCreator ? duel.playerA_Efficiency : duel.playerB_Efficiency;
    const opponentIQ = isCreator ? duel.playerB_Efficiency : duel.playerA_Efficiency;
    
    let outcome = "DRAW";
    if (duel.winnerId === userId) outcome = "WON";
    if (duel.winnerId !== userId && duel.winnerId !== "DRAW") outcome = "LOST";

    return {
      id: duel.id,
      date: duel.completedAt?.toLocaleDateString() || "Unknown Date",
      myWordToGuess: myWordToGuess || "???",
      myIQ: myIQ || 0,
      opponentIQ: opponentIQ || 0,
      outcome,
    };
  });

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Duel History</h1>
        <p>Your past 1v1 matches and Efficiency IQ outcomes.</p>
      </header>

      <DuelHistoryClient history={formattedHistory} />
    </main>
  );
}