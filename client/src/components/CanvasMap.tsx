import React, { useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import { MapNode } from '@/types/game';

/**
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
type TerrainType = 'grass' | 'forest' | 'mountain' | 'lake' | 'road';

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
  toX: number;   // Coordinate pixel di arrivo X
  toY: number;   // Coordinate pixel di arrivo Y
}

const CanvasMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();
  const { gameState, showToast } = useGameStore();

  /** Dimensione di ogni tile in pixel - ridotta per forme più smussate */
  const TILE_SIZE = 16;
  /** Larghezza griglia mappa (numero di tile orizzontali) */
  const MAP_WIDTH = 48;
  /** Altezza griglia mappa (numero di tile verticali) */
  const MAP_HEIGHT = 36;

  /**
   * Genera tile di terreno proceduralmente basati su algoritmo deterministico
   * 
   * Algoritmo di distribuzione:
   * - Forest: Quadranti top-left e bottom-left + patch sparse
   * - Mountains: Fascia superiore centro-destra
   * - Lakes: Angolo bottom-right
   * - Grass: Tutto il resto (default)
   * 
   * @returns Array di tile con posizione e tipo di terreno
   */
  const generateTerrainTiles = (): MapTile[] => {
    const tiles: MapTile[] = [];
    
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        let tileType: TerrainType = 'grass'; // Default
        
        // Forest areas (top-left quadrant and bottom-left)
        if ((x < 16 && y < 12) || (x < 12 && y > 24)) {
          tileType = 'forest';
        }
        // Mountain range (top-center and top-right)
        else if (y < 8 && x > 20 && x < 40) {
          tileType = 'mountain';
        }
        // Lake (bottom-right corner)
        else if (x > 36 && y > 26) {
          tileType = 'lake';
        }
        // Add some scattered forest patches deterministically
        else if ((x + y) % 14 === 0 && x > 10 && x < 36 && y > 16) {
          tileType = 'forest';
        }
        
        tiles.push({ x, y, type: tileType });
      }
    }
    
    return tiles;
  };

  /**
   * Genera percorsi che collegano i nodi delle sfide usando coordinate pixel reali
   * 
   * Converte le posizioni percentuali dei nodi in coordinate pixel del canvas
   * per garantire allineamento perfetto su qualsiasi dimensione schermo.
   * 
   * @param canvasWidth Larghezza del canvas in pixel
   * @param canvasHeight Altezza del canvas in pixel
   * @returns Array di segmenti di strada con coordinate pixel
   */
  const generatePaths = (canvasWidth: number, canvasHeight: number): PathSegment[] => {
    const paths: PathSegment[] = [];
    const challenges = gameState.challenges;
    
    for (let i = 0; i < challenges.length - 1; i++) {
      const current = challenges[i];
      const next = challenges[i + 1];
      
      // Convert percentage positions to actual canvas pixel coordinates
      const fromX = (parseFloat(current.position.left.replace('%', '')) / 100) * canvasWidth;
      const fromY = (parseFloat(current.position.top.replace('%', '')) / 100) * canvasHeight;
      const toX = (parseFloat(next.position.left.replace('%', '')) / 100) * canvasWidth;
      const toY = (parseFloat(next.position.top.replace('%', '')) / 100) * canvasHeight;
      
      paths.push({ fromX, fromY, toX, toY });
    }
    
    return paths;
  };

  /**
   * Disegna un singolo tile di terreno sul canvas con stile pixel art
   * 
   * Ogni tipo di terreno ha un pattern unico:
   * - Grass: Verde con puntini casuali
   * - Forest: Verde scuro con alberi stilizzati
   * - Mountain: Grigio con texture rocciosa
   * - Lake: Blu con increspature animate
   * 
   * @param ctx Contesto 2D del canvas
   * @param tile Tile da disegnare
   * @param x Posizione X in pixel
   * @param y Posizione Y in pixel
   * @param size Dimensione del tile in pixel
   */
  const drawTileResponsive = (ctx: CanvasRenderingContext2D, tile: MapTile, x: number, y: number, size: number) => {

    switch (tile.type) {
      case 'grass':
        // Green grass with random dots
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#16a34a';
        const dotCount = Math.max(4, Math.floor(size / 4));
        for (let i = 0; i < dotCount; i++) {
          const dotX = x + ((tile.x * 7 + tile.y * 3 + i) % size);
          const dotY = y + ((tile.y * 5 + tile.x * 2 + i) % size);
          const dotSize = Math.max(1, Math.floor(size / 16));
          ctx.fillRect(dotX, dotY, dotSize, dotSize);
        }
        break;

      case 'forest':
        // Dark green with tree-like patterns
        ctx.fillStyle = '#166534';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#052e16';
        // Draw tree trunks (responsive)
        const treeCount = Math.max(2, Math.floor(size / 8));
        for (let i = 0; i < treeCount; i++) {
          const treeX = x + ((tile.x * 11 + i * 7) % (size - size/4));
          const treeY = y + ((tile.y * 13 + i * 5) % (size - size/3));
          const trunkWidth = Math.max(2, Math.floor(size / 8));
          const trunkHeight = Math.max(4, Math.floor(size / 4));
          ctx.fillRect(treeX, treeY + trunkHeight, trunkWidth, trunkHeight);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(treeX - trunkWidth/2, treeY, trunkWidth * 2, trunkHeight);
          ctx.fillStyle = '#052e16';
        }
        break;

      case 'mountain':
        // Gray rocky texture
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#374151';
        // Rocky pattern (responsive)
        const rockCount = Math.max(8, Math.floor(size * size / 32));
        for (let i = 0; i < rockCount; i++) {
          const rockX = x + ((tile.x * 17 + tile.y * 11 + i) % size);
          const rockY = y + ((tile.y * 19 + tile.x * 7 + i) % size);
          if ((rockX + rockY) % 8 < 4) {
            const rockSize = Math.max(1, Math.floor(size / 16));
            ctx.fillRect(rockX, rockY, rockSize, rockSize);
          }
        }
        break;

      case 'lake':
        // Blue water with shimmer effect
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#1d4ed8';
        // Water ripples (responsive)
        const rippleCount = Math.max(3, Math.floor(size / 6));
        for (let i = 0; i < rippleCount; i++) {
          const rippleX = x + ((tile.x * 23 + i * 9) % (size - 4));
          const rippleY = y + ((tile.y * 29 + i * 7) % (size - 4));
          const rippleSize = Math.max(1, Math.floor(size / 16));
          ctx.fillRect(rippleX, rippleY, rippleSize * 3, rippleSize);
          ctx.fillRect(rippleX + rippleSize, rippleY + rippleSize * 2, rippleSize, rippleSize * 3);
        }
        break;

      case 'road':
        // Brown dirt road
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#654321';
        // Road texture (responsive)
        const roadDotCount = Math.max(6, Math.floor(size / 3));
        for (let i = 0; i < roadDotCount; i++) {
          const dotX = x + ((tile.x * 31 + i * 13) % size);
          const dotY = y + ((tile.y * 37 + i * 11) % size);
          const dotSize = Math.max(1, Math.floor(size / 32));
          ctx.fillRect(dotX, dotY, dotSize, dotSize);
        }
        break;
    }
  };

  /**
   * Disegna una strada sterrata che collega due punti usando coordinate pixel
   * 
   * La strada viene disegnata con due layer:
   * 1. Bordo scuro più largo per profondità
   * 2. Centro marrone per il sentiero
   * 
   * @param ctx Contesto 2D del canvas
   * @param path Segmento di strada da disegnare
   */
  const drawRoadResponsive = (ctx: CanvasRenderingContext2D, path: PathSegment) => {
    // Path coordinates are already in pixel positions
    const startX = path.fromX + 40; // Offset to center of node (80px node / 2)
    const startY = path.fromY + 40;
    const endX = path.toX + 40;
    const endY = path.toY + 40;

    // Responsive road width based on screen size
    const roadWidth = Math.max(8, Math.floor(Math.min(window.innerWidth, window.innerHeight) / 80));
    const borderWidth = roadWidth + 4;

    // Draw road border (darker)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw road path (lighter)
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = roadWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  /**
   * Funzione principale di disegno con ridimensionamento responsive
   * 
   * Gestisce tutto il processo di rendering della mappa:
   * 1. Calcola dimensioni responsive del canvas
   * 2. Configura il contesto per rendering pixel-perfect
   * 3. Disegna i tile di terreno
   * 4. Disegna le strade che collegano le sfide
   * 
   * Il canvas si adatta automaticamente alle dimensioni dello schermo
   * mantenendo le proporzioni e l'allineamento degli elementi.
   */
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get full viewport dimensions
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight - 48; // Account for header height

    // Set canvas display size (CSS)
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    // Set canvas actual size (for drawing)
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = containerWidth * pixelRatio;
    canvas.height = containerHeight * pixelRatio;

    // Scale context for high DPI
    ctx.scale(pixelRatio, pixelRatio);

    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    // Calculate tile size to fill entire screen
    const tileWidth = containerWidth / MAP_WIDTH;
    const tileHeight = containerHeight / MAP_HEIGHT;
    const actualTileSize = Math.max(tileWidth, tileHeight); // Use max to fill screen completely

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Generate and draw terrain
    const terrainTiles = generateTerrainTiles();
    terrainTiles.forEach(tile => {
      const tileX = tile.x * actualTileSize;
      const tileY = tile.y * actualTileSize;
      drawTileResponsive(ctx, tile, tileX, tileY, actualTileSize);
    });

    // Generate and draw roads using actual canvas dimensions
    const roadPaths = generatePaths(containerWidth, containerHeight);
    roadPaths.forEach(path => drawRoadResponsive(ctx, path));
  };

  useEffect(() => {
    drawMap();
    
    // Redraw on window resize for responsiveness
    const handleResize = () => {
      setTimeout(drawMap, 100); // Debounce resize
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState.challenges]); // Redraw when challenges change

  const getNodeClassName = (node: MapNode): string => {
    const baseClass = 'map-node';
    switch (node.status) {
      case 'completed':
        return `${baseClass} completed`;
      case 'locked':
        return `${baseClass} locked`;
      default:
        return baseClass;
    }
  };

  const getNodeButtonClass = (node: MapNode): string => {
    switch (node.id) {
      case 'networking-forest':
        return 'nes-container with-title bg-green-600 text-white';
      case 'retro-puzzle':
        return 'nes-container with-title bg-yellow-500 text-black';
      case 'debug-dungeon':
        return 'nes-container with-title bg-purple-600 text-white';
      case 'social-arena':
        return 'nes-container with-title bg-orange-600 text-white';
      default:
        return 'nes-container with-title bg-gray-600 text-white';
    }
  };

  const getCurrentAvatarPosition = () => {
    const completedCount = gameState.gameProgress.completedChallenges.length;
    if (completedCount === 0) {
      return { top: '32%', left: '17%' }; // Near first challenge
    }
    
    const lastCompletedChallenge = gameState.challenges.find(
      c => c.id === gameState.gameProgress.completedChallenges[completedCount - 1]
    );
    
    if (lastCompletedChallenge) {
      // Position avatar near the last completed challenge
      const top = parseFloat(lastCompletedChallenge.position.top.replace('%', '')) + 2;
      const left = parseFloat(lastCompletedChallenge.position.left.replace('%', '')) + 2;
      return { top: `${top}%`, left: `${left}%` };
    }
    
    return { top: '62%', left: '42%' }; // Default position
  };

  const handleChallengeClick = (node: MapNode) => {
    const challengeIndex = gameState.challenges.findIndex(c => c.id === node.id);
    
    // Enforce sequential progression
    if (node.status === 'locked') {
      showToast('Questa challenge non è ancora disponibile', 'warning');
      return;
    }
    
    // Check if previous challenges are completed (sequential requirement)
    const previousChallengesCompleted = gameState.challenges.slice(0, challengeIndex).every(c => 
      gameState.gameProgress.completedChallenges.includes(c.id)
    );
    
    if (challengeIndex === 0 || previousChallengesCompleted) {
      setLocation(`/challenge/${node.id}`);
    } else {
      const remainingChallenges = challengeIndex - gameState.gameProgress.completedChallenges.length;
      showToast(`Devi completare ${remainingChallenges} sfida/e prima di questa`, 'warning');
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
          imageRendering: 'pixelated',
          width: '100vw',
          height: 'calc(100vh - 48px)'
        }}
        data-testid="terrain-canvas"
      />

      {/* Challenge Nodes Overlay */}
      {gameState.challenges.map((node) => (
        <div
          key={node.id}
          className={getNodeClassName(node)}
          style={{ top: node.position.top, left: node.position.left }}
          data-testid={`node-${node.id}`}
        >
          <div 
            className={`${getNodeButtonClass(node)} text-center cursor-pointer h-full flex flex-col justify-center`}
            onClick={() => handleChallengeClick(node)}
          >
            <p className="title" style={{ backgroundColor: 'inherit' }}>{node.title}</p>
            <div className="text-lg" data-testid={`emoji-${node.id}`}>{node.emoji}</div>
            <div className="text-xs font-retro mt-1" data-testid={`progress-${node.id}`}>
              {node.progress}/{node.total}
            </div>
          </div>
        </div>
      ))}

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

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-card border-2 border-black p-3" data-testid="map-legend">
        <div className="font-retro text-xs mb-2">Legenda</div>
        <div className="space-y-1 text-xs">
          <div>✅ Completato</div>
          <div>🔒 Bloccato</div>
          <div>👨‍💻 La tua posizione</div>
        </div>
      </div>

      {/* Progress summary */}
      <div className="absolute top-4 right-4 bg-card border-2 border-black p-3 min-w-48" data-testid="progress-summary">
        <div className="font-retro text-xs mb-2">Progresso</div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Gemme raccolte</span>
            <span data-testid="text-gems-collected">
              {gameState.gameProgress.completedChallenges.length}/4
            </span>
          </div>
          <div className="progress-custom">
            <div 
              className="progress-fill" 
              style={{ width: `${(gameState.gameProgress.completedChallenges.length / 4) * 100}%` }}
              data-testid="progress-bar"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasMap;