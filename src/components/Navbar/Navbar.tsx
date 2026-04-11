import { ChartBar, CircleUser, Compass, FileQuestion, HelpCircle, LucideChartBar, Menu, ScanFaceIcon } from "lucide-react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <header className={styles.navbar}>
      <div className={styles.section}>
        <Menu size={24} />
        <HelpCircle size={24} />
      </div>
      <h2 className={styles.heading}>WordForge</h2>
      <div className={styles.section}>
        <ChartBar size={24} />
        <CircleUser size={24} />
      </div>
      
    </header>
  );
};

export default Navbar;
