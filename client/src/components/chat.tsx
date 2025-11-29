import React, { useState, useRef, useEffect } from "react";
import { useGame } from "@/lib/game-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Chat = () => {
  const { gameState, sendMessage, currentUser } = useGame();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<string>("");

  // Auto-scroll to bottom and mark messages as seen
  useEffect(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }

    // Update last message ID when new messages arrive
    if (gameState.messages.length > 0) {
      const lastMsg = gameState.messages[gameState.messages.length - 1];
      setLastMessageId(lastMsg.id);
    }
  }, [gameState.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  return (
    <Card className="h-full border-border/50 bg-card/40 backdrop-blur-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-border/10 py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span>Chat</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0 relative">
        <ScrollArea ref={scrollRef} className="h-full w-full p-4 absolute inset-0">
          <div className="space-y-3">
            {gameState.messages.map((msg, idx) => {
              const isNewMessage = msg.id === lastMessageId;
              return (
                <div key={msg.id} className={cn("flex items-start gap-2 group", msg.isSystem && "bg-purple-500/20 p-2 rounded border-l-2 border-purple-500")}>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "font-bold text-xs",
                        msg.isSystem ? "text-purple-400" : msg.sender === currentUser.name ? "text-primary" : "text-muted-foreground"
                      )}>
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed break-words", msg.isSystem && "text-purple-300")}>
                      {msg.text}
                    </p>
                  </div>
                  {isNewMessage && msg.sender !== currentUser.name && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0 animate-pulse" title="New message" />
                  )}
                </div>
              );
            })}
            {gameState.messages.length === 0 && (
              <div className="text-center text-muted-foreground/40 text-sm italic mt-4">
                No messages yet. Say hello!
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t border-border/10">
        <form onSubmit={handleSend} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="h-9 bg-white/5 border-white/10 focus-visible:ring-primary/50"
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0 bg-primary/20 hover:bg-primary/40 text-primary">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
