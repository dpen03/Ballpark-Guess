import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  uuid,
  boolean,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 30 }).notNull(),
  avatar: varchar("avatar", { length: 30 }).notNull().default("⚾️"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const gamesTable = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  awayTeam: varchar("away_team", { length: 30 }).notNull(),
  homeTeam: varchar("home_team", { length: 30 }).notNull(),
  venue: varchar("venue", { length: 60 }),
  status: varchar("status", { length: 20 }).notNull().default("lobby"),
  hostPlayerId: uuid("host_player_id"),
  mlbGamePk: integer("mlb_game_pk"),
  mlbDetailedState: varchar("mlb_detailed_state", { length: 60 }),
  mlbAwayScore: integer("mlb_away_score"),
  mlbHomeScore: integer("mlb_home_score"),
  mlbCurrentInning: integer("mlb_current_inning"),
  mlbCurrentHalf: varchar("mlb_current_half", { length: 10 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const playersTable = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 30 }).notNull(),
    avatar: varchar("avatar", { length: 30 }).notNull(),
    isHost: boolean("is_host").notNull().default(false),
    totalScore: integer("total_score").notNull().default(0),
    correctPicks: integer("correct_picks").notNull().default(0),
    totalPicks: integer("total_picks").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqGameUser: uniqueIndex("players_game_user_unique").on(
      t.gameId,
      t.userId,
    ),
  }),
);

export const atBatsTable = pgTable("at_bats", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => gamesTable.id, { onDelete: "cascade" }),
  batterName: varchar("batter_name", { length: 60 }).notNull(),
  team: varchar("team", { length: 30 }).notNull(),
  inning: integer("inning").notNull(),
  half: varchar("half", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  actualOutcome: varchar("actual_outcome", { length: 20 }),
  mlbAtBatIndex: integer("mlb_at_bat_index"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const atBatPredictionsTable = pgTable(
  "at_bat_predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    atBatId: uuid("at_bat_id")
      .notNull()
      .references(() => atBatsTable.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    prediction: varchar("prediction", { length: 20 }).notNull(),
    pointsAwarded: integer("points_awarded"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqAtBatPlayer: uniqueIndex("at_bat_predictions_unique").on(
      t.atBatId,
      t.playerId,
    ),
  }),
);

export const playerPicksTable = pgTable(
  "player_picks",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    winnerTeam: varchar("winner_team", { length: 30 }),
    awayFinalScore: integer("away_final_score"),
    homeFinalScore: integer("home_final_score"),
    hrHitters: text("hr_hitters").array().notNull().default([]),
    totalWalks: integer("total_walks"),
    totalStrikeouts: integer("total_strikeouts"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId] }),
  }),
);

export const inningGuessesTable = pgTable(
  "inning_guesses",
  {
    playerId: uuid("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    inning: integer("inning").notNull(),
    half: varchar("half", { length: 10 }).notNull(),
    runs: integer("runs").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId, t.inning, t.half] }),
  }),
);

export const activityEventsTable = pgTable("activity_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => gamesTable.id, { onDelete: "cascade" }),
  atBatId: uuid("at_bat_id")
    .notNull()
    .references(() => atBatsTable.id, { onDelete: "cascade" }),
  batterName: varchar("batter_name", { length: 60 }).notNull(),
  inning: integer("inning").notNull(),
  half: varchar("half", { length: 10 }).notNull(),
  outcome: varchar("outcome", { length: 20 }).notNull(),
  awardedCount: integer("awarded_count").notNull().default(0),
  topScorerId: uuid("top_scorer_id"),
  topScorerName: varchar("top_scorer_name", { length: 30 }),
  topScorerPoints: integer("top_scorer_points"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type Game = typeof gamesTable.$inferSelect;
export type Player = typeof playersTable.$inferSelect;
export type AtBat = typeof atBatsTable.$inferSelect;
export type AtBatPrediction = typeof atBatPredictionsTable.$inferSelect;
export type PlayerPick = typeof playerPicksTable.$inferSelect;
export type InningGuess = typeof inningGuessesTable.$inferSelect;
export type ActivityEvent = typeof activityEventsTable.$inferSelect;
