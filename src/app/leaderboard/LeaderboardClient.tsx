"use client";

import styles from "./leaderboard.module.css";

type PlayerStat = {
  id: string;
  name: string;
  gamesPlayed: number;
  totalWins: number;
  averageIQ: number;
  highestIQ: number;
  winStreak: number;
};

export default function LeaderboardClient({
  players,
}: {
  players: PlayerStat[];
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Total Games</th>
              <th>Avg IQ</th>
              <th>Max IQ</th>
              <th>Win %</th>
              <th>Win streak</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              // Calculate Win Rate on the fly
              const winRate = (
                (player.totalWins / player.gamesPlayed) *
                100
              ).toFixed(0);

              // Add special styling for Top 3
              let rankClass = "";
              if (index === 0) rankClass = styles.rankGold;
              if (index === 1) rankClass = styles.rankSilver;
              if (index === 2) rankClass = styles.rankBronze;

              return (
                <tr key={player.id}>
                  <td className={`${styles.rankCol} ${rankClass}`}>
                    {index + 1}
                  </td>
                  <td className={styles.nameCol}>{player.name.split(" ")[0]}</td>
                  <td className={styles.statCol}>{player.gamesPlayed}</td>
                  <td className={styles.highlightCol}>
                    {player.averageIQ.toFixed(1)}
                  </td>
                  <td className={styles.statCol}>
                    {player.highestIQ.toFixed(1)}
                  </td>
                  <td className={styles.statCol}>{winRate}%</td>
                  <td className={styles.statCol}>{player.winStreak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
