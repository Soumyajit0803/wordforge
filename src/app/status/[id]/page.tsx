import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/db/index";
import { challenges, users } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import ReplayBoard from "@/components/ReplayBoard/ReplayBoard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function StatusPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

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
  const challengerFirstName = creatorName?.split(" ")[0] || "Guest";
  
  const isCreator = currentUserId === challenge.creatorId;
  const myGuesses = isCreator ? challenge.playerA_Guesses : challenge.playerB_Guesses;
  const iHaveFinishedPlaying = Array.isArray(myGuesses) && myGuesses.length > 0;

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <ReplayBoard 
        duelData={{
          ...challenge,
          creatorName: challengerFirstName,
          opponentName: "Opponent" 
        }} 
        currentUserId={currentUserId} 
      />

      {/* If the game is active but they HAVEN'T played yet, give them a button to go to the PlayArea */}
      {challenge.status === "active" && !iHaveFinishedPlaying && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <Link 
            href={`/play/${id}`} 
            style={{
              display: "flex", alignItems: "center", gap: "8px", background: "#1a1a1b", 
              color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold"
            }}
          >
            Go to Play Area <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </div>
  );
}