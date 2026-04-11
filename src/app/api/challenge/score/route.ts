import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { leaderboard } from "@/app/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { and, eq } from "drizzle-orm"; // Add these imports

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { challengeId, guessesUsed } = body;

    // 1. Check if the user ALREADY has a score for this specific challenge
    const existingScore = await db
      .select()
      .from(leaderboard)
      .where(
        and(
          eq(leaderboard.challengeId, challengeId),
          eq(leaderboard.playerId, session.user.id)
        )
      )
      .limit(1);

    // 2. If they already played, just return success without saving a duplicate!
    if (existingScore.length > 0) {
      return NextResponse.json({ success: true, message: "Score already exists" });
    }

    // 3. If no score exists, insert the new one
    await db.insert(leaderboard).values({
      challengeId: challengeId,
      playerId: session.user.id,
      playerName: session.user.name || "Anonymous",
      guessesUsed: guessesUsed,
      timeSeconds: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save score:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}