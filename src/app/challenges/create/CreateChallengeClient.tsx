"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import styles from "./create.module.css";
import { Copy, Check } from "lucide-react"; 
import AppButton from "@/components/Buttons/AppButton";
import { GoogleIcon } from "@/app/page";

export default function CreateChallengeClient() {
  const { status } = useSession();

  const [word, setWord] = useState("");
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/words.json")
      .then((res) => res.json())
      .then((data: string[]) => {
        setWordSet(new Set(data.map((w) => w.toLowerCase())));
      })
      .catch((err) => console.error("Failed to load dictionary", err));
  }, []);

  const handleCreate = async () => {
    setError("");
    const cleanWord = word.trim().toLowerCase();

    if (cleanWord.length !== 5) {
      return setError("Word must be exactly 5 letters.");
    }
    if (!wordSet.has(cleanWord)) {
      return setError("Not a valid English word.");
    }

    setLoading(true);

    try {
      // UPDATE: Changed endpoint if needed, and body matches new schema
      const response = await fetch("/api/challenge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordForB: cleanWord }), // <-- Using wordForB
      });

      if (!response.ok) {
        throw new Error("Failed to create challenge");
      }

      const data = await response.json();

      if (data.challengeId) {
        const link = `${window.location.origin}/play/${data.challengeId}`;
        setShareLink(link);
      }
    } catch (err) {
      setError("Failed to generate challenge. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  if (status === "loading") {
    return (
      <main className={styles.container}>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1>Set the Trap</h1>
      <p>Pick a 5-letter word for your opponent to guess.</p>

      <input
        type="text"
        name="word"
        maxLength={5}
        value={word}
        onChange={(e) => setWord(e.target.value.toUpperCase())}
        className={styles.wordInput}
        placeholder="GHOST"
        disabled={!!shareLink}
      />

      {error && <p className={styles.errorText}>{error}</p>}

      {!shareLink ? (
        <button
          onClick={handleCreate}
          disabled={loading || word.length !== 5 || wordSet.size === 0}
          className={styles.createBtn}
        >
          {loading ? "Generating..." : "Generate Duel Link"}
        </button>
      ) : (
        <div className={styles.shareBox}>
          <p>Duel Ready! Send this link to your opponent:</p>
          <div className={styles.linkWrapper}>
            <input type="text" readOnly value={shareLink} />
            <button
              onClick={handleCopy}
              aria-label="Copy link"
              className={copied ? styles.copyBtnSuccess : styles.copyBtn}
            >
              {copied ? (
                <Check size={20} className={styles.popIcon} />
              ) : (
                <Copy size={20} />
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}