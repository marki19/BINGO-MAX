import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider } from "@/lib/game-state";
import Home from "@/pages/home";
import GameRoom from "@/pages/game-room";
import NotFound from "@/pages/not-found";
import React from "react";

// Error Boundary for GameProvider context errors during hot reload
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Error Boundary caught:", error);
    // Auto-recover after 1 second
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔄</div>
            <h2 className="text-2xl font-bold">Reconnecting...</h2>
            <p className="text-muted-foreground">Restoring your game session...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game/:gameId" component={GameRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <GameProvider>
          <Router />
          <Toaster />
        </GameProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
