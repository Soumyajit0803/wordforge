import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { challenges, users } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import PlayArea from "@/components/PlayArea/PlayArea";
import AcceptChallengeForm from "./AcceptChallengeForm"; // You will create this small client component

export async function generateMetadata() {
  return {
    title: "ForgeWord | Duel",
    description: "Enter the arena and solve the challenge!",
  };
}

export default async function ChallengePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  // Use session ID if logged in, otherwise we will rely on a guest cookie/local state later
  const currentUserId = session?.user?.id || null;

  // 1. Fetch the unified Challenge Data
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
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#787c7e" }}>
        <h2>Challenge Not Found</h2>
        <p>This link might be invalid or has expired.</p>
      </div>
    );
  }

  const { challenge, creatorName } = challengeResult[0];
  const challengerFirstName = creatorName?.split(" ")[0] || "Guest";

  // 2. Identify the User's Role
  const isCreator = currentUserId === challenge.creatorId;
  const isOpponent = currentUserId === challenge.opponentId;

  // ==========================================
  // WORKFLOW A: THE HANDSHAKE (STATUS: PENDING)
  // ==========================================
  if (challenge.status === "pending") {
    if (isCreator) {
      return (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2>Waiting for Opponent...</h2>
          <p>Send this URL to a friend. Once they submit a word for you, the duel begins!</p>
          <div style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0", borderRadius: "8px" }}>
            <code>{`http://localhost:3000/play/${id}`}</code>
          </div>
        </div>
      );
    } else {
      // It's a new user opening the link! Force them to lock it.
      return (
        <AcceptChallengeForm 
          challengeId={id} 
          challengerName={challengerFirstName} 
          currentUserId={currentUserId}
        />
      );
    }
  }

  // ==========================================
  // WORKFLOW B: THE DUEL (STATUS: ACTIVE / COMPLETED)
  // ==========================================
  
  // Security check: If it's active, only the two locked players should see the board
  if (!isCreator && !isOpponent && currentUserId !== null) {
     return (
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h2>Spectator Mode</h2>
          <p>This duel is already in progress between two other players!</p>
        </div>
     );
  }

  // Determine which word they need to guess based on who they are
  // Creator (Player A) guesses WordForA. Opponent (Player B) guesses WordForB.
  const targetWord = isCreator ? challenge.wordForA! : challenge.wordForB;

  return (
    <PlayArea
      targetWord={targetWord}
      challengeId={id}
      challengerName={challengerFirstName}
      isCreator={isCreator} // Pass this down so PlayArea knows which column to update in DB
    />
  );
}