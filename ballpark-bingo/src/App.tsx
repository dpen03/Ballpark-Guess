import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";

import Home from "@/pages/home";
import GameScreen from "@/pages/game";
import PicksScreen from "@/pages/picks";
import InningsScreen from "@/pages/innings";
import StatsScreen from "@/pages/stats";
import AuthScreen from "@/pages/auth";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/stats" component={StatsScreen} />
      <Route path="/game/:code" component={GameScreen} />
      <Route path="/game/:code/picks" component={PicksScreen} />
      <Route path="/game/:code/innings" component={InningsScreen} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <AuthScreen />;
  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
