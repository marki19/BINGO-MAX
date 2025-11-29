import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { createGame, joinGame } = useGame();

  // Join Game State
  const [playerName, setPlayerName] = useState("");
  const [gameId, setGameId] = useState("");

  // Host Game State
  const [hostName, setHostName] = useState("");
  const [playerLimit, setPlayerLimit] = useState("100");

  const handleJoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !gameId) return;
    const success = await joinGame(gameId, playerName, 1);
    if (success) {
      setLocation(`/game/${gameId}`);
    }
  }, [playerName, gameId, joinGame, setLocation]);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName) return;
    try {
      console.log("🎮 [HOME] Creating game with hostName:", hostName, "playerLimit:", playerLimit);
      const gameId = await createGame(hostName, parseInt(playerLimit), 1, "line");
      console.log("📍 [HOME] Returned gameId from createGame():", gameId, "Type:", typeof gameId);
      if (gameId && gameId.trim()) {
        console.log("✅ [HOME] gameId is valid:", gameId);
        const redirectUrl = `/game/${gameId}`;
        console.log("🚀 [HOME] About to redirect to:", redirectUrl);
        setLocation(redirectUrl);
        console.log("🚀 [HOME] setLocation called with:", redirectUrl);
      } else {
        console.error("❌ [HOME] Game creation FAILED - gameId is:", gameId, "Type:", typeof gameId);
      }
    } catch (error) {
      console.error("❌ [HOME] Error creating game:", error);
    }
  }, [hostName, playerLimit, createGame, setLocation]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border shadow-lg relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-4xl font-display font-bold text-foreground tracking-tight">
              BINGO MAX
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Multiplayer Bingo with Customizable Patterns
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="join">Join Game</TabsTrigger>
              <TabsTrigger value="create">Host Game</TabsTrigger>
            </TabsList>

            {/* JOIN GAME TAB */}
            <TabsContent value="join" className="mt-6">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="player-name" className="text-sm font-medium">Player Name</label>
                  <Input
                    id="player-name"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    className="bg-background/50"
                    required
                    data-testid="input-player-name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="game-id" className="text-sm font-medium">Game ID</label>
                  <Input
                    id="game-id"
                    placeholder="e.g. DEMO123"
                    value={gameId}
                    onChange={e => setGameId(e.target.value.toUpperCase())}
                    className="bg-background/50 font-mono"
                    required
                    data-testid="input-game-id"
                  />
                </div>
                <Button type="submit" className="w-full font-bold text-lg h-12 bg-primary hover:bg-accent text-primary-foreground" data-testid="button-join-room">
                  Join Room
                </Button>
              </form>
            </TabsContent>

            {/* HOST GAME TAB */}
            <TabsContent value="create" className="mt-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="host-name" className="text-sm font-medium">Host Name</label>
                  <Input
                    id="host-name"
                    placeholder="Enter your name"
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    className="bg-background/50"
                    required
                    data-testid="input-host-name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="player-limit" className="text-sm font-medium">Player Limit</label>
                  <select
                    id="player-limit"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={playerLimit}
                    onChange={e => setPlayerLimit(e.target.value)}
                    data-testid="select-player-limit"
                  >
                    <option value="2">2 Players</option>
                    <option value="5">5 Players</option>
                    <option value="10">10 Players</option>
                    <option value="50">50 Players</option>
                    <option value="100">100 Players</option>
                    <option value="500">500 Players</option>
                  </select>
                </div>
                <Button type="submit" className="w-full font-bold text-lg h-12 bg-secondary hover:bg-secondary/90 text-secondary-foreground" data-testid="button-create-room">
                  Create Room
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
