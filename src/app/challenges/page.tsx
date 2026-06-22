import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { challenges, users } from "@/app/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import styles from "./history.module.css";
import DuelHistoryClient from "./DuelHistoryClient";
import AppButton from "@/components/Buttons/AppButton";
import { Swords } from "lucide-react";

export async function generateMetadata() {
  return {
    title: "ForgeWord | My Duels",
    description: "Your ForgeWord match history.",
  };
}

export default async function MyChallengesPage() {
  // 1. Check for logged-in user session
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;
  let isGuest = false;

  // 2. If no active session, check for the guest cookie
  if (!userId) {
    const cookieStore = await cookies();
    const guestProfileStr = cookieStore.get("guest_profile")?.value;
    
    if (guestProfileStr) {
      try {
        const guestProfile = JSON.parse(guestProfileStr);
        userId = guestProfile.id;
        isGuest = true;
      } catch (e) {
        console.error("Failed to parse guest cookie", e);
      }
    }
  }

  // 3. Handle state where user is not logged in and has no guest cookie yet
  if (!userId) {
    return <div>Loading User...</div>; // Or redirect them to a setup route
  }

  // 4. Handle Guest State (Members Only logic)
  if (isGuest) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <h2>Members Only</h2>
          <p>Please log in to view your challenges.</p>
        </div>
      </main>
    );
  }

  // 5. Proceed with Database Query for Authenticated Users
  const creatorAlias = alias(users, "creator");
  const opponentAlias = alias(users, "opponent");

  const myDuelsRaw = await db
    .select({
      duel: challenges,
      creatorName: creatorAlias.name,
      opponentName: opponentAlias.name,
    })
    .from(challenges)
    .leftJoin(creatorAlias, eq(challenges.creatorId, creatorAlias.id))
    .leftJoin(opponentAlias, eq(challenges.opponentId, opponentAlias.id))
    .where(or(eq(challenges.creatorId, userId), eq(challenges.opponentId, userId)))
    .orderBy(desc(challenges.createdAt));

  if (myDuelsRaw.length === 0) {
    return (
      <main className={styles.container}>
        <div className={styles.header}>
          <Swords size={80} color="#d3d6da" />
          <h2>No Battle History</h2>
          <p>You haven't initiated or accepted any duels yet.</p>
        </div>
        <AppButton text="Create Challenge" routeURL="/challenges/create" fixWidth />
      </main>
    );
  }

  const formattedDuels = myDuelsRaw.map((row) => {
    const { duel, creatorName, opponentName } = row;
    const isCreator = duel.creatorId === userId;
    
    let opponentDisplay = "TBD";
    if (duel.wordForA !== "") { // opponent determined
      opponentDisplay = !isCreator ? (creatorName || "Guest") : (opponentName || "Guest");
    }

    return {
      id: duel.id,
      date: (duel.completedAt || duel.createdAt).toLocaleDateString(),
      opponent: opponentDisplay,
      winStatus: duel.winnerId==='DRAW'?'DRAW':(duel.winnerId===userId?"WON":"LOST")
    };
  });

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Duel History</h1>
        <p>Your active and completed matches.</p>
      </header>

      <DuelHistoryClient duels={formattedDuels} />
    </main>
  );
}