import styles from "./Popup.module.css";
import { FrownIcon, TrophyIcon } from "lucide-react";
import AppButton from "../Buttons/AppButton";

const Popup = ({
  gameStatus,
  targetWord,
  isOpen,
  onClose,
}: {
  gameStatus: "won" | "lost";
  targetWord: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  // const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  if (!isOpen) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {gameStatus === "won" ? (
          <TrophyIcon size={48} color="var(--blue)" />
        ) : (
          <FrownIcon size={48} color="var(--blue)" />
        )}
        <h2>{gameStatus === "won" ? "Splendid!" : "Game over!"}</h2>
        <p style={{ paddingBottom: "2rem" }}>The word was: <b>{targetWord.toUpperCase()}</b></p>
        <div className={styles.buttonGroup}>
          <AppButton onClick={onClose} text="close" />
          <AppButton onClick={onClose} text="share" />
        </div>
      </div>
    </div>
  );
};

export default Popup;
