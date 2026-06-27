"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./PlayArea.module.css";
import Popup from "@/components/Popup/Popup";
import { CornerDownLeftIcon, Delete } from "lucide-react";
import { redirect } from "next/navigation";


/**
 * Calculates a 0-100 IQ score based on a player's Wordle guess history.
 * @param guesses - Array of words the player guessed in order.
 * @param targetWord - The correct answer.
 * @returns The final calculated IQ score.
 */
export function calculateGameIQ(guesses: string[], targetWord: string): number {
  let iq = 100;
  let penalty = 0;
  console.log(guesses);

  // Historical memory initialized before the game loop
  const knownDeadLetters = new Set<string>();
  const knownGreenLetters = new Set<string>();
  const knownYellowSpots = new Map<string, Set<number>>();

  const targetUpper = targetWord.toUpperCase();

  for (const guess of guesses) {
    let deduction = 0;
    let finish = 0;
    
    const guessLetters = guess.toUpperCase().split("");
    const targetLetters = targetUpper.split("");
    const result: Evaluation[] = Array(targetWord.length).fill(Evaluation.ABSENT);

    // --- Standard 2-Pass Evaluation Engine ---
    // Pass 1: Find exact matches (Green)
    guessLetters.forEach((letter, i) => {
      if (letter === targetLetters[i]) {
        result[i] = Evaluation.CORRECT;
        targetLetters[i] = ""; // Consume it
      }
    });
    
    
    // Pass 2: Find misplaced letters (Yellow)
    guessLetters.forEach((letter, i) => {
      if (result[i] !== Evaluation.CORRECT && targetLetters.includes(letter)) {
        result[i] = Evaluation.PRESENT;
        targetLetters[targetLetters.indexOf(letter)] = ""; // Consume it
      }
    });

    // --- Pass 1: Evaluate Deductions ---
    let discoveryBonus = 0;
    guessLetters.forEach((x, i) => {
      const color = result[i];

      if (color === Evaluation.CORRECT) {
        finish += 1;
        if(!knownGreenLetters.has(x)){
          discoveryBonus += 1;
        }
      } 
      else if (color === Evaluation.PRESENT) {
        const spots = knownYellowSpots.get(x);
        if (spots && spots.has(i)) {
          deduction += 1; // No attempt at bettering x (same wrong spot)
        } else if (knownGreenLetters.has(x)) {
          deduction += 2; // Worse, demoted x (moved away from known green)
        }

        if(!spots){
          discoveryBonus += 0.5;
        }
      } 
      else if (color === Evaluation.ABSENT) {
        if (knownDeadLetters.has(x)) {
          deduction += 1; // Reused a known true dead letter
        }
      }
    });

    // --- Pass 3: Update historical memory for the next turn ---
    guessLetters.forEach((x, i) => {
      const color = result[i];

      if (color === Evaluation.CORRECT) {
        knownGreenLetters.add(x);
      } 
      else if (color === Evaluation.PRESENT) {
        if (!knownYellowSpots.has(x)) {
          knownYellowSpots.set(x, new Set<number>());
        }
        knownYellowSpots.get(x)!.add(i);
      } 
      else if (color === Evaluation.ABSENT) {
        // Only mark as a true dead letter if it doesn't exist in the target at all
        if (!targetUpper.includes(x)) {
          knownDeadLetters.add(x);
        }
      }
    });


        // --- Pass 2: Apply the tier drop and logical mistakes ---
    console.log("Discovery Bonus: ", discoveryBonus)
    iq -= (deduction + penalty);
    
    // Set flat tier drop for subsequent turns to preserve the 0-100 scale
    penalty = 15;
        // --- Check for Win ---
    if (finish === 5) {
      break; // Exit the loop early if they guessed the word
    }
    iq += discoveryBonus;
  }

  // Handle Loss Condition (Ran out of turns without guessing the word)
  const won = guesses.includes(targetWord);
  if (!won) {
    iq = Math.max(0, iq - 25);
  }

  // Ensure the final score stays exactly between 0 and 100
  return Math.max(0, Math.min(100, Math.round(iq)));
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
// The hardcoded target word for testing

let wordSet: Set<string> = new Set();

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["enter", "Z", "X", "C", "V", "B", "N", "M", "backspace"],
];

type GameStatus = "playing" | "won" | "lost";

export const enum Evaluation {
  NODATA = 0,
  ABSENT = -1,
  PRESENT = 1,
  CORRECT = 2,
}

interface PlayAreaProps {
  targetWord: string;
  challengerName: string;
  challengeId: string;
  isCreator: boolean;
  initialGuesses?: string[];
}

export default function PlayArea({
  targetWord,
  challengerName,
  challengeId,
  isCreator,
  initialGuesses = [],
}: PlayAreaProps) {
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [score, setScore] = useState(0);

  // 2. Initialize your state with the cloud data!
  const [guesses, setGuesses] = useState<string[]>(() => {
    if (initialGuesses.length > 0) return initialGuesses;
    return Array(MAX_GUESSES).fill("");
  });

  const [evaluations, setEvaluations] = useState<Evaluation[][]>(
    Array(MAX_GUESSES).fill(Array(WORD_LENGTH).fill(Evaluation.NODATA)),
  );
  const [currentGuessIndex, setCurrentGuessIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [keyboardStatus, setKeyboardStatus] = useState<
    Record<string, Evaluation>
  >({});

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch Dictionary
    fetch("/words.json")
      .then((res) => res.json())
      .then((data: string[]) => {
        wordSet = new Set(data.map((w) => w.toLowerCase()));
        setDictionaryLoaded(true);
      });

    // 2. Hydrate Game State from Local Storage
    const savedState = localStorage.getItem(`wordle_state_${challengeId}`);

    if (savedState) {
      const parsed = JSON.parse(savedState);
      setGuesses(parsed.guesses);
      setEvaluations(parsed.evaluations);
      setCurrentGuessIndex(parsed.currentGuessIndex);
      setGameStatus(parsed.gameStatus);
      setKeyboardStatus(parsed.keyboardStatus);

      // If they already finished this game in a previous session, open the modal
      if (parsed.gameStatus !== "playing") {
        setIsModalOpen(true);
      }
    }

    // 3. Mark as safe to render
    setIsHydrated(true);
  }, [challengeId]);

  // 2. SAVE TO LOCAL STORAGE ON GAME OVER
  // ... inside PlayArea component

  const handleGameOver = async (
    status: "won" | "lost",
    finalGuesses: string[],
  ) => {
    setGameStatus(status);
    setIsModalOpen(true);
    console.log("Game Over with status:", status, "and guesses:", finalGuesses);
    console.log(guesses);

    // 1. Filter out the empty strings from the guesses array
    const playedGuesses = finalGuesses.filter((g) => g !== "");
    const currentScore = calculateGameIQ(finalGuesses, targetWord);
    setScore(currentScore);

    try {
      // 2. Send the data to your Next.js API route to update the database
      const response = await fetch("/api/challenge/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          isCreator, // Tells the backend to update playerA_Guesses or playerB_Guesses
          guesses: playedGuesses,
          targetWord,
          isMigration: false,
          score: currentScore
        }),
      });

      if (!response.ok) {
        console.error("Failed to save match result to database");
      }

      // Optional: Get the calculated efficiency score back to show in the modal!
      // const { efficiencyScore } = await response.json();
    } catch (error) {
      console.error("Error submitting score:", error);
    }


  };

  const evaluateGuess = (guess: string) => {
    const result: Evaluation[] = Array(WORD_LENGTH).fill(Evaluation.ABSENT);
    const targetLetters = targetWord.toUpperCase().split("");
    const guessLetters = guess.toUpperCase().split("");

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

      // 1. Get current guess state
      const currentGuess = guesses[currentGuessIndex].toUpperCase();
      console.log("Current Guess Before Key Press:", currentGuess);
      if (key === "backspace") {
        setGuesses((prev) => {
          const next = [...prev];
          next[currentGuessIndex] = currentGuess.slice(0, -1);
          return next;
        });
      } else if (key === "enter") {
        if (currentGuess.length === WORD_LENGTH) {
          // --- VALIDATION CHECK ---
          if (wordSet.size > 0 && !wordSet.has(currentGuess.toLowerCase())) {
            console.log("Not in word list");
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500); // Reset after animation
            return; // Stop here!
          }

          // --- EVALUATION ---
          const currentEval = evaluateGuess(currentGuess);

          setEvaluations((prev) => {
            const next = [...prev];
            next[currentGuessIndex] = currentEval;
            return next;
          });
          // Update Keyboard Colors
          setKeyboardStatus((prevStatus) => {
            const newStatus = { ...prevStatus };
            currentGuess.split("").forEach((letter, i) => {
              const current = currentEval[i];
              const existing = newStatus[letter] || Evaluation.NODATA;
              if (current === Evaluation.CORRECT)
                newStatus[letter] = Evaluation.CORRECT;
              else if (
                current === Evaluation.PRESENT &&
                existing !== Evaluation.CORRECT
              )
                newStatus[letter] = Evaluation.PRESENT;
              else if (
                current === Evaluation.ABSENT &&
                existing === Evaluation.NODATA
              )
                newStatus[letter] = Evaluation.ABSENT;
            });
            return newStatus;
          });

          // --- GAME OVER CHECK OR NEXT ROW ---
          const isWin = currentEval.every((s) => s === Evaluation.CORRECT);
          // Construct the final array for this turn to send to the server
          const newGuesses = [...guesses];
          newGuesses[currentGuessIndex] = currentGuess;

          if (isWin) {
            handleGameOver("won", newGuesses);
          } else if (currentGuessIndex === MAX_GUESSES - 1) {
            handleGameOver("lost", newGuesses);
          } else {
            setCurrentGuessIndex((prev) => prev + 1);
            fetch("/api/challenge/save-progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                challengeId,
                isCreator,
                guesses: newGuesses,
              }),
            }).catch((err) => console.error("Cloud sync failed", err));
          }
        }
      } else if (currentGuess.length < WORD_LENGTH && /^[a-z]$/i.test(key)) {
        setGuesses((prev) => {
          const next = [...prev];
          next[currentGuessIndex] = currentGuess + key.toUpperCase();
          return next;
        });
      }
    },
    [currentGuessIndex, gameStatus, guesses, challengeId], // Added 'guesses' to dependencies!
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

  // Auto-Save Game State
  useEffect(() => {
    // Don't overwrite our saved data with empty default state before hydration finishes!
    if (!isHydrated) return;

    const stateToSave = {
      guesses,
      evaluations,
      currentGuessIndex,
      gameStatus,
      keyboardStatus,
    };

    localStorage.setItem(
      `wordle_state_${challengeId}`,
      JSON.stringify(stateToSave),
    );
  }, [
    guesses,
    evaluations,
    currentGuessIndex,
    gameStatus,
    keyboardStatus,
    isHydrated,
    challengeId,
  ]);

  const onPopupClose = ()=> {
    setIsModalOpen(false);
    redirect(`/status/${challengeId}`)
  }

  if (!isHydrated) {
    return <main className={styles.container}>Loading board...</main>;
  }
  return (
    <main className={styles.container}>
      {/* Game Board */}
      <div className={styles.challengeBanner}>
        Challenged by{" "}
        <span className={styles.challengerName}>{challengerName}</span>
      </div>
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
                  <div
                    key={colIndex}
                    className={`${styles.tile} ${tileClass} ${isShaking && isCurrentRow ? styles.shake : ""}`}
                  >
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
        <Popup
          gameStatus={gameStatus}
          targetWord={targetWord}
          isOpen={isModalOpen}
          onClose={onPopupClose}
          chances={currentGuessIndex + 1}
          challengeId={challengeId}
          isCreator = {isCreator}
          playedGuesses = {guesses}
          score={score}
        />
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
                  {key === "backspace" ? (
                    <Delete size={20} />
                  ) : key === "enter" ? (
                    <CornerDownLeftIcon size={20} />
                  ) : (
                    key.toUpperCase()
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}
