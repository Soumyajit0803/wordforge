import { pgTable, text, timestamp, integer, primaryKey, uuid, pgEnum, jsonb, doublePrecision, boolean, index } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from "next-auth/adapters";

// --- NextAuth Tables ---
export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
});

export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccount["type"]>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
},
(account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
},
(vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

export const statusEnum = pgEnum('challenge_status', ['pending', 'active', 'completed', 'expired']);


export const userStats = pgTable('user_stats', {
  // 1-to-1 relationship with NextAuth users
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  playerName: text('player_name').notNull(), // Cached here to avoid joining `users` for basic leaderboard UI
  
  totalWins: integer('total_wins').default(0).notNull(),
  totalGamesPlayed: integer('total_games_played').default(0).notNull(),
  
  highestEfficiencyScore: doublePrecision('highest_efficiency_score').default(0).notNull(),
  averageEfficiencyScore: doublePrecision('average_efficiency_score').default(0).notNull(),
  
  currentWinStreak: integer('current_win_streak').default(0).notNull(),
  
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => {
  return {
    // INDUSTRY GRADE: Add indexes to columns you sort by for the leaderboard.
    // This makes generating the top 100 list instantaneous, even with 100,000 users.
    efficiencyIdx: index('efficiency_idx').on(table.averageEfficiencyScore),
    winsIdx: index('wins_idx').on(table.totalWins),
  };
});

export const challengeStatusEnum = pgEnum('challenge_status', ['pending', 'active', 'completed', 'expired']);

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(), // Secure URL ID
  
  // Player A (Creator)
  creatorId: text('creator_id'), // Nullable for guests
  wordForB: text('word_for_b').notNull(),
  playerA_Guesses: jsonb('player_a_guesses').default([]).notNull(),
  playerA_Efficiency: doublePrecision('player_a_efficiency').default(0),

  // Player B (Joiner)
  opponentId: text('opponent_id'), // Nullable for guests
  wordForA: text('word_for_a'), // Set when User B locks the challenge
  playerB_Guesses: jsonb('player_b_guesses').default([]).notNull(),
  playerB_Efficiency: doublePrecision('player_b_efficiency').default(0),

  // State
  status: challengeStatusEnum('status').default('pending').notNull(),
  winnerId: text('winner_id'), 
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const matchResults = pgTable('match_results', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(), // Internal ID, high performance
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  
  // Player Details for this specific match
  playerId: text('player_id').references(() => users.id), // Nullable for guests
  playerName: text('player_name').notNull(), 
  
  // The Outcome
  isWinner: boolean('is_winner').notNull().default(false), 
  efficiencyScore: doublePrecision('efficiency_score').notNull(), 
  guessesUsed: integer('guesses_used').notNull(), 
  timeSeconds: integer('time_seconds'), // Optional
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Index to quickly fetch a user's match history for their profile page
    playerHistoryIdx: index('player_history_idx').on(table.playerId),
  };
});