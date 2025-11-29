import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "./api-utils";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

export type UserRole = "host" | "player" | "developer" | "spectator";

// Developer mode staging queue - tracks staged numbers per developer player
interface DeveloperQueue {
  playerId: string;
  playerName: string;
  stagedNumbers: number[];
}

export interface Player {
  id: string;
  name: string;
  cardCount: number;
  joinedAt: Date;
}

export interface BingoCard {
  id: string;
  numbers: number[]; // Flat array 0-24
  marked: number[]; // Indices 0-24
}

export interface GameState {
  status: "waiting" | "playing" | "paused" | "finished";
  gameId: string;
  hostName: string;
  hostId: string;
  players: Player[];
  calledNumbers: number[];
  stagedNumber: number | null;
  winner: { name: string; pattern: string } | null;
  winners: { name: string; pattern: string }[];
  missedWinners: { name: string; pattern: string; reason: string }[];
  playerLimit: number;
  winPattern: "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full";
  messages: ChatMessage[];
  lastActivityAt: number;
  developerQueues: DeveloperQueue[]; // Multiple dev mode queues per player
}

interface GameContextType {
  gameState: GameState;
  role: UserRole;
  currentUser: { name: string; id: string };
  myCards: BingoCard[];
  isDeveloper: boolean;

  // Actions
  createGame: (hostName: string, limit: number, hostCardCount?: number, winPattern?: "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full") => Promise<string | null>;
  joinGame: (gameId: string, playerName: string, cardsOrPlayerId: number | string) => Promise<boolean>;
  enableDevMode: (secret: string) => boolean;
  stageNumberForQueue: (num: number) => void;
  callNumberFromQueue: () => void;
  clearQueue: () => void;
  sendMessage: (text: string) => void;
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;
  callNumber: (override?: number) => void;
  stageNumber: (num: number) => void;
  markNumber: (cardId: string, numberIndex: number) => void;
  claimBingo: (cardId: string) => void;
  toggleTheme: () => void;
  setWinPattern: (pattern: "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full") => void;
  continueGame: () => void;
  addCard: () => void;
  removeCard: (cardId: string) => void;
  exitGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Mock Data Helpers
const generateCard = (): number[] => {
  const card: number[] = [];
  // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
  for (let i = 0; i < 5; i++) {
    const min = i * 15 + 1;
    const max = i * 15 + 15;
    const nums = new Set<number>();
    while (nums.size < 5) {
      nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    card.push(...Array.from(nums));
  }
  // Transpose to getting columns correct in linear layout if needed,
  // but usually we store column by column.
  // Standard storage: 0-4 is B, 5-9 is I, etc.
  return card;
};

// Pattern validation function - VALIDATES AGAINST ACTUAL CARD NUMBERS
const checkPatternMatch = (marked: number[], pattern: "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full", calledNumbers: number[], cardNumbers: number[]): boolean => {
  // Helper: check if index is marked
  const isMarked = (i: number) => marked.includes(i);

  // Helper: verify marked number was actually called by host
  const wasNumberCalled = (cardIndex: number): boolean => {
    if (cardIndex === 12) return true; // Free space is always valid
    const number = cardNumbers[cardIndex];
    return calledNumbers.includes(number);
  };

  // Validate a pattern - ALL indices must be marked AND number must be called
  const validatePattern = (indices: number[]): boolean => {
    return indices.every(i => isMarked(i) && wasNumberCalled(i));
  };

  const card = cardNumbers;

  switch (pattern) {
    case "line": {
      // Any single row, column, or diagonal
      // Rows
      for (let r = 0; r < 5; r++) {
        if (validatePattern([r, r + 5, r + 10, r + 15, r + 20])) return true;
      }
      // Columns
      for (let c = 0; c < 5; c++) {
        if (validatePattern([c * 5, c * 5 + 1, c * 5 + 2, c * 5 + 3, c * 5 + 4])) return true;
      }
      // Diagonals
      if (validatePattern([0, 6, 12, 18, 24])) return true;
      if (validatePattern([4, 8, 12, 16, 20])) return true;
      return false;
    }

    case "diagonal": {
      // One diagonal (C pattern)
      return validatePattern([0, 6, 12, 18, 24]) || validatePattern([4, 8, 12, 16, 20]);
    }

    case "cross": {
      // Both diagonals (X pattern)
      return validatePattern([0, 6, 12, 18, 24]) && validatePattern([4, 8, 12, 16, 20]);
    }

    case "box": {
      // Outer border (4 sides)
      return validatePattern([0, 1, 2, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24]);
    }

    case "corners": {
      // Just 4 corners
      return validatePattern([0, 4, 20, 24]);
    }

    case "rows": {
      // All 5 rows completely filled
      for (let r = 0; r < 5; r++) {
        if (!validatePattern([r, r + 5, r + 10, r + 15, r + 20])) return false;
      }
      return true;
    }

    case "columns": {
      // All 5 columns completely filled
      for (let c = 0; c < 5; c++) {
        if (!validatePattern([c * 5, c * 5 + 1, c * 5 + 2, c * 5 + 3, c * 5 + 4])) return false;
      }
      return true;
    }

    case "full": {
      // All 25 numbers (24 + 1 free space)
      for (let i = 0; i < 25; i++) {
        if (!isMarked(i) || !wasNumberCalled(i)) return false;
      }
      return true;
    }

    default:
      return false;
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();

  // Restore session from localStorage on mount
  const [initialRole, setInitialRole] = useState<UserRole>("spectator");
  const [initialUser, setInitialUser] = useState({ name: "Guest", id: "guest" });
  const [initialCards, setInitialCards] = useState<BingoCard[]>([]);

  const [role, setRole] = useState<UserRole>("spectator");
  const [currentUser, setCurrentUser] = useState({ name: "Guest", id: "guest" });
  const [myCards, setMyCards] = useState<BingoCard[]>([]);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [theme, setThemeState] = useState<"default" | "developer">(() => {
    const stored = sessionStorage.getItem("neon-bingo-theme");
    return stored === "developer" ? "developer" : "default";
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    // Load game state from localStorage (shared across ALL tabs)
    const savedState = localStorage.getItem("neon-bingo-state");
    // Load session from sessionStorage (per-tab only - persists across refresh within same tab)
    const savedSession = sessionStorage.getItem("neon-bingo-session");

    if (savedState && savedSession) {
      try {
        const parsed = JSON.parse(savedState);
        const session = JSON.parse(savedSession);

        // Restore dates
        parsed.players = parsed.players.map((p: any) => ({ ...p, joinedAt: new Date(p.joinedAt) }));
        parsed.messages = parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));

        // Restore session info (per-tab from sessionStorage)
        setInitialRole(session.role);
        setInitialUser(session.currentUser);
        setInitialCards(session.myCards || []);

        // Apply restored role/user/cards IMMEDIATELY ON REFRESH
        // NOTE: Role will be recalculated in joinGame() based on host/player status, not restored from sessionStorage
        // This prevents hosts from staying in developer mode after a refresh
        setCurrentUser(session.currentUser);
        setMyCards(session.myCards || []);

        console.log("✅ [GAME-PROVIDER] Restored session from storage on mount:", session.currentUser.name, "Role:", session.role);

        return parsed;
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
    return {
      status: "waiting",
      gameId: "",
      hostName: "Host",
      hostId: "",
      players: [],
      calledNumbers: [],
      stagedNumber: null,
      winner: null,
      winners: [],
      missedWinners: [],
      playerLimit: 100,
      winPattern: "line",
      messages: [],
      lastActivityAt: 0,
      developerQueues: []
    };
  });

  // Poll for game state changes
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (gameState.gameId) {
        try {
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/games/${gameState.gameId}`);
          const data = await response.json();

          if (response.ok) {
            setGameState(prev => ({
              ...prev,
              status: data.game.status,
              players: data.players.map((p: any) => ({ ...p, joinedAt: new Date(p.joinedAt) })),
              calledNumbers: data.game.calledNumbers,
              winners: data.winners,
              messages: data.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
            }));
          }
        } catch (error) {
          console.error("Failed to poll for game state", error);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [gameState.gameId]);

  // Sync session data (role, user, cards) to sessionStorage (per-tab only!)
  useEffect(() => {
    if (gameState.gameId) { // Only save if in a game
      const session = {
        role,
        currentUser,
        myCards
      };
      sessionStorage.setItem("neon-bingo-session", JSON.stringify(session));
    }
  }, [role, currentUser, myCards, gameState.gameId]);

  const createGame = async (hostName: string, limit: number, hostCardCount: number = 1, winPattern: "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full" = "line"): Promise<string | null> => {
    try {
      const apiUrl = getApiUrl();
      console.log("🎬 [GAME-STATE] Creating game on backend at:", apiUrl);
      console.log("📤 [GAME-STATE] Request body:", { hostName, playerLimit: limit, hostCardCount, winPattern });

      const response = await fetch(`${apiUrl}/api/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostName, playerLimit: limit, hostCardCount, winPattern })
      });

      console.log("📡 [GAME-STATE] Backend response status:", response.status, "OK:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [GAME-STATE] Backend error:", response.status, errorText);
        toast({ title: "Error", description: `Backend error: ${response.status}`, variant: "destructive", duration: 3000 });
        return null;
      }

      const data = await response.json();
      const gameId = data.gameId;
      const hostId = data.player.id;

      console.log("✅ [GAME-STATE] Game created! GameID:", gameId, "Type:", typeof gameId);
      console.log("📊 [GAME-STATE] Full backend response:", data);

      const hostPlayer: Player = {
        id: hostId,
        name: hostName,
        cardCount: hostCardCount,
        joinedAt: new Date()
      };

      const newState: GameState = {
        status: "waiting",
        gameId,
        hostName,
        hostId,
        playerLimit: limit,
        players: [hostPlayer],
        calledNumbers: [],
        stagedNumber: null,
        winner: null,
        winners: [],
        missedWinners: [],
        winPattern,
        messages: [],
        lastActivityAt: Date.now(),
        developerQueues: []
      };

      setGameState(newState);
      localStorage.setItem("neon-bingo-state", JSON.stringify(newState));
      localStorage.setItem("neon-bingo-game-id", gameId);

      setRole("host");
      setCurrentUser({ name: hostName, id: hostId });
      sessionStorage.setItem("neon-bingo-player-id", hostId);
      sessionStorage.setItem("neon-bingo-player-name", hostName);

      const hostCards = Array(hostCardCount).fill(0).map((_, i) => ({
        id: `${hostId}-card-${i}`,
        numbers: data.player.cards ? data.player.cards[i] : generateCard(),
        marked: []
      }));
      setMyCards(hostCards);

      console.log("📦 [GAME-STATE] About to return gameId:", gameId, "Type:", typeof gameId);
      toast({ title: "Game Created", description: `Game ID: ${gameId}`, duration: 1000 });
      return gameId;
    } catch (error) {
      console.error("❌ Create game error:", error);
      toast({ title: "Error", description: "Failed to create game", variant: "destructive", duration: 3000 });
      return null;
    }
  };

  const joinGame = async (gameId: string, playerName: string, cardsOrPlayerId?: number | string, existingPlayerId?: string): Promise<boolean> => {
    try {
      const trimmedGameId = gameId.trim().toUpperCase();
      const apiUrl = getApiUrl();

      // Handle overloaded parameters: either (gameId, playerName, cards) or (gameId, playerName, existingPlayerId)
      let cards = 1;
      let playerId: string | undefined = undefined;

      if (typeof cardsOrPlayerId === "string") {
        playerId = cardsOrPlayerId; // It's an existing player ID
      } else if (typeof cardsOrPlayerId === "number") {
        cards = cardsOrPlayerId; // It's card count
      }

      console.log("🎬 Joining game on backend:", apiUrl, gameId, playerId ? `(existing player: ${playerId})` : "(new player)");

      // Fetch full game state from backend first
      const gameResponse = await fetch(`${apiUrl}/api/games/${trimmedGameId}`);
      const gameData = await gameResponse.json();

      if (!gameData.game) {
        toast({ title: "Error", description: "Game not found", variant: "destructive", duration: 3000 });
        return false;
      }

      // CRITICAL: If this is a returning player (has playerId), use their existing ID
      // This prevents creating duplicate players for hosts who refresh
      let playerCards = [];

      if (!playerId) {
        // NEW PLAYER: Call join endpoint to create new player
        const response = await fetch(`${apiUrl}/api/games/${trimmedGameId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName, cardCount: cards })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Backend join failed:", response.status, errorText);
          toast({ title: "Error", description: `Failed to join game: ${response.status}`, variant: "destructive", duration: 3000 });
          return false;
        }

        const data = await response.json();
        playerId = data.player.id;
        playerCards = data.cards;
      } else {
        // RETURNING PLAYER: Don't create new player, just restore their data
        console.log("🔄 Restoring returning player:", playerId);
        // For returning players, cards are already in gameData if available
        // Otherwise cards will be empty and that's OK - they'll sync when needed
        playerCards = gameData.cards ? gameData.cards.filter((c: any) => c.playerId === playerId) : [];
      }

      // Build game state from backend data
      const newState: GameState = {
        status: gameData.game.status || "waiting",
        gameId: gameData.game.id,
        hostName: gameData.game.hostName,
        hostId: gameData.game.hostId,
        playerLimit: gameData.game.playerLimit,
        players: gameData.players.map((p: any) => ({ ...p, joinedAt: new Date(p.joinedAt) })),
        calledNumbers: gameData.game.calledNumbers || [],
        stagedNumber: gameData.game.stagedNumber || null,
        winner: null,
        winners: gameData.winners || [],
        missedWinners: [],
        winPattern: gameData.game.winPattern || "line",
        messages: gameData.messages ? gameData.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) : [],
        lastActivityAt: gameData.game.lastActivityAt || Date.now(),
        developerQueues: []
      };

      setGameState(newState);
      localStorage.setItem("neon-bingo-state", JSON.stringify(newState));
      localStorage.setItem("neon-bingo-game-id", trimmedGameId);

      // CRITICAL: Determine role correctly - check if player ID equals host ID
      // This recalculates role every time user rejoins, preventing developer mode from persisting after refresh
      const finalPlayerId = playerId || "";
      const playerRole = finalPlayerId === gameData.game.hostId ? "host" : "player";
      setRole(playerRole);
      setCurrentUser({ name: playerName, id: finalPlayerId });
      sessionStorage.setItem("neon-bingo-player-id", finalPlayerId);
      sessionStorage.setItem("neon-bingo-player-name", playerName);
      // CRITICAL: Clear developer mode from sessionStorage on rejoin to reset role
      sessionStorage.removeItem("neon-bingo-theme");
      setIsDeveloper(false);

      const newCards = (playerCards || []).map((card: any) => ({
        id: card.id,
        numbers: card.numbers,
        marked: card.marked || []
      }));
      setMyCards(newCards);

      console.log("✅ Successfully joined game from backend:", trimmedGameId, "Role:", playerRole);
      return true;
    } catch (error) {
      console.error("Join game error:", error);
      toast({ title: "Connection Error", description: "Could not reach server. Please check backend is running.", variant: "destructive", duration: 3000 });
      return false;
    }
  };

  const enableDevMode = (secret: string) => {
    if (secret === "dev123" && role !== "host") {
      // Players can enter developer mode, but hosts cannot
      setRole("developer");
      setIsDeveloper(true);
      setThemeState("developer");
      sessionStorage.setItem("neon-bingo-theme", "developer");

      // CREATE INDEPENDENT DEV QUEUE FOR THIS PLAYER
      setGameState(prev => {
        const existingQueue = prev.developerQueues.find(q => q.playerId === currentUser.id);
        if (existingQueue) return prev; // Already has queue

        return {
          ...prev,
          developerQueues: [...prev.developerQueues, {
            playerId: currentUser.id,
            playerName: currentUser.name,
            stagedNumbers: []
          }]
        };
      });

      toast({ title: "Developer Mode Enabled", description: "You now have independent number staging queue", duration: 2000, className: "bg-purple-600 text-white border-purple-700" });
      return true;
    }
    return false;
  };

  // DEVELOPER MODE: Stage number in personal queue
  const stageNumberForQueue = (num: number) => {
    if (role !== "developer") return;

    setGameState(prev => {
      const updatedQueues = prev.developerQueues.map(q => {
        if (q.playerId === currentUser.id) {
          // Add number to queue if not already there
          if (!q.stagedNumbers.includes(num)) {
            return { ...q, stagedNumbers: [...q.stagedNumbers, num] };
          }
        }
        return q;
      });
      return { ...prev, developerQueues: updatedQueues };
    });
  };

  // DEVELOPER MODE: Call next number in personal queue
  const callNumberFromQueue = () => {
    if (role !== "developer") return;
    if (gameState.status !== "playing") return;

    const myQueue = gameState.developerQueues.find(q => q.playerId === currentUser.id);
    if (!myQueue || myQueue.stagedNumbers.length === 0) {
      toast({ title: "Queue Empty", description: "Stage a number first", variant: "destructive" });
      return;
    }

    const nextNumber = myQueue.stagedNumbers[0];
    callNumber(nextNumber);

    // Remove from queue
    setGameState(prev => {
      const updatedQueues = prev.developerQueues.map(q => {
        if (q.playerId === currentUser.id) {
          return { ...q, stagedNumbers: q.stagedNumbers.slice(1) };
        }
        return q;
      });
      return { ...prev, developerQueues: updatedQueues };
    });
  };

  // DEVELOPER MODE: Clear personal queue
  const clearQueue = () => {
    if (role !== "developer") return;

    setGameState(prev => {
      const updatedQueues = prev.developerQueues.map(q => {
        if (q.playerId === currentUser.id) {
          return { ...q, stagedNumbers: [] };
        }
        return q;
      });
      return { ...prev, developerQueues: updatedQueues };
    });
    toast({ title: "Queue Cleared", description: "Your staging queue has been cleared" });
  };

  const sendMessage = async (text: string) => {
    // Check for Dev Mode Secret
    if (text.trim() === "dev123") {
      enableDevMode("dev123");
      return; // Do NOT broadcast the message
    }

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/games/${gameState.gameId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: currentUser.name, text }),
      });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const startGame = async () => {
    if (role !== "host" && role !== "developer") return;
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/games/${gameState.gameId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentUser.id }),
      });
      toast({ title: "Game Started!", variant: "default" });
    } catch (error) {
      console.error("Failed to start game", error);
    }
  };

  const pauseGame = async () => {
    if (role !== "host" && role !== "developer") return;
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/games/${gameState.gameId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentUser.id }),
      });
    } catch (error) {
      console.error("Failed to pause game", error);
    }
  };

  const resetGame = async () => {
    if (role !== "host") return;

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/games/${gameState.gameId}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentUser.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset game on server");
      }

      // ✅ MAINTAIN GAME ID - Only reset game state, not the room itself
      setGameState(prev => ({
        ...prev,
        status: "waiting",
        calledNumbers: [],
        stagedNumber: null,
        winner: null,
        winners: [],
        missedWinners: [],
        messages: [],
        lastActivityAt: Date.now()
      }));
      setMyCards(prev => prev.map(c => ({ ...c, marked: [] })));
      toast({ title: "Game Restarted!", description: `GameID ${gameState.gameId} - Room maintained, game ready to play again` });
    } catch (error) {
      console.error("Reset game error:", error);
      toast({ title: "Error", description: "Failed to reset game", variant: "destructive" });
    }
  };

  const stageNumber = (num: number) => {
    // ONLY developers (role) can stage numbers - hosts cannot even with isDeveloper flag
    if (role !== "developer" || currentUser.id === gameState.hostId) return;
    setGameState(prev => ({ ...prev, stagedNumber: num }));
  };

  const callNumber = async (override?: number) => {
    if (gameState.status !== "playing" || (role !== "host" && role !== "developer")) return;

    const available = Array.from({ length: 75 }, (_, i) => i + 1)
      .filter(n => !gameState.calledNumbers.includes(n));

    if (available.length === 0) return;

    const nextNum = override || available[Math.floor(Math.random() * available.length)];

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/games/${gameState.gameId}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: nextNum, playerId: currentUser.id }),
      });
    } catch (error) {
      console.error("Failed to call number", error);
    }
  };

  const autoScanForWinners = () => {
    const scanMissedWinners: { name: string; pattern: string; reason: string }[] = [];

    // Scan all players (for next phase - we store player cards separately)
    // For now, just show message that scanning happened
    setGameState(prev => ({
      ...prev,
      status: "finished",
      missedWinners: scanMissedWinners,
      winner: scanMissedWinners.length > 0
        ? scanMissedWinners[0]
        : null
    }));

    if (scanMissedWinners.length > 0) {
      toast({
        title: "No Marked Winners",
        description: `${scanMissedWinners.map(w => w.name).join(", ")} should have won but didn't mark the pattern!`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Game Over",
        description: "All numbers called. No one won this game. Host must restart.",
        variant: "destructive"
      });
    }
  };

  const markNumber = async (cardId: string, numberIndex: number) => {
    const card = myCards.find(c => c.id === cardId);
    if (!card) return;

    const newMarked = card.marked.includes(numberIndex)
      ? card.marked.filter(i => i !== numberIndex)
      : [...card.marked, numberIndex];

    // Optimistic update
    setMyCards(cards => cards.map(c => c.id === cardId ? { ...c, marked: newMarked } : c));

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/games/${gameState.gameId}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, marked: newMarked }),
      });
    } catch (error) {
      console.error("Failed to mark number", error);
      // Revert optimistic update on error
      setMyCards(cards => cards.map(c => c.id === cardId ? { ...c, marked: card.marked } : c));
    }
  };

  const claimBingo = (cardId: string) => {
    const card = myCards.find(c => c.id === cardId);
    if (!card) return;

    // PREVENT DOUBLE CLAIM: Check if this card already claimed bingo
    const cardAlreadyClaimed = gameState.winners.some(w =>
      w.name === currentUser.name && card.id === `${currentUser.id}-${cardId}`
    );
    if (cardAlreadyClaimed) {
      toast({
        title: "Already Claimed",
        description: "You already called bingo on this card!",
        variant: "destructive"
      });
      return;
    }

    // VALIDATE: Check if marked pattern matches required pattern AND all numbers were called
    const isValidBingo = checkPatternMatch(
      card.marked,
      gameState.winPattern,
      gameState.calledNumbers,
      card.numbers // Pass actual card numbers for validation
    );

    if (isValidBingo) {
      const newWinner = { name: currentUser.name, pattern: gameState.winPattern };

      // UPDATE GAME STATE: Record winner but KEEP GAME PLAYING
      setGameState(prev => ({
        ...prev,
        winner: newWinner,
        winners: [...prev.winners, newWinner]
        // ❌ DO NOT set status to "finished" - game continues!
      }));

      // SHOW WINNER NOTIFICATION FOR 3 SECONDS THEN AUTO-CLEAR
      toast({
        title: "BINGO!",
        description: `${currentUser.name} won with ${gameState.winPattern} pattern!`,
        className: "bg-primary text-primary-foreground border-none text-xl font-bold",
        duration: 3000
      });

      // AUTO-CLEAR WINNER NOTIFICATION AFTER 3 SECONDS
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          winner: null
        }));
      }, 3000);
    } else {
      const uncalledNumbers = card.marked
        .filter(idx => idx !== 12 && !gameState.calledNumbers.includes(card.numbers[idx]))
        .map(idx => card.numbers[idx]);

      const errorMsg = uncalledNumbers.length > 0
        ? `Some marked numbers haven't been called yet: ${uncalledNumbers.join(", ")}`
        : `Pattern mismatch! You need the ${gameState.winPattern} pattern to win.`;

      toast({
        title: "Not Valid BINGO",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  const continueGame = () => {
    if (role !== "host") return;
    setGameState(prev => ({
      ...prev,
      status: "playing",
      winner: null
    }));
    toast({ title: "Game Continues", description: "Looking for the next winner..." });
  };

  const addCard = () => {
    if (myCards.length >= 5) {
      toast({ title: "Card Limit Reached", description: "You can only have 5 cards maximum", variant: "destructive" });
      return;
    }
    const newCard: BingoCard = {
      id: `card-${myCards.length}`,
      numbers: generateCard(),
      marked: []
    };
    setMyCards([...myCards, newCard]);
    toast({ title: "Card Added", description: `You now have ${myCards.length + 1} card(s)` });
  };

  const removeCard = (cardId: string) => {
    setMyCards(myCards.filter(card => card.id !== cardId));
    toast({ title: "Card Removed", description: `You now have ${myCards.length - 1} card(s)` });
  };

  // Update player card count in gameState when myCards changes
  useEffect(() => {
    if (role !== "spectator" && currentUser.id) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === currentUser.id ? { ...p, cardCount: myCards.length } : p
        )
      }));
    }
  }, [myCards.length, role, currentUser.id]);

  const exitGame = async () => {
    try {
      // Remove player from database
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/games/${gameState.gameId}/players/${currentUser.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).catch(() => {}); // Ignore errors if API call fails

      // Remove this player from the shared game state
      setGameState(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== currentUser.id)
      }));

      // Clear this tab's session
      sessionStorage.removeItem("neon-bingo-session");
      sessionStorage.removeItem("neon-bingo-theme");
      sessionStorage.removeItem("neon-bingo-player-id");
      sessionStorage.removeItem("neon-bingo-player-name");

      setRole("spectator");
      setCurrentUser({ name: "Guest", id: "guest" });
      setMyCards([]);
      setThemeState("default");
      setIsDeveloper(false);
      toast({ title: "Left Game", description: "You've exited the game room" });
    } catch (error) {
      console.error("Exit game error:", error);
    }
  };

  const toggleTheme = () => {
      // Theme toggle removed - use dev mode for development
  }

  const setWinPattern = (pattern: "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full") => {
    setGameState(prev => ({ ...prev, winPattern: pattern }));
  };

  return (
    <GameContext.Provider value={{
      gameState,
      role,
      currentUser,
      myCards,
      isDeveloper,
      createGame,
      joinGame,
      enableDevMode,
      stageNumberForQueue,
      callNumberFromQueue,
      clearQueue,
      sendMessage,
      startGame,
      pauseGame,
      resetGame,
      callNumber,
      stageNumber,
      markNumber,
      claimBingo,
      toggleTheme,
      setWinPattern,
      continueGame,
      addCard,
      removeCard,
      exitGame
    }}>
      <div className={isDeveloper ? "developer-theme" : ""}>
        {children}
      </div>
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
};
