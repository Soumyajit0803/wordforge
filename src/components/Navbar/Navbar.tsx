import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <header className={styles.navbar}>
      <h2>WordForge</h2>
      <div className={styles.challengeBanner}>
        Challenged by{" "}
        <span className={styles.challengerName}>ALEX</span>
      </div>
    </header>
  );
};

export default Navbar;
