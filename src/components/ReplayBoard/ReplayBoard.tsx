"use client";

import { toArray } from "drizzle-orm/mysql-core";
import styles from "./ReplayBoard.module.css";
import { Swords } from "lucide-react";

// The true Wordle grading algorithm (handles duplicate letters correctly)
function evaluateStaticGuess(guess: string, targetWord: string) {
  const guessChars = guess.toUpperCase().split("");
  const targetChars = targetWord.toUpperCase().split("");
  const result = new Array(5).fill("absent");

  // Pass 1: Find Greens (Correct position)
  guessChars.forEach((char, i) => {
    if (char === targetChars[i]) {
      result[i] = "correct";
      targetChars[i] = ""; // Consume this letter
    }
  });

  // Pass 2: Find Yellows (Wrong position)
  guessChars.forEach((char, i) => {
    if (result[i] !== "correct" && targetChars.includes(char)) {
      result[i] = "present";
      targetChars[targetChars.indexOf(char)] = ""; // Consume this letter
    }
  });

  return result;
}

// A static, non-interactive 5x6 grid
function MiniBoard({ title, playerName, targetWord, guesses, iq, isWinner }: any) {
  var safeGuesses: string[] = (guesses.length===6 || guesses.includes(targetWord)) ? guesses : [ ...Array(6).fill(" ")];
  safeGuesses = safeGuesses.concat([...Array(6 - safeGuesses.length).fill(" ")]);
  const revealWord = guesses?.includes(targetWord) || (guesses && guesses[5]?.length === 5) || title.includes("Opponent");

  return (
    <div className={`${styles.boardCard} ${isWinner ? styles.winnerCard : ""}`}>
      <div className={styles.boardHeader}>
        <h3>{title}</h3>
        <p className={styles.playerName}>{playerName}</p>
        <div className={styles.stats}>
          {revealWord && <span>Word: <strong>{targetWord?.toUpperCase()}</strong></span>}
          <span>IQ: <strong>{iq ? iq.toFixed(1) : 0}</strong></span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Render Played Guesses */}
        {safeGuesses.map((guess, rowIndex) => {
          const guessModifier = guess + "      ".slice(0, 5 - guess.length); // Pad to 6 chars
          const evaluations = evaluateStaticGuess(guessModifier, targetWord);
          return (
            <div key={rowIndex} className={styles.row}>
              {guessModifier.toUpperCase().split("").map((char: string, colIndex: number) => (
                <div key={colIndex} className={`${char===' ' && styles.empty} ${styles.cell} ${char!==' ' && styles[evaluations[colIndex]]}`}>
                  {char}
                </div>
              ))}
            </div>
          );
        })}

        {/* Render Empty Rows */}
        {/* {Array.from({ length: emptyRows }).map((_, rowIndex) => (
          <div key={`empty-${rowIndex}`} className={styles.row}>
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div key={`empty-cell-${colIndex}`} className={`${styles.cell} ${styles.empty}`}></div>
            ))}
          </div>
        ))} */}
      </div>
    </div>
  );
}

// The Main Export
export default function ReplayBoard({ duelData, currentUserId }: any) {
  const isCreator = currentUserId === duelData.creatorId;
  const isOpponent = currentUserId === duelData.opponentId;
  // Determine who won for highlighting
  const creatorWon = duelData.winnerId ? (duelData.winnerId === duelData.creatorId) : (duelData.playerA_Efficiency > duelData.playerB_Efficiency);
  const matchDrawn = duelData.winnerId === "DRAW" || (duelData.playerA_Efficiency === duelData.playerB_Efficiency);

  console.log("Match drawn status:", matchDrawn);
  console.log(duelData);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Post-Game Analysis</h2>
        <p>Compare strategies and see how the duel unfolded.</p>
      </div>

      <div className={styles.boardsWrapper}>

        <MiniBoard
          title={isCreator ? "Your Board" : (isOpponent?"Opponent's Board": "Player A")}
          playerName={duelData.creatorName || "Guest Challenger"}
          targetWord={duelData.wordForA} // Creator guesses wordForA
          guesses={duelData.playerA_Guesses}
          iq={duelData.playerA_Efficiency}
          isWinner={matchDrawn?false:creatorWon}
        />

        <div className={styles.vsBadge}>
          <Swords size={32} />
        </div>

        <MiniBoard
          title={isOpponent ? "Your Board" :(isCreator?"Opponent's Board": "Player B")}
          playerName={duelData.opponentName || "Guest Opponent"}
          targetWord={duelData.wordForB} // Opponent guesses wordForB
          guesses={duelData.playerB_Guesses}
          iq={duelData.playerB_Efficiency}
          isWinner={matchDrawn?false:!creatorWon}
        />

      </div>
    </div>
  );
}