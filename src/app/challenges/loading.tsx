import { RefreshCw } from "lucide-react";
import styles from "./history.module.css"

const Loading = () => {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Duel History</h1>
        <p>Your active and completed matches.</p>
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
