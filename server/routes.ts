import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";

// Generate random game code
function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate bingo card (25 random numbers in proper columns)
function generateCard(): number[] {
  const card: number[] = [];
  for (let i = 0; i < 5; i++) {
    const min = i * 15 + 1;
    const max = i * 15 + 15;
    const nums = new Set<number>();
    while (nums.size < 5) {
      nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    card.push(...Array.from(nums));
  }
  return card;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create Game
  app.post("/api/games", async (req, res) => {
    try {
      const { hostName, playerLimit, hostCardCount, winPattern } = req.body;
      const gameId = generateGameCode();

      const game = await storage.createGame({
        id: gameId,
        hostId: `host-${gameId}`,
        hostName,
        playerLimit,
        winPattern,
      });

      // Add host as a player
      const hostPlayer = await storage.createPlayer({
        id: `host-${gameId}`,
        gameId,
        name: hostName,
        cardCount: hostCardCount || 1,
      });

      // Create host's cards
      for (let i = 0; i < (hostCardCount || 1); i++) {
        await storage.createCard({
          id: `${hostPlayer.id}-card-${i}`,
          playerId: hostPlayer.id,
          gameId,
          numbers: generateCard(),
        });
      }

      res.json({ gameId, game, player: hostPlayer });
    } catch (error) {
      console.error("Create game error:", error);
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  // Get Game State
  app.get("/api/games/:gameId", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const gamePlayers = await storage.getGamePlayers(game.id);
      const gameWinners = await storage.getGameWinners(game.id);
      const gameMessages = await storage.getGameMessages(game.id);

      res.json({ game, players: gamePlayers, winners: gameWinners, messages: gameMessages });
    } catch (error) {
      console.error("Get game error:", error);
      res.status(500).json({ error: "Failed to get game" });
    }
  });

  // Join Game
  app.post("/api/games/:gameId/join", async (req, res) => {
    try {
      const { playerName, cardCount } = req.body;
      const gameId = req.params.gameId;

      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const gamePlayers = await storage.getGamePlayers(gameId);
      if (gamePlayers.length >= game.playerLimit) {
        return res.status(400).json({ error: "Game is full" });
      }

      const playerId = randomUUID();
      const player = await storage.createPlayer({
        id: playerId,
        gameId,
        name: playerName,
        cardCount,
      });

      // Create player's cards
      for (let i = 0; i < cardCount; i++) {
        await storage.createCard({
          id: `${playerId}-card-${i}`,
          playerId,
          gameId,
          numbers: generateCard(),
        });
      }

      const playerCards = await storage.getPlayerCards(playerId);

      res.json({ player, cards: playerCards });
    } catch (error) {
      console.error("Join game error:", error);
      res.status(500).json({ error: "Failed to join game" });
    }
  });

  // Start Game
  app.post("/api/games/:gameId/start", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const { playerId } = req.body;
      const game = await storage.getGame(gameId);
      if (!game) return res.status(404).json({ error: "Game not found" });
      if (playerId !== game.hostId) return res.status(403).json({ error: "Only host can start the game" });
      await storage.updateGameStatus(gameId, "playing");
      res.json({ status: "playing" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start game" });
    }
  });

  // Reset Game (clear called numbers and status back to waiting)
  app.post("/api/games/:gameId/reset", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const { playerId } = req.body;
      const game = await storage.getGame(gameId);
      if (!game) return res.status(404).json({ error: "Game not found" });
      if (playerId !== game.hostId) return res.status(403).json({ error: "Only host can reset the game" });

      // Update game status to waiting and clear called numbers
      await storage.updateGameStatus(gameId, "waiting");
      await storage.updateCalledNumbers(gameId, []);

      // Clear marked cards for all players
      const players = await storage.getGamePlayers(gameId);
      for (const player of players) {
        const cards = await storage.getPlayerCards(player.id);
        for (const card of cards) {
          await storage.updateCardMarked(card.id, []);
        }
      }

      res.json({ status: "waiting", calledNumbers: [], message: "Game reset" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset game" });
    }
  });

  // Remove Player from Game
  app.post("/api/games/:gameId/players/:playerId/remove", async (req, res) => {
    try {
      const { gameId, playerId } = req.params;

      // Delete player's cards first (due to foreign key constraints)
      const cards = await storage.getPlayerCards(playerId);
      for (const card of cards) {
        await storage.deleteCard(card.id);
      }

      // Delete the player
      await storage.deletePlayer(playerId);

      res.json({ message: "Player removed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove player" });
    }
  });

  // Call Number - HOST ONLY
  app.post("/api/games/:gameId/call", async (req, res) => {
    try {
      const { number, playerId } = req.body;
      const gameId = req.params.gameId;

      const game = await storage.getGame(gameId);
      if (!game) return res.status(404).json({ error: "Game not found" });

      // CRITICAL: Only allow the host to call numbers
      if (playerId !== game.hostId) {
        return res.status(403).json({ error: "Only host can call numbers" });
      }

      const calledNumbers = (game.calledNumbers as number[]) || [];
      if (!calledNumbers.includes(number)) {
        calledNumbers.push(number);
        await storage.updateCalledNumbers(gameId, calledNumbers);
      }

      res.json({ calledNumbers });
    } catch (error) {
      res.status(500).json({ error: "Failed to call number" });
    }
  });

  // Pause Game
  app.post("/api/games/:gameId/pause", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const { playerId } = req.body;
      const game = await storage.getGame(gameId);
      if (!game) return res.status(404).json({ error: "Game not found" });
      if (playerId !== game.hostId) return res.status(403).json({ error: "Only host can pause the game" });
      await storage.updateGameStatus(gameId, "paused");
      res.json({ status: "paused" });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause game" });
    }
  });

  // Mark Card
  app.post("/api/games/:gameId/mark", async (req, res) => {
    try {
      const { cardId, marked } = req.body;

      if (!cardId || !Array.isArray(marked)) {
        return res.status(400).json({ error: "Invalid request body" });
      }

      await storage.updateCardMarked(cardId, marked);

      res.json({ marked });
    } catch (error) {
      console.error("Mark number error:", error);
      res.status(500).json({ error: "Failed to mark card" });
    }
  });

  // Send Chat Message
  app.post("/api/games/:gameId/messages", async (req, res) => {
    try {
      const { sender, text } = req.body;
      const gameId = req.params.gameId;

      const message = await storage.createMessage({
        id: randomUUID(),
        gameId,
        sender,
        text,
      });

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  return httpServer;
}
