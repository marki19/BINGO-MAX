import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";

export const CurrentNumber = () => {
  const { gameState } = useGame();
  const current = gameState.calledNumbers[gameState.calledNumbers.length - 1];

  if (!current) return (
    <div className="h-32 sm:h-48 flex items-center justify-center text-muted-foreground font-display text-xl">
      Waiting for first number...
    </div>
  );

  const getLetter = (num: number) => {
    if (num <= 15) return "B";
    if (num <= 30) return "I";
    if (num <= 45) return "N";
    if (num <= 60) return "G";
    return "O";
  };

  const letter = getLetter(current);

  return (
    <div className="flex flex-col items-center justify-center h-32 sm:h-48 perspective-1000">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ scale: 0, rotateX: -90, opacity: 0 }}
          animate={{ scale: 1, rotateX: 0, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className={cn(
            "relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-4 sm:border-8 shadow-[0_0_50px_currentColor]",
            current <= 15 ? "bg-[hsl(var(--bingo-b))] border-white text-white" :
            current <= 30 ? "bg-[hsl(var(--bingo-i))] border-white text-white" :
            current <= 45 ? "bg-[hsl(var(--bingo-n))] border-white text-white" :
            current <= 60 ? "bg-[hsl(var(--bingo-g))] border-white text-white" :
            "bg-[hsl(var(--bingo-o))] border-white text-white"
          )}
        >
          <div className="absolute -top-4 sm:-top-6 text-4xl sm:text-5xl font-black font-display drop-shadow-lg">
            {letter}
          </div>
          <div className="text-5xl sm:text-6xl font-bold tracking-tighter">
            {current}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 text-muted-foreground text-sm uppercase tracking-widest font-bold">
        Current Number
      </div>
    </div>
  );
};
