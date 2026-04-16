"use client";

import styles from "./history.module.css";
import Link from "next/link";
import { Eye } from "lucide-react";

type SimpleDuel = {
  id: string;
  date: string;
  opponent: string;
};

export default function DuelHistoryClient({ duels }: { duels: SimpleDuel[] }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Opponent</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {duels.map((duel) => (
              <tr key={duel.id}>
                <td className={styles.dateCol}>{duel.date}</td>
                <td className={styles.nameCol}>
                  <span className={duel.opponent === "Pending..." ? styles.pendingText : ""}>
                    {duel.opponent}
                  </span>
                </td>
                <td>
                  {/* CHANGED FROM /play TO /status */}
                  <Link href={`/status/${duel.id}`} className={styles.actionBtn}>
                    <Eye size={16} /> See Status
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}