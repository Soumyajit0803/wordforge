import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { challenges, users } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import ChallengeStats from "./ChallengeStats";

export default async function StatusPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  let currentUserId = session?.user?.id || null;
  let isGuest = false;

  // 1. If no active session, check for the guest cookie
  if (!currentUserId) {
    const cookieStore = await cookies();
    const guestProfileStr = cookieStore.get("guest_profile")?.value;

    if (guestProfileStr) {
      try {
        const guestProfile = JSON.parse(guestProfileStr);
        currentUserId = guestProfile.id;
        isGuest = true;
      } catch (e) {
        console.error("Failed to parse guest cookie", e);
      }
    }
  }

  // 2. Fetch challenge data
  const challengeResult = await db
    .select({
      challenge: challenges,
      creatorName: users.name,
    })
    .from(challenges)
    .leftJoin(users, eq(challenges.creatorId, users.id))
    .where(eq(challenges.id, id))
    .limit(1);

  if (!challengeResult || challengeResult.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h2>Challenge Not Found</h2>
      </div>
    );
  }

  const { challenge, creatorName } = challengeResult[0];
  let creatorFirstName = creatorName ? creatorName.split(" ")[0] : challenge.creatorId.split("-")[0];

  const isCreator = currentUserId === challenge.creatorId;
  const isOpponent = currentUserId === challenge.opponentId;

  let opponent;

  // 3. Fetch opponent data
  if (challenge.opponentId) {
    [opponent] = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, challenge.opponentId))
      .limit(1);
      
    if (!opponent) {
      opponent = { name: challenge.opponentId.split("-")[0] };
    }
  } else {
    opponent = { name: "TBD" };
  }

  // 4. Calculate game states
  const myGuesses = isCreator ? challenge.playerA_Guesses : challenge.playerB_Guesses;
  const myEfficiency = (isCreator ? challenge.playerA_Efficiency : challenge.playerB_Efficiency) || 0;
  const opponentEfficiency = (isCreator ? challenge.playerB_Efficiency : challenge.playerA_Efficiency) || 0;
  const opponentGuesses = isCreator ? challenge.playerB_Guesses : challenge.playerA_Guesses;

  const meFinishedPlaying = Boolean(
    myGuesses &&
    ((myGuesses.length === 6 && myGuesses[5].length === 5) ||
      myGuesses.includes(isCreator ? challenge.wordForA : challenge.wordForB))
  );

  const opponentFinishedPlaying = Boolean(
    opponentGuesses &&
    ((opponentGuesses.length === 6 && opponentGuesses[5].length === 5) ||
      opponentGuesses.includes(isCreator ? challenge.wordForB : challenge.wordForA))
  );

  console.log("Play status: ", meFinishedPlaying, opponentFinishedPlaying)

  const bothFinished = meFinishedPlaying && opponentFinishedPlaying;

  const duelData = {
    ...challenge,
    creatorName: creatorFirstName,
    opponentName: opponent?.name || "Guest Opponent",
  };

  // 5. Pass everything to the Client Component
  return (
    <ChallengeStats
      id={id}
      currentUserId={currentUserId}
      duelData={duelData}
      bothFinished={bothFinished}
      meFinishedPlaying={meFinishedPlaying}
      hasOpponent={!!challenge.opponentId}
      isCreator={isCreator}
      isOpponent={isOpponent}
      myEfficiency={myEfficiency}
      opponentEfficiency={opponentEfficiency}
    />
  );
}