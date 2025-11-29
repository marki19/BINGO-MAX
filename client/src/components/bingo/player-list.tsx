import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Crown } from "lucide-react";
import { useGame } from "@/lib/game-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const PlayerList = () => {
  const { gameState } = useGame();

  return (
    <Card className="h-full border-border/50 bg-card/40 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border/10">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>Players</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {gameState.players.length} / {gameState.playerLimit}
          </Badge>
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[250px] sm:h-[350px] lg:h-[calc(100vh-400px)] w-full p-4">
        <div className="space-y-2">
          <AnimatePresence>
            {gameState.players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{player.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.cardCount} cards
                    </p>
                  </div>
                </div>
                {gameState.winner?.name === player.name && (
                  <Crown className="w-5 h-5 text-primary animate-bounce" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
};
