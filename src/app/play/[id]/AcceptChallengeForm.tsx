"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import styles from "./AcceptChallengeForm.module.css";

interface AcceptChallengeFormProps {
  challengeId: string;
  challengerName: string;
  currentUserId: string | null;
}

export default function AcceptChallengeForm({
  challengeId,
  challengerName,
  currentUserId,
}: AcceptChallengeFormProps) {
  const [word, setWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json())
      .then((data: string[]) => {
        // Convert to lowercase and store in a Set for lightning-fast lookups
        setWordSet(new Set(data.map((w) => w.toLowerCase())));
      })
      .catch((err) => console.error("Failed to load dictionary", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Basic Frontend Validation
    const cleanWord = word.trim().toLowerCase();
    if (cleanWord.length !== 5 || !/^[a-z]+$/.test(cleanWord)) {
      setError("Please enter a valid 5-letter word.");
      return;
    }

    if (!wordSet.has(cleanWord)) {
      setError("Not a valid English word.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. The API Call to "Lock" the Duel
      const res = await fetch("/api/challenge/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          wordForA: cleanWord,
          opponentId: currentUserId, // Will be null if they are a guest
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to accept challenge.");
      }

      // 3. Refresh the page to trigger the Server Component's new state
      // The server will now see status="active" and load the PlayArea!
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Swords size={48} className={styles.icon} />
        </div>
        
        <h2 className={styles.title}>
          {challengerName} has challenged you!
        </h2>
        
        <p className={styles.subtitle}>
          Before the duel begins, you must set a trap. Enter a 5-letter word for <strong>{challengerName}</strong> to guess. 
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              maxLength={5}
              value={word}
              onChange={(e) => setWord(e.target.value.toUpperCase())}
              placeholder="E.g. GHOST"
              className={styles.wordInput}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={word.length !== 5 || isLoading}
          >
            {isLoading ? "Locking Duel..." : "Accept & Start Duel"}
          </button>
        </form>

        {!currentUserId && (
          <p className={styles.guestNotice}>
            You are playing as a Guest. Your stats won't be saved on the leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}