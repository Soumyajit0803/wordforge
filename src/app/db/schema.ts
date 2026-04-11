import { pgTable, text, timestamp, integer, primaryKey, uuid } from 'drizzle-orm/pg-core';
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

// --- Game Tables (Keep this from before) ---
export const games = pgTable('games', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  targetWord: text('target_word').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Challenges: Links a Target Word to a Creator
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(), // Use UUID for the shareable URL
  gameId: integer('game_id').references(() => games.id).notNull(),
  creatorId: text('creator_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Leaderboard: Stores the results for a specific challenge
export const leaderboard = pgTable('leaderboard', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  challengeId: uuid('challenge_id').references(() => challenges.id).notNull(),
  
  // Player Data: Can be a User ID (if logged in) or a Guest Name
  playerId: text('player_id').references(() => users.id).notNull(), 
  playerName: text('player_name').notNull(), // "Guest" or the User's Display Name
  
  // The Score
  guessesUsed: integer('guesses_used').notNull(), // 1 through 6
  timeSeconds: integer('time_seconds').notNull(), // For tie-breaking/uniqueness
  createdAt: timestamp('created_at').defaultNow().notNull(),
});