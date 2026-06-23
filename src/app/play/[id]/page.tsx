import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
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
  let currentUserId:string = session?.user?.id  || "";
  let isGuest = false;

  console.log("Current User ID:", currentUserId);
  console.log(session);

  // if current user is not authenticated, make a guest profile
  if (!currentUserId) {
    const cookieStore = await cookies();
    const guestProfileStr = cookieStore.get("guest_profile")?.value;
    if (guestProfileStr) {
      try {
        const guestProfile = JSON.parse(guestProfileStr);
        currentUserId = guestProfile.id;
        isGuest = true;
      } catch (err) {
        console.error("Failed to parse guest profile", err);
        console.log("No guest profile found. Please visit later.")
      }
    }
  }

  // current state of challenge 
  const challengeResult = await db
    .select({ challenge: challenges, creatorName: users.name })
    .from(challenges)
    .leftJoin(users, eq(challenges.creatorId, users.id))
    .where(eq(challenges.id, id))
    .limit(1);
  console.log("Challenge Result: ", challengeResult);
  console.log("Challenge ID: ", id);

  if (!challengeResult || challengeResult.length === 0) {
    return <div style={{ textAlign: "center", padding: "4rem" }}><h2>Not Found</h2></div>;
  }

  const { challenge, creatorName } = challengeResult[0];
  let challengerFirstName;

  if(creatorName){
    challengerFirstName = creatorName?.split(" ")[0] || "Guest";
  } else {
    challengerFirstName = challenge.creatorId.split("-")[0];
  }
  var opponentFirstName = "Guest";
  if(challenge.opponentId) {
    const opponentResult = await db
      .select({ opponentName: users.name })
      .from(users)
      .where(eq(users.id, challenge.opponentId))
      .limit(1);

    opponentFirstName = opponentResult[0]?.opponentName.split(" ")[0] || challenge.opponentId.split("-")[0];
  }
  const isCreator = currentUserId === challenge.creatorId;
  const isOpponent = currentUserId === challenge.opponentId;

  // WORKFLOW A: Get the opponent
  if (challenge.wordForA==="") {
    if (isCreator) {
      redirect(`/status/${id}`);
    } else {
      return <AcceptChallengeForm challengeId={id} challengerName={challengerFirstName} currentUserId={currentUserId} />;
    }
  }

  // WORKFLOW B: Start the challenge/duel

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
  
  if (!isCreator && !isOpponent) {
     return <div style={{ textAlign: "center", padding: "4rem" }}><h2>Spectator Mode</h2></div>;
  }

  const targetWord = isCreator ? challenge.wordForA! : challenge.wordForB;

  return (
    <PlayArea
      targetWord={targetWord}
      challengeId={id}
      challengerName={!isCreator ? challengerFirstName : opponentFirstName}
      isCreator={isCreator} 
    />
  );
}