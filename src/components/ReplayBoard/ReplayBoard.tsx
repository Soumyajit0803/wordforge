"use client";

import styles from "./ReplayBoard.module.css";
import {
  Download,
  RefreshCw,
  Share,
  Share2Icon,
  Swords,
  UserSquare2Icon,
} from "lucide-react";
import AppButton from "../Buttons/AppButton";
import { isGuest } from "@/app/challenges/create/CreateChallengeClient";
import { useRef, useCallback, useState, useEffect } from "react";
import * as htmlToImage from "html-to-image";

// The grading algorithm (handles duplicate letters correctly)
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
export function MiniBoard({
  title,
  playerName,
  playerImg,
  targetWord,
  guesses,
  iq,
  isWinner,
}: any) {
  var safeGuesses: string[] =
    guesses.length === 6 || guesses.includes(targetWord)
      ? guesses
      : [...Array(6).fill(" ")];
  safeGuesses = safeGuesses.concat([
    ...Array(6 - safeGuesses.length).fill(" "),
  ]);

  const revealWord =
    guesses?.includes(targetWord) ||
    (guesses && guesses[5]?.length === 5) ||
    title.includes("Opponent");
  const isGuest = playerName.startsWith("Guest");

  return (
    <div>
      <div
        className={`${styles.boardCard} ${isWinner ? styles.winnerCard : ""}`}
      >
        <div className={styles.boardHeader}>
          <div className={styles.about}>
            {playerImg ? (
              <div
                style={{
                  background: `url('${playerImg}')`,
                  width: "7rem",
                  height: "7rem",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <UserSquare2Icon size={100} />
            )}
            <div className={styles.aboutContent}>
              <h3>{title}</h3>
              <p className={styles.playerName}>{playerName.split(" ")[isGuest?1:0]}</p>
              {revealWord && (
                <span>
                  Word: <strong>{targetWord?.toUpperCase()}</strong>
                </span>
              )}
              <span>
                IQ: <strong>{iq ? iq.toFixed(1) : 0}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          {safeGuesses.map((guess, rowIndex) => {
            const guessModifier = guess + "      ".slice(0, 5 - guess.length);
            const evaluations = evaluateStaticGuess(guessModifier, targetWord);

            return (
              <div key={rowIndex} className={styles.row}>
                {guessModifier
                  .toUpperCase()
                  .split("")
                  .map((char: string, colIndex: number) => (
                    <div
                      key={colIndex}
                      className={`${char === " " && styles.empty} ${
                        styles.cell
                      } ${char !== " " && styles[evaluations[colIndex]]}`}
                    >
                      {char}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// The Main Export
export default function ReplayBoard({ matchEnded, duelData, currentUserId }: any) {
  const isCreator = currentUserId === duelData.creatorId;
  const isOpponent = currentUserId === duelData.opponentId;
  const boardRef = useRef(null);
  const handleDownload = useCallback(async () => {
    if (boardRef.current === null) {
      return;
    }

    try {
      const dataUrl = await htmlToImage.toPng(boardRef.current, {
        cacheBust: true,
        pixelRatio: 2,

        // 2. Force the cloned DOM element to stretch to the desktop width,
        // which tricks your CSS media queries into applying the desktop layout.
        style: {
          transform: "scale(1)", // Prevent any mobile zooming/scaling issues
        },
      });

      // Standard download logic
      const link = document.createElement("a");
      link.download = `wordle-status.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image", err);
    }
  }, []);
  // Determine who won for highlighting
  const creatorWon = duelData.winnerId
    ? duelData.winnerId === duelData.creatorId
    : duelData.playerA_Efficiency > duelData.playerB_Efficiency;
  const matchDrawn =
    duelData.winnerId === "DRAW" ||
    duelData.playerA_Efficiency === duelData.playerB_Efficiency;

  const [creatorImgBase64, setCreatorImgBase64] = useState(null);
  const [opponentImgBase64, setOpponentImgBase64] = useState(null);

  useEffect(() => {
    // 1. Define your fetcher function
    async function getSafeImage(url: string | null) {
      if (!url) return null;
      try {
        const response = await fetch(
          `/api/proxy-image?url=${encodeURIComponent(url)}`,
        );
        const data = await response.json();
        return data.base64Image;
      } catch (err) {
        console.error("Failed to load image via proxy", err);
        return null;
      }
    }

    // 2. Create an async wrapper to handle the sequence
    async function loadAllImages() {
      // Because this wrapper is async, you can safely use await here!
      const ci = await getSafeImage(duelData.creatorImg);
      const oi = await getSafeImage(duelData.opponentImg);

      setCreatorImgBase64(ci);
      setOpponentImgBase64(oi);
    }

    // 3. Call the wrapper function (Do NOT put await in front of this!)
    loadAllImages();
  }, [duelData.creatorImg, duelData.opponentImg]); // Added dependencies to be safe

  const handleShareLink = async () => {
    const shareData = {
      title: "ForgeWord Match Results",
      text: `Check out my ForgeWord match results!`,
      url: window.location.href, // Or a specific dynamic share URL like `/match/${duelData.id}`
    };

    try {
      // Check if the browser supports native sharing (most mobiles do)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!"); // Replace with your own toast notification
      }
    } catch (err) {
      console.error("Error sharing link:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Post-Game Analysis</h2>
        <p>
          Compare strategies and see how the duel unfolded. Refresh page for
          updates
        </p>
      </div>

      <div className={styles.boardsWrapper}>
        <MiniBoard
          title={isCreator ? "You" : isOpponent ? "Opponent" : "Player A"}
          playerName={
            (isGuest(duelData.creatorId) ? "Guest " : "") +
              duelData.creatorName || "Guest Challenger"
          }
          playerImg={creatorImgBase64}
          targetWord={duelData.wordForA} // Creator guesses wordForA
          guesses={duelData.playerA_Guesses}
          iq={duelData.playerA_Efficiency}
          isWinner={matchDrawn ? false : creatorWon}
        />

        <div className={styles.vsBadge}>
          <Swords size={32} />
        </div>

        <MiniBoard
          title={isOpponent ? "You" : isCreator ? "Opponent" : "Player B"}
          playerName={
            (isGuest(duelData.opponentId) ? "Guest " : "") +
              duelData.opponentName || "Guest Opponent"
          }
          playerImg={opponentImgBase64}
          targetWord={duelData.wordForB} // Opponent guesses wordForB
          guesses={duelData.playerB_Guesses}
          iq={duelData.playerB_Efficiency}
          isWinner={matchDrawn ? false : !creatorWon}
        />
      </div>

      <div
        style={{
          zIndex: -9999,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          left: 0,
          gap: "1rem",
          transform: "scale(0.01)",
          padding: "1rem",
          background: "#fff",
          border: "10px double #656565",
        }}
        ref={boardRef}
      >
        <h1 style={{ width: "100%", textAlign: "center", padding: "1rem" }}>
          ForgeWord Results
        </h1>
        <div style={{ display: "flex", flexWrap: "nowrap", gap: "1rem" }}>
          <MiniBoard
            title={"Challenger"}
            playerName={
              (isGuest(duelData.creatorId) ? "Guest " : "") +
                duelData.creatorName || "Guest Challenger"
            }
            playerImg={creatorImgBase64}
            targetWord={duelData.wordForA} // Creator guesses wordForA
            guesses={duelData.playerA_Guesses}
            iq={duelData.playerA_Efficiency}
            isWinner={matchDrawn ? false : creatorWon}
          />

          <MiniBoard
            title={"Opponent"}
            playerName={
              (isGuest(duelData.opponentId) ? "Guest " : "") +
                duelData.opponentName || "Guest Opponent"
            }
            playerImg={opponentImgBase64}
            targetWord={duelData.wordForB} // Opponent guesses wordForB
            guesses={duelData.playerB_Guesses}
            iq={duelData.playerB_Efficiency}
            isWinner={matchDrawn ? false : !creatorWon}
          />
        </div>
      </div>
      <div
        style={{
          width: "min(70vw, 30ch)",
          marginTop: "3rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}
      >
        <AppButton
          onClick={() => window.location.reload()}
          text="Refresh status"
          startIcon={<RefreshCw />}
        />
        {matchEnded && <><AppButton
          startIcon={<Download />}
          onClick={handleDownload}
          text="Save Result"
        />
        <AppButton
          startIcon={<Share2Icon />}
          onClick={handleShareLink}
          text="Share link"
          variant="primary"
        /></>}
      </div>
    </div>
  );
}
