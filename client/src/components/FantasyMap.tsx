import React from 'react';
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

const FantasyMap: React.FC = () => {
  const [, setLocation] = useLocation();
  const { gameState, showToast } = useGameStore();

  // Generate procedural terrain tiles based on map dimensions
  const generateTerrainTiles = (): MapTile[] => {
    const tiles: MapTile[] = [];
    const mapWidth = 20; // Grid width
    const mapHeight = 15; // Grid height
    
    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        let tileType: TerrainType = 'grass'; // Default
        
        // Forest areas (top-left and scattered patches)
        if ((x < 6 && y < 4) || (x > 15 && y > 10) || (Math.random() > 0.85 && x > 2 && x < 18)) {
          tileType = 'forest';
        }
        // Mountain range (top area)
        else if (y < 3 && x > 8 && x < 16) {
          tileType = 'mountain';
        }
        // Lake (bottom-right corner)
        else if (x > 14 && y > 11) {
          tileType = 'lake';
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
      const fromX = Math.round((parseFloat(current.position.left.replace('%', '')) / 100) * 20);
      const fromY = Math.round((parseFloat(current.position.top.replace('%', '')) / 100) * 15);
      const toX = Math.round((parseFloat(next.position.left.replace('%', '')) / 100) * 20);
      const toY = Math.round((parseFloat(next.position.top.replace('%', '')) / 100) * 15);
      
      paths.push({ fromX, fromY, toX, toY });
    }
    
    return paths;
  };

  const terrainTiles = generateTerrainTiles();
  const roadPaths = generatePaths();

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
    <div className="fantasy-map relative" data-testid="fantasy-map">
      {/* Terrain Tiles Grid */}
      <div className="absolute inset-0 terrain-grid">
        {terrainTiles.map((tile, index) => (
          <div
            key={`${tile.x}-${tile.y}`}
            className={`terrain-tile terrain-${tile.type}`}
            style={{
              left: `${(tile.x / 20) * 100}%`,
              top: `${(tile.y / 15) * 100}%`,
              width: `${100 / 20}%`,
              height: `${100 / 15}%`,
            }}
            data-testid={`tile-${tile.type}-${index}`}
          />
        ))}
      </div>

      {/* Road Paths connecting challenges */}
      <svg className="absolute inset-0 w-full h-full z-[5]" data-testid="road-paths">
        {roadPaths.map((path, index) => {
          const x1 = (path.fromX / 20) * 100;
          const y1 = (path.fromY / 15) * 100;
          const x2 = (path.toX / 20) * 100;
          const y2 = (path.toY / 15) * 100;
          
          return (
            <g key={index}>
              {/* Road stroke (dirt path) */}
              <line
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="#8B4513"
                strokeWidth="8"
                strokeDasharray="4,2"
                opacity="0.8"
                data-testid={`road-segment-${index}`}
              />
              {/* Road border (darker) */}
              <line
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="#654321"
                strokeWidth="12"
                opacity="0.4"
                data-testid={`road-border-${index}`}
              />
            </g>
          );
        })}
      </svg>

      {/* Challenge Nodes */}
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

export default FantasyMap;
