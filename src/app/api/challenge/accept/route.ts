import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { challenges } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, wordForA, opponentId } = body;

    // 1. Basic Validation
    if (!challengeId || !wordForA || wordForA.length !== 5) {
      return NextResponse.json(
        { error: "Invalid data provided. Word must be exactly 5 letters." },
        { status: 400 }
      );
    }

    // 2. Fetch current state to ensure it hasn't been hijacked
    const existingChallenge = await db
      .select({ status: challenges.status })
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!existingChallenge || existingChallenge.length === 0) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    if (existingChallenge[0].status !== "pending") {
      return NextResponse.json(
        { error: "Too late! This duel is already in progress with someone else." },
        { status: 403 }
      );
    }

    // 3. The Atomic Update (The "Lock")
    // By strictly requiring status to be 'pending' in the WHERE clause, 
    // PostgreSQL guarantees that even if two people submit at the exact 
    // same millisecond, only ONE person can lock the row.
    const updatedChallenge = await db
      .update(challenges)
      .set({
        wordForA: wordForA.toUpperCase(), // Ensure consistency
        opponentId: opponentId || null,   // Null is perfectly fine for Guests
        status: "active",
      })
      .where(
        and(
          eq(challenges.id, challengeId),
          eq(challenges.status, "pending")
        )
      )
      // returning() is a Postgres specific feature that lets us confirm the update worked
      .returning({ id: challenges.id }); 

    if (updatedChallenge.length === 0) {
      return NextResponse.json(
        { error: "Failed to lock the duel. It may have just been claimed." },
        { status: 409 }
      );
    }

    // 4. Success!
    return NextResponse.json({ 
      success: true, 
      message: "Duel locked! Prepare for battle." 
    });

  } catch (error) {
    console.error("Error in /api/challenge/accept:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}