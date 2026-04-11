import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { games, challenges } from "@/app/db/schema";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path to your auth config

export async function POST(request: Request) {
  try {
    // 1. Verify the user is actually logged in
    const session = await getServerSession(authOptions); // pass authOptions if needed
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetWord } = body; // We no longer trust the frontend to send the ID

    if (!targetWord || targetWord.length !== 5) {
      return NextResponse.json({ error: "Invalid word length" }, { status: 400 });
    }

    // 2. Use the secure ID from the session
    const secureCreatorId = session.user.id;

    const [newGame] = await db
      .insert(games)
      .values({ targetWord: targetWord.toLowerCase(), status: "active" })
      .returning({ id: games.id });

    const [newChallenge] = await db
      .insert(challenges)
      .values({ gameId: newGame.id, creatorId: secureCreatorId })
      .returning({ id: challenges.id });

    return NextResponse.json({ challengeId: newChallenge.id });

  } catch (error) {
    console.error("Failed to create challenge:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}