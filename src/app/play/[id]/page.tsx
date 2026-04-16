import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { challenges, users } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation"; // <--- ADD THIS
import PlayArea from "@/components/PlayArea/PlayArea";
import AcceptChallengeForm from "./AcceptChallengeForm"; 

export async function generateMetadata() {
  return { title: "ForgeWord | Duel" };
}

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  const challengeResult = await db
    .select({ challenge: challenges, creatorName: users.name })
    .from(challenges)
    .leftJoin(users, eq(challenges.creatorId, users.id))
    .where(eq(challenges.id, id))
    .limit(1);

  if (!challengeResult || challengeResult.length === 0) {
    return <div style={{ textAlign: "center", padding: "4rem" }}><h2>Not Found</h2></div>;
  }

  const { challenge, creatorName } = challengeResult[0];
  const challengerFirstName = creatorName?.split(" ")[0] || "Guest";
  const isCreator = currentUserId === challenge.creatorId;
  const isOpponent = currentUserId === challenge.opponentId;

  // WORKFLOW A: PENDING
  if (challenge.status === "pending") {
    if (isCreator) {
      return (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2>Waiting for Opponent...</h2>
          <div style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
            <code>{`http://localhost:3000/play/${id}`}</code>
          </div>
        </div>
      );
    } else {
      return <AcceptChallengeForm challengeId={id} challengerName={challengerFirstName} currentUserId={currentUserId} />;
    }
  }

  // WORKFLOW B: THE DUEL

  // Check if they have already  played
  const myGuesses = isCreator ? challenge.playerA_Guesses : challenge.playerB_Guesses;
  const validGuesses = Array.isArray(myGuesses) 
    ? myGuesses.filter((guess) => guess && guess.trim() !== "") 
    : [];
  const myWordTarget = isCreator ? challenge.wordForA : challenge.wordForB;
  const iHaveFinishedPlaying = validGuesses && (validGuesses.length === 6) || (validGuesses.includes(myWordTarget || ""));

  // If game is over, OR they already did their part, REDIRECT TO STATUS ROUTE
  if (iHaveFinishedPlaying) {
    redirect(`/status/${id}`);
  }
  
  if (!isCreator && !isOpponent && currentUserId !== null) {
     return <div style={{ textAlign: "center", padding: "4rem" }}><h2>Spectator Mode</h2></div>;
  }

  const targetWord = isCreator ? challenge.wordForA! : challenge.wordForB;

  return (
    <PlayArea
      targetWord={targetWord}
      challengeId={id}
      challengerName={challengerFirstName}
      isCreator={isCreator} 
    />
  );
}