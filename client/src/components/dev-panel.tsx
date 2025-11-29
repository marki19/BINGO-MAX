import { motion } from "framer-motion";
import { useGame } from "@/lib/game-state";
import { ShieldAlert, Terminal, Zap } from "lucide-react";

export const DevPanel = () => {
  const { role, gameState } = useGame();

  if (role === "developer") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-gradient-to-br from-purple-950/95 via-violet-900/95 to-fuchsia-950/95 text-white p-4 rounded-xl shadow-2xl border border-purple-500/50 z-50 backdrop-blur-lg"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent rounded-xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/30 border border-purple-400/30">
              <Terminal className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="font-mono font-bold text-sm text-purple-200 tracking-wider">
                DEV_MODE
              </div>
              <div className="text-[10px] text-purple-400 font-mono">
                ELEVATED_ACCESS
              </div>
            </div>
            <Zap className="w-4 h-4 text-cyan-400 ml-auto animate-pulse" />
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 p-2 rounded bg-purple-900/50 border border-purple-700/30">
              <ShieldAlert className="w-3 h-3 text-cyan-400" />
              <span className="text-purple-200">Click board numbers to stage</span>
            </div>

            {gameState.stagedNumber && (
              <div className="flex items-center gap-2 p-2 rounded bg-cyan-900/30 border border-cyan-500/30">
                <span className="text-cyan-300">STAGED:</span>
                <span className="text-cyan-100 font-bold">{gameState.stagedNumber}</span>
              </div>
            )}

            <div className="text-[10px] text-purple-500 pt-1">
              // Type "dev123" in chat to toggle
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
