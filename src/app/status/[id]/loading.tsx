import { RefreshCw } from "lucide-react";
import styles from "./ChallengeStats.module.css"

const Loading = ()=> {
  return (
    <div className={styles.wrapper}>
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
    </div>
  );
}

export default Loading;