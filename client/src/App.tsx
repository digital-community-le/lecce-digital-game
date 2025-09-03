import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import IntroPage from "@/pages/Intro";
import GameMapPage from "@/pages/GameMap";
import GameCompletePage from "@/pages/GameComplete";
import StatisticsPage from "@/pages/Statistics";
import GameLayout from "@/components/layout/GameLayout";
import ScannerView from "@/components/ScannerView";
import ScanPreviewModal from "@/components/ScanPreviewModal";
import NetworkingForestPage from "@/pages/challenges/NetworkingForest";
import RetroPuzzlePage from "@/pages/challenges/RetroPuzzle";
import DebugDungeonPage from "@/pages/challenges/DebugDungeon";
import SocialArenaPage from "@/pages/challenges/SocialArena";
import NotFound from "@/pages/not-found";
import { GameStoreProvider } from "@/hooks/use-game-store";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/" component={IntroPage} />
      {/* Game routes: explicitly render GameLayout for each subroute to avoid fragile wildcard matching */}
      <Route path="/game/map">
        {() => (
          <GameLayout>
            <ProtectedRoute>
              <GameMapPage />
            </ProtectedRoute>
          </GameLayout>
        )}
      </Route>

      <Route path="/game/challenge/networking-forest">
        {() => (
          <GameLayout>
            <ProtectedRoute>
              <NetworkingForestPage />
            </ProtectedRoute>
          </GameLayout>
        )}
      </Route>

      <Route path="/game/challenge/retro-puzzle">
        {() => (
          <GameLayout>
            <ProtectedRoute>
              <RetroPuzzlePage />
            </ProtectedRoute>
          </GameLayout>
        )}
      </Route>

      <Route path="/game/challenge/debug-dungeon">
        {() => (
          <GameLayout>
            <ProtectedRoute>
              <DebugDungeonPage />
            </ProtectedRoute>
          </GameLayout>
        )}
      </Route>

      <Route path="/game/challenge/social-arena">
        {() => (
          <GameLayout>
            <ProtectedRoute>
              <SocialArenaPage />
            </ProtectedRoute>
          </GameLayout>
        )}
      </Route>

      {/* Final completion pages */}
      <Route path="/game-complete" component={GameCompletePage} />
      <Route path="/statistics" component={StatisticsPage} />
      
      {/* Default /game -> show map */}
      <Route path="/game">
        {() => (
          <GameLayout>
            <ProtectedRoute>
              <GameMapPage />
            </ProtectedRoute>
          </GameLayout>
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
          <Toaster />
          <Router />
          {/* Global scanner + preview mounted at app root so any page can open them */}
          <ScannerView />
          <ScanPreviewModal />
        </GameStoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
