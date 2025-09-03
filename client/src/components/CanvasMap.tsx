import React, { useRef, useEffect, useState } from "react";
import { useLocation } from "wouter";
import useNavigateWithTransition from '@/hooks/use-navigate-with-transition';
import { useGameStore } from "@/hooks/use-game-store";
import { MapNode } from "@/types/game";
import {
  renderMap,
  determineSafePositionForChallenge,
  NodeRect,
} from "@/lib/mapRenderer";

// Import atlas semplificato e configurazione tiles
import atlasUrl from "@assets/image_1756807944133.png";
import tilesConfig from "../data/tiles.json";

/**
 * NodeRect type definition
 * CanvasMap Component - Sistema di mappa retro 8-bit basato su Canvas HTML5
 *
 * Questo componente genera e renderizza una mappa di gioco dinamica utilizzando
 * Canvas HTML5 per disegnare tile di terreno in stile pixel art. La mappa è
 * completamente responsive e si adatta a qualsiasi dimensione schermo.
 *
 * Caratteristiche principali:
 * - Tile di terreno generati proceduralmente (prati, bosco, montagne, laghi)
 * - Strade sterrate che collegano dinamicamente i nodi delle sfide
 * - Rendering pixel-perfect con stile retro 8-bit
 * - Completamente responsive e ottimizzato per dispositivi mobili
 * - Overlay interattivo per nodi delle sfide e avatar del giocatore
 */

/** Tipi di terreno supportati dalla mappa */
type TerrainType = "grass" | "forest" | "mountain" | "lake" | "road";

/** Singolo tile di terreno con posizione e tipo */
interface MapTile {
  x: number; // Coordinata X nella griglia
  y: number; // Coordinata Y nella griglia
  type: TerrainType; // Tipo di terreno
}

/** Segmento di strada che collega due punti */
interface PathSegment {
  fromX: number; // Coordinate pixel di partenza X
  fromY: number; // Coordinate pixel di partenza Y
  toX: number; // Coordinate pixel di arrivo X
  toY: number; // Coordinate pixel di arrivo Y
}

const CanvasMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();
  const navigateWithTransition = useNavigateWithTransition();
  const { gameState, showToast } = useGameStore();

  // Stato per l'atlas completo
  const [atlasLoaded, setAtlasLoaded] = useState(false);
  const [atlasImage, setAtlasImage] = useState<HTMLImageElement | null>(null);

  const [nodeRectsState, setNodeRectsState] = useState<
    Record<string, NodeRect> | undefined
  >(undefined);
  /** Dimensione di ogni tile in pixel - ridotta per forme più smussate */
  // Map grid configuration - kept as small configuration on the component
  const MAP_WIDTH = 48;
  const MAP_HEIGHT = 36;

  /**
   * Genera tile di terreno proceduralmente evitando nodi e strade
   *
   * Algoritmo intelligente:
   * 1. Calcola posizioni nodi in coordinate tile
   * 2. Calcola percorsi strade in coordinate tile
   * 3. Crea zone libere (grass) intorno a nodi e strade
   * 4. Distribuisce altri terreni nelle aree rimanenti
   *
   * @returns Array di tile con posizione e tipo di terreno ottimizzato
   */

  // drawMap is now handled by the mapRenderer service to keep this component
  // focused on rendering DOM and wiring user interactions.
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Try to collect DOM bounding boxes for each node so connectors can
    // precisely target the node border.
    renderMap(
      canvas,
      gameState.challenges,
      MAP_WIDTH,
      MAP_HEIGHT,
      48,
      nodeRectsState,
    );
  };

  // Safe overlay positions (percent strings) for challenge nodes to avoid
  // placing nodes on forbidden terrain. Map from node.id -> { leftPercent, topPercent }
  const [safePositions, setSafePositions] = useState<
    Record<string, { left: string; top: string }>
  >({});

  useEffect(() => {
    drawMap();

    // Redraw on window resize for responsiveness
    const handleResize = () => {
      setTimeout(drawMap, 100); // Debounce resize
    };

    window.addEventListener("resize", handleResize);

    // Redraw when a map icon image finishes loading in the renderer
    const onIconLoaded = (ev?: Event) => {
      try {
        console.debug("[CanvasMap] map-icon-loaded", (ev as any)?.detail);
      } catch (e) {}
      drawMap();
    };
    window.addEventListener("map-icon-loaded", onIconLoaded as EventListener);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        "map-icon-loaded",
        onIconLoaded as EventListener,
      );
    };
  }, [gameState.challenges, nodeRectsState]); // Redraw when challenges or rects change

  // Recompute safe positions whenever challenges change or canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight - 48;

    const newPositions: Record<string, { left: string; top: string }> = {};
    const nodeRects: Record<string, NodeRect> = {};
    gameState.challenges.forEach((node) => {
      const safe = determineSafePositionForChallenge(
        node,
        canvasWidth,
        canvasHeight,
        MAP_WIDTH,
        MAP_HEIGHT,
      );
      newPositions[node.id] = { left: safe.leftPercent, top: safe.topPercent };

      // compute pixel rect for canvas-based rendering
      const left =
        (parseFloat(safe.leftPercent.replace("%", "")) / 100) * canvasWidth;
      const top =
        (parseFloat(safe.topPercent.replace("%", "")) / 100) * canvasHeight;
      const w = 64; // default visual size for node boxes on canvas
      const h = 64;
      // Simple color mapping to match previous classes
      const colorMap: Record<string, string> = {
        "networking-forest": "#16a34a",
        "retro-puzzle": "#f59e0b",
        "debug-dungeon": "#7c3aed",
        "social-arena": "#f97316",
      };
      const bg = colorMap[node.id] || "#9ca3af";
      nodeRects[node.id] = {
        cx: left,
        cy: top,
        w,
        h,
        bgColor: bg,
        title: node.title,
        emoji: node.emoji,
      };
    });

    setSafePositions(newPositions);
    setNodeRectsState(nodeRects);

    // Set up click handler mapping canvas clicks to node interactions
    const handleCanvasClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      for (const node of gameState.challenges) {
        const nr = nodeRects[node.id];
        if (!nr) continue;
        const halfW = nr.w / 2;
        const halfH = nr.h / 2;
        if (
          x >= nr.cx - halfW &&
          x <= nr.cx + halfW &&
          y >= nr.cy - halfH &&
          y <= nr.cy + halfH
        ) {
          handleChallengeClick(node);
          return;
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);
    return () => canvas.removeEventListener("click", handleCanvasClick);
  }, [gameState.challenges]);

  const getNodeClassName = (node: MapNode): string => {
    const baseClass = "map-node";
    switch (node.status) {
      case "completed":
        return `${baseClass} completed`;
      case "locked":
        return `${baseClass} locked`;
      default:
        return baseClass;
    }
  };

  const getNodeButtonClass = (node: MapNode): string => {
    switch (node.id) {
      case "networking-forest":
        return "nes-container with-title bg-green-600 text-white";
      case "retro-puzzle":
        return "nes-container with-title bg-yellow-500 text-black";
      case "debug-dungeon":
        return "nes-container with-title bg-purple-600 text-white";
      case "social-arena":
        return "nes-container with-title bg-orange-600 text-white";
      default:
        return "nes-container with-title bg-gray-600 text-white";
    }
  };

  const getCurrentAvatarPosition = () => {
    // Find the next available challenge (the one the player should tackle next)
    const nextAvailableChallenge = gameState.challenges.find(
      (c) => c.status === "available"
    );
    
    if (nextAvailableChallenge) {
      // Position avatar on the next available challenge
      const position = safePositions[nextAvailableChallenge.id] || nextAvailableChallenge.position;
      const top = parseFloat(position.top.replace("%", ""));
      const left = parseFloat(position.left.replace("%", ""));
      return { top: `${top}%`, left: `${left}%` };
    }

    // If no available challenges (shouldn't happen), position on first challenge
    const firstChallenge = gameState.challenges[0];
    if (firstChallenge) {
      const position = safePositions[firstChallenge.id] || firstChallenge.position;
      const top = parseFloat(position.top.replace("%", ""));
      const left = parseFloat(position.left.replace("%", ""));
      return { top: `${top}%`, left: `${left}%` };
    }

    return { top: "32%", left: "17%" }; // Fallback position
  };

  const handleChallengeClick = (node: MapNode) => {
    const challengeIndex = gameState.challenges.findIndex(
      (c) => c.id === node.id,
    );

    // Enforce sequential progression
    if (node.status === "locked") {
      showToast("Questa challenge non è ancora disponibile", "warning");
      return;
    }

    // Check if previous challenges are completed (sequential requirement)
    const previousChallengesCompleted = gameState.challenges
      .slice(0, challengeIndex)
      .every((c) => gameState.gameProgress.completedChallenges.includes(c.id));

    if (challengeIndex === 0 || previousChallengesCompleted) {
      // user-initiated navigation with transition
  navigateWithTransition(`/game/challenge/${node.id}`);
    } else {
      const remainingChallenges =
        challengeIndex - gameState.gameProgress.completedChallenges.length;
      showToast(
        `Devi completare ${remainingChallenges} sfida/e prima di questa`,
        "warning",
      );
    }
  };

  const avatarPosition = getCurrentAvatarPosition();

  return (
    <div className="canvas-map relative" data-testid="canvas-map">
      {/* Canvas for terrain and roads */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pixelated"
        style={{
          imageRendering: "pixelated",
          width: "100vw",
          height: "calc(100vh - 48px)",
        }}
        data-testid="terrain-canvas"
      />

      {/* Challenge Nodes are rendered on the canvas (see renderMap). */}

      {/* Player Avatar */}
      <div
        className="player-avatar"
        style={{ top: avatarPosition.top, left: avatarPosition.left }}
        data-testid="player-avatar"
      >
        <div className="w-full h-full bg-white border-2 border-black rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={gameState.currentUser.avatar}
            alt="Player avatar"
            className="w-full h-full object-cover pixelated"
          />
        </div>
      </div>

      {/* Map legend removed per request */}

      {/* Progress badge removed - Statistics accessible via Header avatar */}
    </div>
  );
};

export default CanvasMap;
