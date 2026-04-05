"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./play.module.css";

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
// The hardcoded target word for testing
const TARGET_WORD = "ghost";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

type GameStatus = "playing" | "won" | "lost";
export const enum Evaluation {
  NODATA = 0,
  ABSENT = -1,
  PRESENT = 1,
  CORRECT = 2,
}

export default function PlayArea() {
  const [guesses, setGuesses] = useState<string[]>(Array(MAX_GUESSES).fill(""));
  const [evaluations, setEvaluations] = useState<Evaluation[][]>(
    Array(MAX_GUESSES).fill(Array(WORD_LENGTH).fill(Evaluation.NODATA)),
  );
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [keyboardStatus, setKeyboardStatus] = useState<
    Record<string, Evaluation>
  >({});

  const evaluateGuess = (guess: string) => {
    const result: Evaluation[] = Array(WORD_LENGTH).fill(Evaluation.ABSENT);
    const targetLetters = TARGET_WORD.split("");
    const guessLetters = guess.split("");

    // Pass 1: Find exact matches (Green / Correct)
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        result[i] = Evaluation.CORRECT;
        targetLetters[i] = ""; // Consume it
      }
    });

    // Pass 2: Find right letters in wrong spots (Yellow / Present)
    guessLetters.forEach((letter, i) => {
      if (result[i] !== Evaluation.CORRECT && targetLetters.includes(letter)) {
        result[i] = Evaluation.PRESENT;
        targetLetters[targetLetters.indexOf(letter)] = ""; // Consume it
      }
    });

    return result;
  };

  const onKeyPress = useCallback(
    (key: string) => {
      if (gameStatus !== "playing") return;

      setGuesses((prevGuesses) => {
        const newGuesses = [...prevGuesses];
        const currentGuess = newGuesses[currentGuessIndex];

        if (key === "backspace") {
          newGuesses[currentGuessIndex] = currentGuess.slice(0, -1);
        } else if (key === "enter") {
          // Only submit if the word is exactly 5 letters long
          if (currentGuess.length === WORD_LENGTH) {
            // 1. Evaluate the word
            const currentEval = evaluateGuess(currentGuess);

            setEvaluations((prevEvals) => {
              const newEvals = [...prevEvals];
              newEvals[currentGuessIndex] = currentEval;
              return newEvals;
            });

            setKeyboardStatus((prevStatus) => {
              const newStatus = { ...prevStatus };

              currentGuess.split("").forEach((letter, i) => {
                const current = currentEval[i];
                const existing = newStatus[letter] || Evaluation.NODATA;

                // Enforce the hierarchy: Green > Yellow > Gray
                if (current === Evaluation.CORRECT) {
                  newStatus[letter] = Evaluation.CORRECT;
                } else if (
                  current === Evaluation.PRESENT &&
                  existing !== Evaluation.CORRECT
                ) {
                  newStatus[letter] = Evaluation.PRESENT;
                } else if (
                  current === Evaluation.ABSENT &&
                  existing === Evaluation.NODATA
                ) {
                  newStatus[letter] = Evaluation.ABSENT;
                }
              });

              return newStatus; // React updates the state exactly once!
            });

            // 2. Check Win/Loss conditions
            const isWin = currentEval.every(
              (status) => status === Evaluation.CORRECT,
            );

            if (isWin) {
              setGameStatus("won");
            } else if (currentGuessIndex === MAX_GUESSES - 1) {
              setGameStatus("lost");
            } else {
              // Move to next row
              setCurrentGuessIndex(currentGuessIndex + 1);
            }
          }
        } else if (currentGuess.length < WORD_LENGTH && /^[a-z]$/i.test(key)) {
          newGuesses[currentGuessIndex] = currentGuess + key.toLowerCase();
        }

        return newGuesses;
      });
    },
    [currentGuessIndex, gameStatus],
  );

  // Handle Physical Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") onKeyPress("enter");
      else if (e.key === "Backspace") onKeyPress("backspace");
      else if (/^[a-zA-Z]$/.test(e.key)) onKeyPress(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress]);

  const challengerName = "Alex";

  return (
    <main className={styles.container}>
      <div className={styles.challengeBanner}>
        Challenged by{" "}
        <span className={styles.challengerName}>{challengerName}</span>
      </div>

      {/* Game Board */}
      <div className={styles.board}>
        {guesses.map((guess, rowIndex) => {
          const isCurrentRow = rowIndex === currentGuessIndex;
          const isSubmitted =
            rowIndex < currentGuessIndex || gameStatus !== "playing";

          return (
            <div key={rowIndex} className={styles.row}>
              {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                const letter = guess[colIndex] || "";

                // Determine tile color if the row has been submitted
                let tileClass = "";
                if (isSubmitted) {
                  const evalStatus = evaluations[rowIndex][colIndex];
                  if (evalStatus === Evaluation.CORRECT)
                    tileClass = styles.tileCorrect;
                  else if (evalStatus === Evaluation.PRESENT)
                    tileClass = styles.tilePresent;
                  else if (evalStatus === Evaluation.ABSENT)
                    tileClass = styles.tileAbsent;
                } else if (letter && isCurrentRow) {
                  tileClass = styles.tileActive;
                }

                return (
                  <div key={colIndex} className={`${styles.tile} ${tileClass}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Game Over State */}
      {gameStatus !== "playing" && (
        <div className={styles.gameOverBanner}>
          {gameStatus === "won" ? "You Won!" : `Game Over: ${TARGET_WORD}`}
        </div>
      )}

      {/* On-Screen Keyboard */}
      <div className={styles.keyboard}>
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.keyboardRow}>
            {row.map((key) => {
              const isLarge = key === "enter" || key === "backspace";
              const status = keyboardStatus[key] || Evaluation.NODATA;
              let statusClass = "";
              if (status === Evaluation.CORRECT)
                statusClass = styles.keyCorrect;
              else if (status === Evaluation.PRESENT)
                statusClass = styles.keyPresent;
              else if (status === Evaluation.ABSENT)
                statusClass = styles.keyAbsent;

              return (
                <button
                  key={key}
                  className={`${styles.key} ${isLarge ? styles.keyLarge : ""} ${statusClass}`}
                  onClick={() => onKeyPress(key)}
                  tabIndex={-1}
                >
                  {key === "backspace" ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
