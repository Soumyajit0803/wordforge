"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import styles from "./create.module.css";
import { Copy, Check, RefreshCw } from "lucide-react";
import AppButton from "@/components/Buttons/AppButton";

export default function CreateChallengeClient({
  challengerId,
}: {
  challengerId: string | null;
}) {
  const { status } = useSession();

  const [word, setWord] = useState("");
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const isGuest = (char: string) => char >= "A" && char <= "Z";

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
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "1rem",
            border: "1px solid #a5a5a5",
          }}
        >
          <RefreshCw />
          Loading...
        </span>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1>Create Challenge</h1>
      <p>Enter a word for your opponent to guess.</p>
      {challengerId && isGuest(challengerId[0]) && (
        <p style = {{
          background: "#ededed",
          padding: "0.5rem",
          border: "1px solid #bcbcbc"
        }}>
          Guest mode active. You play as <b>{challengerId.split("-")[0]}</b>

        </p>)}
      <input
        type="text"
        name="word"
        maxLength={5}
        value={word}
        onChange={(e) => setWord(e.target.value.toUpperCase())}
        className={styles.wordInput}
        placeholder="GHOST"
        disabled={!!shareLink} // boolean value of shareLink
        autoFocus
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
          <p>Challenge Ready! Send this link to your opponent:</p>
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
          <AppButton variant="primary" text={"Play Now"} routeURL={shareLink} />
        </div>
      )}
    </main>
  );
}
