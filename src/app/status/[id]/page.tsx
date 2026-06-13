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
  const myEfficiency = (isCreator ? challenge.playerA_Efficiency : challenge.playerB_Efficiency) || 0;
  const opponentEfficiency = (isCreator ? challenge.playerB_Efficiency : challenge.playerA_Efficiency) || 0;
  const opponentGuesses = isCreator ? challenge.playerB_Guesses : challenge.playerA_Guesses;

  const meFinishedPlaying = myGuesses && ((myGuesses.length===6 && myGuesses[5].length===5) || myGuesses.includes(isCreator ? challenge.wordForA : challenge.wordForB));
  const opponentFinishedPlaying = opponentGuesses && ((opponentGuesses.length===6 && opponentGuesses[5].length===5) || opponentGuesses.includes(isCreator ? challenge.wordForB : challenge.wordForA));

  const bothFinished = meFinishedPlaying && opponentFinishedPlaying;
  console.log(challenge)


  return (
    <div style={{ padding: "5rem 1rem",
      display: "flex", flexDirection: "column", alignItems: "center"
     }}>
      <div style={{
        background: !bothFinished?"var(--green)":"var(--blue)",
        padding: "1rem",
        width: "fit-content",
        color: "#fff",
        borderRadius: "5rem",
      }}>{! bothFinished ? 'Active challenge!' : 'Challenge completed!'}</div>
      <ReplayBoard 
        duelData={{
          ...challenge,
          creatorName: challengerFirstName,
          opponentName: "Opponent" 
        }} 
        currentUserId={currentUserId} 
      />

      {/* If the game is active but they HAVEN'T played yet, give them a button to go to the PlayArea */}
      {!meFinishedPlaying && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", marginTop: "2rem", gap: "1rem" }}>
            <p style={{textAlign: "center", width: "70vw"}}>Seems like you have not yet finished your challenge yet. Complete your challenge now!</p>

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
      {
        bothFinished && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", marginTop: "2rem", gap: "1rem" }}>
            <p style={{textAlign: "center", width: "70vw"}}>
              {myEfficiency === opponentEfficiency
                ? "It's a tie! Both you and your opponent had the same efficiency score. Great minds think alike!"
                : myEfficiency > opponentEfficiency
                  ? "Wow! You won! You had a higher efficiency score than your opponent."
                  : "Dang! You lost! Your opponent had a higher efficiency score than you."
              }
            </p>
          </div>

        )
      }
    </div>
  );
}