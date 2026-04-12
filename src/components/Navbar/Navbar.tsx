"use client";

import {
  ChartBar,
  CircleUser,
  Compass,
  FileQuestion,
  HelpCircle,
  LucideChartBar,
  Menu,
  ScanFaceIcon,
  Swords,
  X,
} from "lucide-react";
import styles from "./Navbar.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import HelpModal from "@/components/Popup/HelpModal";
import { useSession } from "next-auth/react";

const navItems: { [key: string]: number } = {
  home: 0,
  help: 1,
  leaderboard: 2,
  challenges: 3,
  account: 4,
};

const Navbar = () => {
  const currentPath = usePathname();
  const [activeIndex, setActiveIndex] = useState(navItems["home"]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { data: session } = useSession();
  console.log(session);

  useEffect(() => {
    const pathKey =
      Object.keys(navItems).find((key) => currentPath.split("/")[1] === key) ||
      "home";
    setActiveIndex(navItems[pathKey]);
  }, [currentPath]);

  return (
    <header className={styles.navbar}>
      <div className={styles.forMobile}>
        <div
          className={styles.iconButton}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <Menu size={24} />
        </div>
      </div>
      <div className={styles.section}>
        <div
          className={
            styles.iconButton + (activeIndex === 1 ? ` ${styles.selected}` : "")
          }
          onClick={() => setIsHelpOpen(true)}
        >
          <HelpCircle size={24} />
        </div>
      </div>
      <Link href="/" className={styles.heading}>
        <h2>ForgeWord</h2>
      </Link>
      <div className={styles.section}>
        <Link
          className={
            styles.iconButton + (activeIndex === 2 ? ` ${styles.selected}` : "")
          }
          href="/leaderboard"
        >
          <ChartBar size={24} />
        </Link>
        <Link
          className={
            styles.iconButton + (activeIndex === 3 ? ` ${styles.selected}` : "")
          }
          href="/challenges"
        >
          <Swords size={24} />
        </Link>
        <Link
          className={
            styles.iconButton + (activeIndex === 4 ? ` ${styles.selected}` : "")
          }
          href="/account"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className={styles.profilePic}
              referrerPolicy="no-referrer" // Crucial: Prevents broken images from Google logins!
            />
          ) : (
            <CircleUser size={24} />
          )}
        </Link>
      </div>
      <div className={styles.forMobile}>
        <div className={styles.iconButton} onClick={() => setIsHelpOpen(true)}>
          <HelpCircle size={24} />
        </div>
      </div>
      <div className={styles.drawer + (drawerOpen ? ` ${styles.open}` : "")}>
        <div className={styles.drawerHeader}>
          <h2>ForgeWord</h2>
          <div className={styles.iconButton}>
            <X size={24} onClick={() => setDrawerOpen(false)} />
          </div>
        </div>
        <div
          className={
            styles.iconButton + (activeIndex === 1 ? ` ${styles.selected}` : "")
          }
          onClick={() => setDrawerOpen(false)}
        >
          <HelpCircle size={24} /> Help
        </div>
        <Link
          className={
            styles.iconButton + (activeIndex === 2 ? ` ${styles.selected}` : "")
          }
          href="/leaderboard"
          onClick={() => setDrawerOpen(false)}
        >
          <ChartBar size={24} /> Leaderboard
        </Link>
        <Link
          className={
            styles.iconButton + (activeIndex === 3 ? ` ${styles.selected}` : "")
          }
          href="/challenges"
          onClick={() => setDrawerOpen(false)}
        >
          <Swords size={24} /> My Challenges
        </Link>
        <Link
          className={
            styles.iconButton + (activeIndex === 4 ? ` ${styles.selected}` : "")
          }
          href="/account"
          onClick={() => setDrawerOpen(false)}
        >
          <CircleUser size={24} /> Account
        </Link>
      </div>
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
};

export default Navbar;
