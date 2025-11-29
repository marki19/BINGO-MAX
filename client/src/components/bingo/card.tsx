import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGame, BingoCard as BingoCardType } from "@/lib/game-state";

interface BingoCardProps {
  card: BingoCardType;
  className?: string;
}

export const BingoCard = ({ card, className }: BingoCardProps) => {
  const { markNumber, gameState, role, currentUser } = useGame();

  // CHECK IF CURRENT PLAYER HAS WON - card should show gold indicator
  const hasCurrentPlayerWon = gameState.winners.some(w => w.name === currentUser.name);

  // Helper to get letter for column
  const getLetter = (colIndex: number) => "BINGO"[colIndex];

  // Grid layout: 5 columns, 5 rows.
  // Data is stored column-major in generation (0-4 is B).
  // BUT common bingo grids render row by row.
  // Let's adjust rendering to loop rows.

  const renderCell = (col: number, row: number) => {
    // Index in the flat array (0-24)
    // My generator: 0-4 = B col, 5-9 = I col...
    // So index = col * 5 + row
    const index = col * 5 + row;

    // Free space is center (Col 2, Row 2 -> index 12)
    const isFreeSpace = col === 2 && row === 2;
    const number = card.numbers[index];
    const isMarked = card.marked.includes(index) || isFreeSpace;
    const isCalled = gameState.calledNumbers.includes(number);
    const canMark = true; // Allow clicking any number as requested

    return (
      <motion.button
        key={`${col}-${row}`}
        whileHover={hasCurrentPlayerWon ? {} : { scale: 1.05 }}
        whileTap={hasCurrentPlayerWon ? {} : { scale: 0.95 }}
        onClick={() => !isFreeSpace && !hasCurrentPlayerWon && markNumber(card.id, index)}
        disabled={!canMark || hasCurrentPlayerWon}
        className={cn(
          "aspect-square flex items-center justify-center text-sm sm:text-lg md:text-xl font-display font-bold rounded-md sm:rounded-lg transition-colors duration-300 border sm:border-2",
          hasCurrentPlayerWon ? "opacity-50 cursor-not-allowed" : "",
          isFreeSpace
            ? "bg-accent text-accent-foreground border-accent animate-pulse"
            : isMarked
              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
              : isCalled
                 ? "bg-card/80 text-foreground border-primary/50 hover:border-primary hover:bg-primary/10 cursor-pointer"
                 : "bg-card/50 text-foreground/80 border-white/10 hover:border-white/30 hover:bg-white/5 cursor-pointer"
        )}
      >
        {isFreeSpace ? "★" : number}
      </motion.button>
    );
  };

  return (
    <div className={cn(
      "bg-card border p-2 sm:p-4 rounded-xl shadow-2xl max-w-md w-full transition-all",
      hasCurrentPlayerWon
        ? "border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-green-500/10 shadow-lg shadow-yellow-500/20"
        : "border-border"
    )}>
      {hasCurrentPlayerWon && (
        <div className="text-center mb-2 text-xs sm:text-sm font-bold text-yellow-600 dark:text-yellow-400">
          ✨ YOU WON! ✨
        </div>
      )}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-1 sm:mb-2">
        {["B", "I", "N", "G", "O"].map((letter, i) => (
          <div key={letter} className={cn(
            "text-center font-display text-lg sm:text-2xl font-black py-1 sm:py-2 rounded text-white shadow-lg",
            hasCurrentPlayerWon ? "opacity-75" : "",
            i === 0 ? "bg-[hsl(var(--bingo-b))]" :
            i === 1 ? "bg-[hsl(var(--bingo-i))]" :
            i === 2 ? "bg-[hsl(var(--bingo-n))]" :
            i === 3 ? "bg-[hsl(var(--bingo-g))]" :
            "bg-[hsl(var(--bingo-o))]"
          )}>
            {letter}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {[0, 1, 2, 3, 4].map(row => (
          <React.Fragment key={row}>
            {[0, 1, 2, 3, 4].map(col => renderCell(col, row))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
