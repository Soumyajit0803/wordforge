import styles from "./leaderboard.module.css";
import { RefreshCw, Trophy } from "lucide-react";

const Loading = () => {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Trophy size={48} color="#fbbc04" className={styles.trophyIcon} />
        <h1>Global Leaderboard</h1>
        <p>Ranked by Average Efficiency IQ across all duels.</p>
      </header>
      <span style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "1rem",
        border: "1px solid #a5a5a5"

      }}>
        <RefreshCw />
        Loading...
      </span>
    </main>
  );
};

export default Loading;
