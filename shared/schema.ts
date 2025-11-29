import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, serial, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Games table - stores active bingo games
export const games = pgTable("games", {
  id: varchar("id").primaryKey(), // Game code like "ABC123"
  hostId: varchar("host_id").notNull(),
  hostName: text("host_name").notNull(),
  status: varchar("status").notNull().default("waiting"), // waiting, playing, paused, finished
  playerLimit: integer("player_limit").notNull(),
  winPattern: varchar("win_pattern").notNull().default("line"),
  calledNumbers: json("called_numbers").default([]), // Array of called numbers
  stagedNumber: integer("staged_number"), // Currently staged number
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Players table - players in each game
export const players = pgTable("players", {
  id: varchar("id").primaryKey(), // UUID
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cardCount: integer("card_count").default(1),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Cards table - individual bingo cards
export const cards = pgTable("cards", {
  id: varchar("id").primaryKey(), // UUID
  playerId: varchar("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  numbers: json("numbers").notNull(), // Array of 25 numbers
  marked: json("marked").default([]), // Array of marked indices
});

// Winners table - track winners in each game
export const winners = pgTable("winners", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  playerId: varchar("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  pattern: varchar("pattern").notNull(),
  wonAt: timestamp("won_at").defaultNow().notNull(),
});

// Messages table - chat messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey(),
  gameId: varchar("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  text: text("text").notNull(),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertGameSchema = createInsertSchema(games).omit({ createdAt: true, updatedAt: true });
export const insertPlayerSchema = createInsertSchema(players).omit({ joinedAt: true });
export const insertCardSchema = createInsertSchema(cards);
export const insertWinnerSchema = createInsertSchema(winners).omit({ id: true, wonAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ createdAt: true });

// Types
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Winner = typeof winners.$inferSelect;
export type InsertWinner = z.infer<typeof insertWinnerSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
