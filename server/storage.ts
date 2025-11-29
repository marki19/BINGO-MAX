import { db } from "./db.js";
import { games, players, cards, winners, messages, insertGameSchema, insertPlayerSchema, insertCardSchema, insertWinnerSchema, insertMessageSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Game, InsertGame, Player, InsertPlayer, Card, InsertCard, Winner, InsertWinner, Message, InsertMessage } from "@shared/schema";

export interface IStorage {
  // Games
  createGame(game: InsertGame): Promise<Game>;
  getGame(gameId: string): Promise<Game | undefined>;
  updateGameStatus(gameId: string, status: string): Promise<void>;
  updateCalledNumbers(gameId: string, numbers: number[]): Promise<void>;
  updateStagedNumber(gameId: string, number: number | null): Promise<void>;

  // Players
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(playerId: string): Promise<Player | undefined>;
  getGamePlayers(gameId: string): Promise<Player[]>;
  updatePlayerCardCount(playerId: string, count: number): Promise<void>;
  deletePlayer(playerId: string): Promise<void>;

  // Cards
  createCard(card: InsertCard): Promise<Card>;
  getPlayerCards(playerId: string): Promise<Card[]>;
  updateCardMarked(cardId: string, marked: number[]): Promise<void>;
  deleteCard(cardId: string): Promise<void>;

  // Winners
  createWinner(winner: InsertWinner): Promise<Winner>;
  getGameWinners(gameId: string): Promise<Winner[]>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getGameMessages(gameId: string): Promise<Message[]>;
}

export class PostgresStorage implements IStorage {
  // Games
  async createGame(game: InsertGame): Promise<Game> {
    const [result] = await db.insert(games).values(game).returning();
    return result;
  }

  async getGame(gameId: string): Promise<Game | undefined> {
    const result = await db.query.games.findFirst({ where: eq(games.id, gameId) });
    return result;
  }

  async updateGameStatus(gameId: string, status: string): Promise<void> {
    await db.update(games).set({ status, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateCalledNumbers(gameId: string, numbers: number[]): Promise<void> {
    await db.update(games).set({ calledNumbers: numbers as any, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateStagedNumber(gameId: string, number: number | null): Promise<void> {
    await db.update(games).set({ stagedNumber: number, updatedAt: new Date() }).where(eq(games.id, gameId));
  }

  // Players
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [result] = await db.insert(players).values(player).returning();
    return result;
  }

  async getPlayer(playerId: string): Promise<Player | undefined> {
    const result = await db.query.players.findFirst({ where: eq(players.id, playerId) });
    return result;
  }

  async getGamePlayers(gameId: string): Promise<Player[]> {
    return db.query.players.findMany({ where: eq(players.gameId, gameId) });
  }

  async updatePlayerCardCount(playerId: string, count: number): Promise<void> {
    await db.update(players).set({ cardCount: count }).where(eq(players.id, playerId));
  }

  async deletePlayer(playerId: string): Promise<void> {
    await db.delete(players).where(eq(players.id, playerId));
  }

  // Cards
  async createCard(card: InsertCard): Promise<Card> {
    const [result] = await db.insert(cards).values(card).returning();
    return result;
  }

  async getPlayerCards(playerId: string): Promise<Card[]> {
    return db.query.cards.findMany({ where: eq(cards.playerId, playerId) });
  }

  async updateCardMarked(cardId: string, marked: number[]): Promise<void> {
    await db.update(cards).set({ marked: marked as any }).where(eq(cards.id, cardId));
  }

  async deleteCard(cardId: string): Promise<void> {
    await db.delete(cards).where(eq(cards.id, cardId));
  }

  // Winners
  async createWinner(winner: InsertWinner): Promise<Winner> {
    const [result] = await db.insert(winners).values(winner).returning();
    return result;
  }

  async getGameWinners(gameId: string): Promise<Winner[]> {
    return db.query.winners.findMany({ where: eq(winners.gameId, gameId) });
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getGameMessages(gameId: string): Promise<Message[]> {
    return db.query.messages.findMany({ where: eq(messages.gameId, gameId) });
  }
}

export const storage = new PostgresStorage();
