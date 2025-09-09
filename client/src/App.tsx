import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import IntroPage from "@/pages/Intro";
import GameMapPage from "@/pages/GameMap";
import GameCompletePage from "@/pages/GameComplete";
import BadgePage from "@/pages/BadgePage";
import StatisticsPage from "@/pages/Statistics";
import GameLayout from "@/components/layout/GameLayout";
import GuildBuilderPage from "@/pages/challenges/GuildBuilder";
import RetroPuzzlePage from "@/pages/challenges/RetroPuzzle";
import DebugDungeonPage from "@/pages/challenges/DebugDungeon";
import SocialArenaPage from "@/pages/challenges/SocialArena";
import NotFound from "@/pages/not-found";
import { GameStoreProvider } from "@/hooks/use-game-store";
import GameCompletionProtectedRoute from "@/components/ProtectedRoute";
import AuthProtectedRoute from "@/components/AuthProtectedRoute";
import AuthWrapper from "@/components/AuthWrapper";

function Router() {
  return (
    <Switch>
      <Route path="/" component={IntroPage} />
      {/* Game routes: explicitly render GameLayout for each subroute to avoid fragile wildcard matching */}
      <Route path="/game/map">
        {() => (
          <AuthProtectedRoute>
            <GameLayout>
              <GameCompletionProtectedRoute>
                <GameMapPage />
              </GameCompletionProtectedRoute>
            </GameLayout>
          </AuthProtectedRoute>
        )}
      </Route>

      <Route path="/game/challenge/guild-builder">
        {() => (
          <AuthProtectedRoute>
            <GameLayout>
              <GameCompletionProtectedRoute>
                <GuildBuilderPage />
              </GameCompletionProtectedRoute>
            </GameLayout>
          </AuthProtectedRoute>
        )}
      </Route>

      <Route path="/game/challenge/retro-puzzle">
        {() => (
          <AuthProtectedRoute>
            <GameLayout>
              <GameCompletionProtectedRoute>
                <RetroPuzzlePage />
              </GameCompletionProtectedRoute>
            </GameLayout>
          </AuthProtectedRoute>
        )}
      </Route>

      <Route path="/game/challenge/debug-dungeon">
        {() => (
          <AuthProtectedRoute>
            <GameLayout>
              <GameCompletionProtectedRoute>
                <DebugDungeonPage />
              </GameCompletionProtectedRoute>
            </GameLayout>
          </AuthProtectedRoute>
        )}
      </Route>

      <Route path="/game/challenge/social-arena">
        {() => (
          <AuthProtectedRoute>
            <GameLayout>
              <GameCompletionProtectedRoute>
                <SocialArenaPage />
              </GameCompletionProtectedRoute>
            </GameLayout>
          </AuthProtectedRoute>
        )}
      </Route>

      {/* Completion pages - require authentication but accessible after game completion */}
      <Route path="/game-complete">
        {() => (
          <AuthProtectedRoute>
            <GameCompletePage />
          </AuthProtectedRoute>
        )}
      </Route>

      <Route path="/badge">
        {() => (
          <AuthProtectedRoute>
            <BadgePage />
          </AuthProtectedRoute>
        )}
      </Route>
      
      <Route path="/statistics">
        {() => (
          <AuthProtectedRoute>
            <StatisticsPage />
          </AuthProtectedRoute>
        )}
      </Route>
      
      {/* Default /game -> show map */}
      <Route path="/game">
        {() => (
          <AuthProtectedRoute>
            <GameLayout>
              <GameCompletionProtectedRoute>
                <GameMapPage />
              </GameCompletionProtectedRoute>
            </GameLayout>
          </AuthProtectedRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameStoreProvider>
          <AuthWrapper>
            <Toaster />
            <Router />
          </AuthWrapper>
        </GameStoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
