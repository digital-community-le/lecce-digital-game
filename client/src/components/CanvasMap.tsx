import React, { useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import { MapNode } from '@/types/game';

type TerrainType = 'grass' | 'forest' | 'mountain' | 'lake' | 'road';

interface MapTile {
  x: number;
  y: number;
  type: TerrainType;
}

interface PathSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const CanvasMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();
  const { gameState, showToast } = useGameStore();

  const TILE_SIZE = 32; // Pixel size for each tile
  const MAP_WIDTH = 24; // Grid width
  const MAP_HEIGHT = 18; // Grid height

  // Generate terrain tiles
  const generateTerrainTiles = (): MapTile[] => {
    const tiles: MapTile[] = [];
    
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        let tileType: TerrainType = 'grass'; // Default
        
        // Forest areas (top-left quadrant and bottom-left)
        if ((x < 8 && y < 6) || (x < 6 && y > 12)) {
          tileType = 'forest';
        }
        // Mountain range (top-center and top-right)
        else if (y < 4 && x > 10 && x < 20) {
          tileType = 'mountain';
        }
        // Lake (bottom-right corner)
        else if (x > 18 && y > 13) {
          tileType = 'lake';
        }
        // Add some scattered forest patches deterministically
        else if ((x + y) % 7 === 0 && x > 5 && x < 18 && y > 8) {
          tileType = 'forest';
        }
        
        tiles.push({ x, y, type: tileType });
      }
    }
    
    return tiles;
  };

  // Generate paths connecting challenge nodes
  const generatePaths = (): PathSegment[] => {
    const paths: PathSegment[] = [];
    const challenges = gameState.challenges;
    
    for (let i = 0; i < challenges.length - 1; i++) {
      const current = challenges[i];
      const next = challenges[i + 1];
      
      // Convert percentage positions to grid coordinates
      const fromX = Math.round((parseFloat(current.position.left.replace('%', '')) / 100) * MAP_WIDTH);
      const fromY = Math.round((parseFloat(current.position.top.replace('%', '')) / 100) * MAP_HEIGHT);
      const toX = Math.round((parseFloat(next.position.left.replace('%', '')) / 100) * MAP_WIDTH);
      const toY = Math.round((parseFloat(next.position.top.replace('%', '')) / 100) * MAP_HEIGHT);
      
      paths.push({ fromX, fromY, toX, toY });
    }
    
    return paths;
  };

  // Draw individual tile on canvas
  const drawTile = (ctx: CanvasRenderingContext2D, tile: MapTile) => {
    const x = tile.x * TILE_SIZE;
    const y = tile.y * TILE_SIZE;

    switch (tile.type) {
      case 'grass':
        // Green grass with random dots
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#16a34a';
        for (let i = 0; i < 8; i++) {
          const dotX = x + ((tile.x * 7 + tile.y * 3 + i) % TILE_SIZE);
          const dotY = y + ((tile.y * 5 + tile.x * 2 + i) % TILE_SIZE);
          ctx.fillRect(dotX, dotY, 2, 2);
        }
        break;

      case 'forest':
        // Dark green with tree-like patterns
        ctx.fillStyle = '#166534';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#052e16';
        // Draw tree trunks
        for (let i = 0; i < 4; i++) {
          const treeX = x + ((tile.x * 11 + i * 7) % (TILE_SIZE - 8));
          const treeY = y + ((tile.y * 13 + i * 5) % (TILE_SIZE - 12));
          ctx.fillRect(treeX, treeY + 8, 4, 8);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(treeX - 2, treeY, 8, 8);
          ctx.fillStyle = '#052e16';
        }
        break;

      case 'mountain':
        // Gray rocky texture
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#374151';
        // Rocky pattern
        for (let i = 0; i < 16; i++) {
          const rockX = x + ((tile.x * 17 + tile.y * 11 + i) % TILE_SIZE);
          const rockY = y + ((tile.y * 19 + tile.x * 7 + i) % TILE_SIZE);
          if ((rockX + rockY) % 8 < 4) {
            ctx.fillRect(rockX, rockY, 2, 2);
          }
        }
        break;

      case 'lake':
        // Blue water with shimmer effect
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#1d4ed8';
        // Water ripples
        for (let i = 0; i < 6; i++) {
          const rippleX = x + ((tile.x * 23 + i * 9) % (TILE_SIZE - 4));
          const rippleY = y + ((tile.y * 29 + i * 7) % (TILE_SIZE - 4));
          ctx.fillRect(rippleX, rippleY, 3, 1);
          ctx.fillRect(rippleX + 1, rippleY + 2, 1, 3);
        }
        break;

      case 'road':
        // Brown dirt road
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#654321';
        // Road texture
        for (let i = 0; i < 12; i++) {
          const dotX = x + ((tile.x * 31 + i * 13) % TILE_SIZE);
          const dotY = y + ((tile.y * 37 + i * 11) % TILE_SIZE);
          ctx.fillRect(dotX, dotY, 1, 1);
        }
        break;
    }
  };

  // Draw road connecting two points
  const drawRoad = (ctx: CanvasRenderingContext2D, path: PathSegment) => {
    const startX = path.fromX * TILE_SIZE + TILE_SIZE / 2;
    const startY = path.fromY * TILE_SIZE + TILE_SIZE / 2;
    const endX = path.toX * TILE_SIZE + TILE_SIZE / 2;
    const endY = path.toY * TILE_SIZE + TILE_SIZE / 2;

    // Draw road path
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw road border
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 16;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  // Main drawing function
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate and draw terrain
    const terrainTiles = generateTerrainTiles();
    terrainTiles.forEach(tile => drawTile(ctx, tile));

    // Generate and draw roads
    const roadPaths = generatePaths();
    roadPaths.forEach(path => drawRoad(ctx, path));
  };

  useEffect(() => {
    drawMap();
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
        className="absolute inset-0 w-full h-full object-cover pixelated"
        style={{ imageRendering: 'pixelated' }}
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