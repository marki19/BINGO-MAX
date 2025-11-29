import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game-state";

export const NumberBoard = () => {
  const { gameState, callNumber, stageNumber, role } = useGame();

  const getLetterColor = (num: number) => {
    if (num <= 15) return "text-[hsl(var(--bingo-b))]";
    if (num <= 30) return "text-[hsl(var(--bingo-i))]";
    if (num <= 45) return "text-[hsl(var(--bingo-n))]";
    if (num <= 60) return "text-[hsl(var(--bingo-g))]";
    return "text-[hsl(var(--bingo-o))]";
  };

  const handleDevClick = (num: number) => {
    // Only developers can stage numbers (not hosts with isDeveloper flag)
    if (role === "developer" && gameState.status === "playing") {
      stageNumber(num);
    }
  };

  return (
    <div className="w-full bg-card/50 backdrop-blur-md border border-border rounded-xl p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        {["B", "I", "N", "G", "O"].map((letter, i) => {
          const start = i * 15 + 1;
          const end = start + 14;
          const numbers = Array.from({ length: 15 }, (_, idx) => start + idx);

          return (
            <div key={letter} className="flex items-center gap-2 sm:gap-4">
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-display font-bold text-xl rounded shadow-lg",
                i === 0 ? "bg-[hsl(var(--bingo-b))]" :
                i === 1 ? "bg-[hsl(var(--bingo-i))]" :
                i === 2 ? "bg-[hsl(var(--bingo-n))]" :
                i === 3 ? "bg-[hsl(var(--bingo-g))]" :
                "bg-[hsl(var(--bingo-o))]"
              )}>
                <span className="text-white drop-shadow-md">{letter}</span>
              </div>
              <div className="flex-1 flex flex-wrap gap-1 sm:gap-2 content-start">
                {numbers.map(num => {
                  const isCalled = gameState.calledNumbers.includes(num);
                  const isLastCalled = gameState.calledNumbers[gameState.calledNumbers.length - 1] === num;

                  const isStaged = role === "developer" && gameState.stagedNumber === num;
                  return (
                    <motion.button
                      key={num}
                      onClick={() => handleDevClick(num)}
                      disabled={role !== "developer" || gameState.status !== "playing"}
                      className={cn(
                        "flex-basis-[calc((100%-7*0.5rem)/15)] aspect-square flex items-center justify-center text-[10px] sm:text-xs font-bold rounded transition-all",
                        isCalled
                          ? "bg-foreground text-background shadow-md"
                          : isStaged
                             ? "bg-accent text-accent-foreground shadow-md"
                             : role === "developer"
                                ? "bg-muted hover:bg-muted/80 text-muted-foreground cursor-pointer"
                                : "bg-muted/50 text-muted-foreground/50",
                        isLastCalled && "ring-2 ring-primary scale-125 z-10"
                      )}
                      initial={false}
                      animate={
                        isCalled
                          ? { scale: [1, 1.5, 1] }
                          : isStaged
                          ? { scale: 1.05 }
                          : {}
                      }
                      transition={
                        isCalled
                          ? { duration: 0.6, ease: "easeInOut" }
                          : { duration: 0.3 }
                      }
                    >
                      {num}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .flex-basis-[calc((100%-7*0.5rem)/15)] {
          flex-basis: calc((100% - 7 * 0.5rem) / 15);
          min-width: 0;
        }
      `}</style>
    </div>
  );
};
