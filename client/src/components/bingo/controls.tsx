import React from "react";
import { useGame } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const GameControls = ({ className }: { className?: string }) => {
  const { gameState, startGame, pauseGame, resetGame, callNumber, role, setWinPattern } = useGame();
  const isHost = role === "host";

  if (!isHost) return null; // Only show controls if user is the host

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {gameState.status === "waiting" && (
        <select
          value={gameState.winPattern}
          onChange={(e) => setWinPattern(e.target.value as "line" | "diagonal" | "cross" | "box" | "corners" | "rows" | "columns" | "full")}
          className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-testid="select-win-pattern-room"
        >
          <option value="line">Win Pattern: Line (Any Row, Column, or Diagonal)</option>
          <option value="diagonal">Win Pattern: Diagonal (One Diagonal - C Pattern)</option>
          <option value="cross">Win Pattern: Cross (Both Diagonals - X Pattern)</option>
          <option value="box">Win Pattern: Box (Outer Border)</option>
          <option value="corners">Win Pattern: Corners (4 Corners Only)</option>
          <option value="rows">Win Pattern: Rows (All 5 Rows Filled)</option>
          <option value="columns">Win Pattern: Columns (All 5 Columns Filled)</option>
          <option value="full">Win Pattern: Full Card (All 25 Numbers)</option>
        </select>
      )}

      <div className="grid grid-cols-3 gap-2">
        {gameState.status === "waiting" || gameState.status === "paused" ? (
          <Button onClick={startGame} className="bg-primary hover:bg-accent text-primary-foreground font-bold w-full">
            <Play className="w-4 h-4 mr-1" /> Start
          </Button>
        ) : (
          <Button onClick={pauseGame} variant="outline" className="font-bold w-full">
            <Pause className="w-4 h-4 mr-1" /> Pause
          </Button>
        )}

        <Button
          onClick={() => callNumber()}
          disabled={gameState.status !== "playing"}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold w-full shadow-md"
        >
          <Wand2 className="w-4 h-4 mr-1" /> Call
        </Button>

        <Button onClick={() => resetGame()} variant="destructive" className="font-bold w-full">
          <RotateCcw className="w-4 h-4 mr-1" /> Reset
        </Button>
      </div>
    </div>
  );
};
