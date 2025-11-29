import React from "react";
import { Redirect, useRoute } from "wouter";
import { useGame } from "@/lib/game-state";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { BingoCard } from "@/components/bingo/card";
import { NumberBoard } from "@/components/bingo/board";
import { PlayerList } from "@/components/bingo/player-list";
import { GameControls } from "@/components/bingo/controls";
import { CurrentNumber } from "@/components/bingo/current-number";
import { DevPanel } from "@/components/dev-panel";
import { Chat } from "@/components/chat";
import { Button } from "@/components/ui/button";
import { Trophy, MessageSquare, Users, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function GameRoom() {
  const { gameState, role, myCards, claimBingo, currentUser, continueGame, resetGame, exitGame, addCard, removeCard, joinGame } = useGame();
  const { toast } = useToast();

  // Use wouter's useRoute hook to get URL parameters
  const [isInGameRoom, params] = useRoute("/game/:gameId");
  const gameIdFromUrl = params?.gameId;

  // CHECK IF CURRENT PLAYER HAS WON
  const hasCurrentPlayerWon = gameState.winners.some(w => w.name === currentUser.name);

  // Auto-rejoin game if URL has gameId but game state is empty - SERVER FIRST RECONNECTION
  React.useEffect(() => {
    if (gameIdFromUrl && !gameState.gameId) {
      console.log("🔄 [GAME-ROOM] Refresh detected! GameID from URL:", gameIdFromUrl);

      const playerId = sessionStorage.getItem("neon-bingo-player-id");
      const playerName = sessionStorage.getItem("neon-bingo-player-name") || "Guest";

      // For all returning players (including hosts), use their existing playerId to reconnect
      if (playerId) {
        console.log("👤 [GAME-ROOM] Returning player detected:", playerId);
        // joinGame will detect if this is a host by checking playerId against hostId
        joinGame(gameIdFromUrl, playerName, playerId);
      } else {
        // New player - join the game
        console.log("🌐 [GAME-ROOM] New player, joining game:", gameIdFromUrl);
        joinGame(gameIdFromUrl, playerName, 1);
      }
    }
  }, [gameIdFromUrl, gameState.gameId, joinGame]);

  // Show loading state while connecting to game
  if (!gameState.gameId && gameIdFromUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold">Reconnecting to Game</h2>
          <p className="text-muted-foreground">
            Game ID: <span className="font-mono font-bold">{gameIdFromUrl}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Connecting to server and restoring your game session...
          </p>
          <button onClick={() => window.location.href = "/"} className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors" data-testid="button-back-home">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameState.gameId && !gameIdFromUrl && role === "spectator") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* PAUSED OVERLAY - Players only */}
      {gameState.status === "paused" && role !== "host" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border-2 border-primary rounded-xl p-6 sm:p-12 text-center shadow-lg max-w-sm w-full"
          >
            <div className="text-5xl sm:text-6xl mb-4 animate-pulse">⏸️</div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">GAME PAUSED</h1>
            <p className="text-base sm:text-lg text-muted-foreground">Host paused the game</p>
          </motion.div>
        </div>
      )}

      {/* WINNER NOTIFICATION (Players only, when someone won) */}
      {gameState.status === "finished" && role !== "host" && gameState.winner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border-2 border-primary rounded-xl p-6 sm:p-8 text-center shadow-lg max-w-md w-full"
          >
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">BINGO!</h1>
            <p className="text-lg sm:text-xl text-muted-foreground break-words">
              <span className="font-bold">{gameState.winner.name}</span> won!
            </p>
          </motion.div>
        </div>
      )}

      {/* MISSED WINNERS NOTIFICATION - Players only */}
      {gameState.missedWinners.length > 0 && role !== "host" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border-2 border-destructive rounded-xl p-6 sm:p-8 text-center shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-destructive mb-4">Missed Winners!</h1>
            <div className="space-y-2 mb-6">
              {gameState.missedWinners.map((w, i) => (
                <p key={i} className="text-base sm:text-lg text-muted-foreground break-words">
                  <span className="font-bold">{w.name}</span> should&apos;ve won with {w.pattern}!
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              BINGO MAX
            </h1>
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted border border-border text-sm font-mono cursor-pointer hover:bg-muted/80 transition-colors group"
              onClick={() => {
                navigator.clipboard.writeText(gameState.gameId);
                toast({ title: "Copied!", description: `Game ID ${gameState.gameId} copied to clipboard` });
              }}
              data-testid="button-copy-game-id-header"
            >
              <span className="text-muted-foreground hidden sm:inline">ID:</span>
              <span className="font-bold tracking-wider group-hover:text-foreground transition-colors">{gameState.gameId}</span>
              <span className="sr-only">Copy Game ID</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{role}</div>
            </div>
            <Button
              onClick={() => {
                if (confirm("Exit the game room?")) {
                  exitGame();
                }
              }}
              variant="outline"
              size="sm"
              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
              data-testid="button-exit-game"
            >
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full overflow-hidden flex flex-col lg:flex-row gap-4 lg:gap-6 px-2 sm:px-4 py-4 lg:py-6">

        {/* Left Column: Game Info & Board (Host/Dev View) */}
        <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0 overflow-hidden">

          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-card p-3 sm:p-4 rounded-lg border border-border">
             <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${gameState.status === 'playing' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
               <span className="font-medium capitalize">{gameState.status}</span>
             </div>
             <div className="w-full sm:w-auto">
               <GameControls />
             </div>
          </div>


          {/* Main Display Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 min-h-0">
            <div className="flex flex-col min-h-0 overflow-auto">
              <CurrentNumber />
            </div>
            <div className="hidden lg:flex flex-col min-h-0 overflow-auto">
              <NumberBoard />
            </div>
          </div>

          {/* Mobile/Tablet Board */}
          <div className="lg:hidden min-h-0 overflow-auto">
            <NumberBoard />
          </div>
        </div>

        {/* Middle Column: Player Cards */}
        {(role === "player" || role === "developer" || role === "host") && (
          <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-4 min-w-0 overflow-hidden">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
               <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                 Your Cards <span className="text-xs sm:text-sm font-normal text-muted-foreground">({myCards.length})</span>
               </h2>
               <Button
                 size="sm"
                 onClick={addCard}
                 className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold gap-1 whitespace-nowrap"
                 data-testid="button-add-card"
               >
                 <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Card</span>
               </Button>
             </div>

             <ScrollArea className="flex-1 pr-3 sm:pr-4 -mx-2 px-2 sm:-mx-4 sm:px-4">
               <div className={cn("space-y-6 pb-20", hasCurrentPlayerWon && "pointer-events-none")}>
                 {myCards.map((card, idx) => (
                   <div key={card.id} className={cn("relative group", hasCurrentPlayerWon && "opacity-60")}>
                     <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                     <div className="relative">
                       <div className="flex justify-between items-center mb-2 px-2">
                         <span className="text-sm font-medium text-muted-foreground">Card #{idx + 1}</span>
                       </div>
                       <BingoCard card={card} />
                       <div className="flex gap-2 mt-2">
                         <Button
                           size="lg"
                           onClick={() => claimBingo(card.id)}
                           disabled={gameState.status !== "playing" || hasCurrentPlayerWon}
                           className={cn(
                             "w-full bg-primary hover:bg-accent text-primary-foreground font-bold shadow-md",
                             hasCurrentPlayerWon && "opacity-50 cursor-not-allowed"
                           )}
                           title={hasCurrentPlayerWon ? "You've already won! Cards are locked." : "Call BINGO when you have the winning pattern"}
                           data-testid="button-claim-bingo"
                         >
                           CLAIM BINGO!
                         </Button>
                         <Button
                           size="icon"
                           onClick={() => removeCard(card.id)}
                           className="bg-red-600/80 hover:bg-red-600 text-white font-bold"
                           data-testid="button-remove-card"
                         >
                           <X className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </ScrollArea>
          </div>
        )}

        {/* Right Column: Players & Chat */}
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-4 lg:gap-6 h-[calc(100vh-140px)] min-w-0">
          <div className="h-1/2 min-h-0 overflow-hidden">
            <PlayerList />
          </div>
          <div className="h-1/2 min-h-0 overflow-hidden">
            <Chat />
          </div>
        </div>

      </main>

      {/* Mobile Players & Chat Drawers */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 sm:right-4 sm:left-auto z-40 flex gap-3">
        {/* Players Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              <Users className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-0 bg-background/95 backdrop-blur-xl border-t border-border">
            <div className="h-full pt-6 flex flex-col">
              <div className="px-4 pb-2 border-b border-border/10">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-secondary" />
                  Players ({gameState.players.length})
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <PlayerList />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Chat Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white">
              <MessageSquare className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-0 bg-background/95 backdrop-blur-xl border-t border-border">
            <div className="h-full pt-6 flex flex-col">
              <div className="px-4 pb-2 border-b border-border/10">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Chat
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <Chat />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {role === "host" && <DevPanel />}
    </div>
  );
}
