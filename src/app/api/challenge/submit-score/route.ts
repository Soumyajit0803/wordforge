import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { challenges, userStats, matchResults } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// --- THE EFFICIENCY ALGORITHM ---
// This calculates how "smart" the user played.
function calculateEfficiencyIQ(guesses: string[], targetWord: string): number {
  if (guesses.length === 0) return 0;
  
  let score = 100; // Base score
  const targetChars = targetWord.split("");
  const knownGrayLetters = new Set<string>();

  guesses.forEach((guess, index) => {
    // 1. Penalty for taking too many guesses (Logic > Luck)
    score -= (index * 2.5); 

    // 2. The "Waste" Penalty: Did they guess a letter they already knew was wrong?
    for (const char of guess) {
      if (knownGrayLetters.has(char)) {
        score -= 5; // -5 IQ points for wasting a keystroke on a dead letter!
      }
    }

    // 3. Update known gray letters for the next loop
    for (const char of guess) {
      if (!targetChars.includes(char)) {
        knownGrayLetters.add(char);
      }
    }
  });

  // Did they actually win? If the last guess isn't the target, massive penalty.
  const isWin = guesses[guesses.length - 1] === targetWord;
  if (!isWin) score -= 40;

  // Ensure score stays between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// --- THE MAIN ROUTE ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { challengeId, isCreator, guesses, targetWord } = body;

    if (!challengeId || !guesses || guesses.length === 0) {
      return NextResponse.json({ error: "Missing game data." }, { status: 400 });
    }

    // 1. Calculate this player's IQ
    const efficiencyScore = calculateEfficiencyIQ(guesses, targetWord);

    // 2. Fetch the current state of the duel
    const [duel] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!duel) throw new Error("Duel not found.");

    // 3. Prepare the update payload for the challenges table
    const updatePayload: any = isCreator 
      ? { playerA_Guesses: guesses, playerA_Efficiency: efficiencyScore }
      : { playerB_Guesses: guesses, playerB_Efficiency: efficiencyScore };

    // 4. CHECK FOR GAME OVER: Has the opponent already finished?
    const opponentGuesses = isCreator ? duel.playerB_Guesses : duel.playerA_Guesses;
    const isGameOver = Array.isArray(opponentGuesses) && opponentGuesses.length > 0;

    if (isGameOver) {
      updatePayload.status = "completed";
      updatePayload.completedAt = new Date();

      // Determine Winner (Highest Efficiency wins!)
      const opponentEfficiency = isCreator ? duel.playerB_Efficiency! : duel.playerA_Efficiency!;
      
      if (efficiencyScore > opponentEfficiency) {
        updatePayload.winnerId = isCreator ? duel.creatorId : duel.opponentId;
      } else if (opponentEfficiency > efficiencyScore) {
        updatePayload.winnerId = isCreator ? duel.opponentId : duel.creatorId;
      } else {
        updatePayload.winnerId = "DRAW";
      }
    }

    // 5. Save the state to the Challenges Table
    await db.update(challenges).set(updatePayload).where(eq(challenges.id, challengeId));

    // 6. IF GAME OVER -> Update Global Stats & Ledgers!
    if (isGameOver) {
      // We only update stats if the player is logged in (has a valid UUID, not a guest session)
      const playerId = isCreator ? duel.creatorId : duel.opponentId;
      const opponentId = isCreator ? duel.opponentId : duel.creatorId;
      const isWinner = updatePayload.winnerId === playerId;

      if (playerId) { // Ensure it's not a guest
        // Atomic Math Update for the Global Leaderboard
        await db.update(userStats)
          .set({
            totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
            totalWins: isWinner ? sql`${userStats.totalWins} + 1` : sql`${userStats.totalWins}`,
            averageEfficiencyScore: sql`((${userStats.averageEfficiencyScore} * ${userStats.totalGamesPlayed}) + ${efficiencyScore}) / (${userStats.totalGamesPlayed} + 1)`,
            highestEfficiencyScore: sql`GREATEST(${userStats.highestEfficiencyScore}, ${efficiencyScore})`,
            lastUpdated: sql`NOW()`,
          })
          .where(eq(userStats.userId, playerId));

        // Insert into Match History Ledger
        await db.insert(matchResults).values({
          challengeId,
          playerId: playerId,
          playerName: session?.user?.name || "Player",
          isWinner: isWinner,
          efficiencyScore: efficiencyScore,
          guessesUsed: guesses.length,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      efficiencyScore, 
      isGameOver,
      message: isGameOver ? "Duel complete! Check the leaderboard." : "Score saved. Waiting for opponent..."
    });

  } catch (error) {
    console.error("Scoring Error:", error);
    return NextResponse.json({ error: "Failed to submit score." }, { status: 500 });
  }
}