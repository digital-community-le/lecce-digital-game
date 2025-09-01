import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import IntroPage from "@/pages/Intro";
import GameMapPage from "@/pages/GameMap";
import ScannerView from '@/components/ScannerView';
import ScanPreviewModal from '@/components/ScanPreviewModal';
import NetworkingForestPage from "@/pages/challenges/NetworkingForest";
import RetroPuzzlePage from "@/pages/challenges/RetroPuzzle";
import DebugDungeonPage from "@/pages/challenges/DebugDungeon";
import SocialArenaPage from "@/pages/challenges/SocialArena";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={IntroPage} />
      <Route path="/game" component={GameMapPage} />
      <Route path="/challenge/networking-forest" component={NetworkingForestPage} />
      <Route path="/challenge/retro-puzzle" component={RetroPuzzlePage} />
      <Route path="/challenge/debug-dungeon" component={DebugDungeonPage} />
      <Route path="/challenge/social-arena" component={SocialArenaPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { GameStoreProvider } from '@/hooks/use-game-store';

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
