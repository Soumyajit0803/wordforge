import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { challenges, userStats, users } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

// --- THE EFFICIENCY ALGORITHM ---
function calculateEfficiencyIQ(guesses: string[], targetWord: string): number {
  if (guesses.length === 0) return 0;

  let score = 100;
  const targetChars = targetWord.split("");
  const knownGrayLetters = new Set<string>();

  guesses.forEach((guess, index) => {
    score -= index * 2.5;
    for (const char of guess) {
      if (knownGrayLetters.has(char)) score -= 5;
    }
    for (const char of guess) {
      if (!targetChars.includes(char)) knownGrayLetters.add(char);
    }
  });

  const isWin = guesses.includes(targetWord);
  if (!isWin) score -= 40;

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

    let currPlayerId: string | undefined = session?.user?.id;
    let isGuest: boolean = false;
    let CurrPlayerName: string = session?.user?.name || "";

    // 1. Resolve User Identity
    if (!currPlayerId) {
      const cookieStore = await cookies();
      const guestProfileStr = cookieStore.get("guest_profile")?.value;

      if (guestProfileStr) {
        try {
          const guestProfile = JSON.parse(guestProfileStr);
          currPlayerId = guestProfile.id;
          CurrPlayerName = guestProfile.id.split("-")[0];
          isGuest = true;
        } catch (e) {
          console.error("Failed to parse guest cookie", e);
        }
      }
    }

    // 2. Fetch the duel BEFORE updating to construct the full update payload
    const [duel] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!duel) throw new Error("Duel not found.");

    // 3. Calculate this player's IQ
    const efficiencyScore = calculateEfficiencyIQ(guesses, targetWord);

    const updatePayload: any = isCreator
      ? { playerA_Guesses: guesses, playerA_Efficiency: efficiencyScore }
      : { playerB_Guesses: guesses, playerB_Efficiency: efficiencyScore };

    // 4. CHECK FOR GAME OVER
    const isCurrentPlayerDone =
      guesses.length === 6 || guesses.includes(targetWord);

    // Fallbacks just in case the opponent hasn't played yet (null/undefined)
    const rivalGuesses = isCreator
      ? duel.playerB_Guesses
      : duel.playerA_Guesses;
    const rivalWord = isCreator ? duel.wordForB : duel.wordForA;
    const isRivalDone =
      rivalGuesses &&
      (rivalGuesses.length === 6 || rivalGuesses.includes(rivalWord));

    const isGameOver = isCurrentPlayerDone && isRivalDone;

    // Grab rival's efficiency from the database (no need to recalculate!)
    let rivalEfficiency : number = isCreator
      ? duel.playerB_Efficiency!
      : duel.playerA_Efficiency!;
    let winnerId: string | null = null;

    if (isGameOver) {
      updatePayload.completedAt = new Date();

      if (efficiencyScore > rivalEfficiency) {
        winnerId = isCreator ? duel.creatorId : duel.opponentId;
      } else if (rivalEfficiency > efficiencyScore) {
        winnerId = isCreator ? duel.opponentId : duel.creatorId;
      } else {
        winnerId = "DRAW";
      }
      updatePayload.winnerId = winnerId;
    }

    // 5. Execute ONE database update with all data intact
    await db
      .update(challenges)
      .set(updatePayload)
      .where(eq(challenges.id, challengeId));

    console.log("Updated challenge:", challengeId, "| Game Over:", isGameOver);

    // 6. IF GAME OVER -> Update Global Stats & Ledgers
    if (isGameOver) {
      const rivalId: string = isCreator ? duel.opponentId! : duel.creatorId!;
      const isWinner = winnerId === currPlayerId;
      let isRivalGuest = true;
      let rivalName = "Amazing guest";

      const [opponentUser] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, rivalId))
        .limit(1);

      if (opponentUser) {
        isRivalGuest = false; // We found them in the DB, they are a real user!
        rivalName = opponentUser.name || "Unknown User";
      }

      // Current Player Stats Update
      if (!isGuest && !isRivalGuest) {
        if (currPlayerId) {
          await db
            .insert(userStats)
            .values({
              userId: currPlayerId,
              playerName: CurrPlayerName,
              totalGamesPlayed: 1,
              totalWins: isWinner ? 1 : 0,
              averageEfficiencyScore: efficiencyScore,
              highestEfficiencyScore: efficiencyScore,
              currentWinStreak: isWinner?1:0
            })
            .onConflictDoUpdate({
              target: userStats.userId,
              set: {
                totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
                totalWins: isWinner
                  ? sql`${userStats.totalWins} + 1`
                  : sql`${userStats.totalWins}`,
                averageEfficiencyScore: sql`((${userStats.averageEfficiencyScore} * ${userStats.totalGamesPlayed}) + ${efficiencyScore}) / (${userStats.totalGamesPlayed} + 1)`,
                highestEfficiencyScore: sql`GREATEST(${userStats.highestEfficiencyScore}, ${efficiencyScore})`,
                lastUpdated: sql`NOW()`,
                currentWinStreak: sql`(${userStats.currentWinStreak} + 1)*${isWinner?1:0}`
              },
            });

          // await db.insert(matchResults).values({
          //   challengeId,
          //   playerId: currPlayerId,
          //   playerName: CurrPlayerName,
          //   isWinner: isWinner,
          //   efficiencyScore: efficiencyScore,
          //   guessesUsed: guesses.length,
          // });
        }

        // Opponent Stats Update
        if (rivalId) {
          try {
            const rivalIsWinner = winnerId === rivalId;

            await db
              .insert(userStats)
              .values({
                userId: rivalId,
                playerName: rivalName,
                totalGamesPlayed: 1,
                totalWins: rivalIsWinner ? 1 : 0,
                averageEfficiencyScore: rivalEfficiency,
                highestEfficiencyScore: rivalEfficiency,
                currentWinStreak: rivalIsWinner?1:0
              })
              .onConflictDoUpdate({
                target: userStats.userId,
                set: {
                  totalGamesPlayed: sql`${userStats.totalGamesPlayed} + 1`,
                  totalWins: rivalIsWinner
                    ? sql`${userStats.totalWins} + 1`
                    : sql`${userStats.totalWins}`,
                  averageEfficiencyScore: sql`((${userStats.averageEfficiencyScore} * ${userStats.totalGamesPlayed}) + ${rivalEfficiency}) / (${userStats.totalGamesPlayed} + 1)`,
                  highestEfficiencyScore: sql`GREATEST(${userStats.highestEfficiencyScore}, ${rivalEfficiency})`,
                  lastUpdated: sql`NOW()`,
                  currentWinStreak: sql`(${userStats.currentWinStreak} + 1)*${rivalIsWinner?1:0}`
                },
              });

            // await db.insert(matchResults).values({
            //   challengeId,
            //   playerId: rivalId,
            //   playerName: rivalName,
            //   isWinner: rivalIsWinner,
            //   efficiencyScore: rivalEfficiency,
            //   guessesUsed: rivalGuesses.length,
            // });
          } catch (e: any) {
            console.log("Opponent is a guest or DB error:", e.message);
          }
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
