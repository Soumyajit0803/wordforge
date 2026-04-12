"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./account.module.css"; // We'll create this next
import Image from "next/image";

export default function AccountPage() {
  // Grab the "update" function from NextAuth to refresh the session locally
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  // Load the user's current data into the form when they load the page
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImageUrl(session.user.image || "");
    }
  }, [session]);

  if (status === "loading") {
    return <main className={styles.container}><p>Loading...</p></main>;
  }

  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: imageUrl }),
      });

      if (res.ok) {
        // Force NextAuth to pull the fresh data we just saved!
        await update({ name, image: imageUrl });
        router.refresh();
        setMessage("Profile updated successfully!");
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to update profile.");
      }
    } catch (error) {
      setMessage("A network error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Account Settings</h1>
        <p>Customize your profile.</p>
      </header>

      <form onSubmit={handleSave} className={styles.formCard}>
        
        {/* Profile Picture Preview */}
        <div className={styles.avatarSection}>
          {imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt="Profile Preview" 
              className={styles.avatarPreview} 
              onError={() => setImageError(true)}
            />
          ) : (
            // If there's no URL, OR if the URL errored out, show the fallback UI
            <div className={styles.avatarPlaceholder}>
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>

        {/* Name Input */}
        <div className={styles.inputGroup}>
          <label htmlFor="name">Display Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
            maxLength={30}
          />
        </div>

        {/* Image URL Input */}
        <div className={styles.inputGroup}>
          <label htmlFor="imageUrl">Avatar URL (Optional)</label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={styles.input}
            placeholder="https://example.com/my-picture.png"
          />
        </div>

        <button 
          type="submit" 
          disabled={isSaving || !name.trim()} 
          className={styles.primaryBtn}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <p className={message.includes("success") ? styles.successMsg : styles.errorMsg}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}