import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { challenges, userStats, matchResults, users } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

// --- THE EFFICIENCY ALGORITHM ---
// This calculates how "smart" the user played.
function calculateEfficiencyIQ(guesses: string[], targetWord: string): number {
  if (guesses.length === 0) return 0;

  let score = 100; // Base score
  const targetChars = targetWord.split("");
  const knownGrayLetters = new Set<string>();

  guesses.forEach((guess, index) => {
    // 1. Penalty for taking too many guesses (Logic > Luck)
    score -= index * 2.5;

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
  const isWin = guesses.includes(targetWord);
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

    if (!challengeId || !guesses) {
      return NextResponse.json(
        { error: "Missing game data." },
        { status: 400 },
      );
    }

    let userId: string | undefined = session?.user?.id;
    let isGuest: boolean = false;
    let userName: string = session?.user?.name || "";

    // 2. If no active session, check for the guest cookie
    if (!userId) {
      const cookieStore = await cookies();
      const guestProfileStr = cookieStore.get("guest_profile")?.value;

      if (guestProfileStr) {
        try {
          const guestProfile = JSON.parse(guestProfileStr);
          userId = guestProfile.id;
          userName = guestProfile.id.split("-").reverse()[0];
          isGuest = true;
        } catch (e) {
          console.error("Failed to parse guest cookie", e);
        }
      }
    }

    // 1. Calculate this player's IQ
    const efficiencyScore = calculateEfficiencyIQ(guesses, targetWord);
    // 2. Fetch the current state of the duel

    // 3. Prepare the update payload for the challenges table
    const updatePayload: any = isCreator
      ? { playerA_Guesses: guesses, playerA_Efficiency: efficiencyScore }
      : { playerB_Guesses: guesses, playerB_Efficiency: efficiencyScore };

    await db
      .update(challenges)
      .set(updatePayload)
      .where(eq(challenges.id, challengeId));

    const [duel] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!duel) throw new Error("Duel not found.");

    // 4. CHECK FOR GAME OVER: Has the opponent already finished?
    const ACompleted =
      duel.playerA_Guesses.length === 6 ||
      duel.playerA_Guesses.includes(duel.wordForA);
    const BCompleted =
      duel.playerB_Guesses.length === 6 ||
      duel.playerB_Guesses.includes(duel.wordForB);
    const isGameOver = ACompleted && BCompleted;
    console.log("Game over! Updating status for challenge:", challengeId);
    console.log(ACompleted, BCompleted);
    console.log("Game duel from which to fetch details: ", duel);

    if (isGameOver) {
      updatePayload.status = "completed";
      updatePayload.completedAt = new Date();

      // Determine Winner (Highest Efficiency wins!)
      const opponentEfficiency = isCreator
        ? duel.playerB_Efficiency!
        : duel.playerA_Efficiency!;

      if (efficiencyScore > opponentEfficiency) {
        updatePayload.winnerId = isCreator ? duel.creatorId : duel.opponentId;
      } else if (opponentEfficiency > efficiencyScore) {
        updatePayload.winnerId = isCreator ? duel.opponentId : duel.creatorId;
      } else {
        updatePayload.winnerId = "DRAW";
      }
    }

    // 6. IF GAME OVER -> Update Global Stats & Ledgers!
    if (isGameOver) {
      // We only update stats if the player is logged in (has a valid UUID, not a guest session)
      const playerId = isCreator ? duel.creatorId : duel.opponentId;
      const opponentId = isCreator ? duel.opponentId : duel.creatorId;

      var opponentName: string;
      if (opponentId) {
        const [opponentNameResult] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, opponentId))
          .limit(1);
        opponentName = opponentNameResult?.name || "Amazing guest";
      } else {
        opponentName = "Amazing guest";
      }
      const isWinner = updatePayload.winnerId === playerId;

      // 6. IF GAME OVER -> Update Global Stats & Ledgers!

      if (playerId && !isGuest) {
        // THE FIX: The UPSERT (Insert if new, Update if returning)
        await db
          .insert(userStats)
          .values({
            userId: playerId,
            playerName: userName,
            totalGamesPlayed: 1,
            totalWins: isWinner ? 1 : 0,
            averageEfficiencyScore: efficiencyScore,
            highestEfficiencyScore: efficiencyScore,
          })
          .onConflictDoUpdate({
            target: userStats.userId, // If this userId already exists...
            set: {
              // ...do the rolling average math instead!
              totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
              totalWins: isWinner
                ? sql`${userStats.totalWins} + 1`
                : sql`${userStats.totalWins}`,
              averageEfficiencyScore: sql`((${userStats.averageEfficiencyScore} * ${userStats.totalGamesPlayed}) + ${efficiencyScore}) / (${userStats.totalGamesPlayed} + 1)`,
              highestEfficiencyScore: sql`GREATEST(${userStats.highestEfficiencyScore}, ${efficiencyScore})`,
              lastUpdated: sql`NOW()`,
            },
          });

        // Insert into Match History Ledger (This part remains the same)
        await db.insert(matchResults).values({
          challengeId,
          playerId: playerId,
          playerName: userName,
          isWinner: isWinner,
          efficiencyScore: efficiencyScore,
          guessesUsed: guesses.length,
        });
      }
      if (opponentId) {
        // THE FIX: The UPSERT (Insert if new, Update if returning)
        // fetch opponent user name
        const opponentGuesses = isCreator
          ? duel.playerB_Guesses
          : duel.playerA_Guesses;
        const opponentEfficiency = calculateEfficiencyIQ(
          opponentGuesses,
          isCreator ? duel.wordForB : duel.wordForA,
        );

        // Try to insert; might fail if its not a registered user.
        try {
          await db
            .insert(userStats)
            .values({
              userId: opponentId,
              playerName: opponentName,
              totalGamesPlayed: 1,
              totalWins: isWinner ? 0 : 1,
              averageEfficiencyScore: opponentEfficiency,
              highestEfficiencyScore: opponentEfficiency,
            })
            .onConflictDoUpdate({
              target: userStats.userId, // If this userId already exists...
              set: {
                // ...do the rolling average math instead!
                totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
                totalWins: !isWinner
                  ? sql`${userStats.totalWins} + 1`
                  : sql`${userStats.totalWins}`,
                averageEfficiencyScore: sql`((${userStats.averageEfficiencyScore} * ${userStats.totalGamesPlayed}) + ${opponentEfficiency}) / (${userStats.totalGamesPlayed} + 1)`,
                highestEfficiencyScore: sql`GREATEST(${userStats.highestEfficiencyScore}, ${opponentEfficiency})`,
                lastUpdated: sql`NOW()`,
              },
            });

          // Insert into Match History Ledger (This part remains the same)
          await db.insert(matchResults).values({
            challengeId,
            playerId: opponentId,
            playerName: opponentName,
            isWinner: !isWinner,
            efficiencyScore: opponentEfficiency,
            guessesUsed: opponentGuesses.length,
          });
        } catch (e : any) {
          console.log(e.message);
          console.log(opponentId);
          console.log("Opponent is a guest. NOT saving results.");
        }
      }
    }

    return NextResponse.json({
      success: true,
      efficiencyScore,
      isGameOver,
      message: isGameOver
        ? "Duel complete! Check the leaderboard."
        : "Score saved. Waiting for opponent...",
    });
  } catch (error) {
    console.error("Scoring Error:", error);
    return NextResponse.json(
      { error: "Failed to submit score." },
      { status: 500 },
    );
  }
}
