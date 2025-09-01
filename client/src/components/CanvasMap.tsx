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
  const generateTerrainTiles = (): MapTile[] => {
    const tiles: MapTile[] = [];
    
    // Calcola posizioni nodi in coordinate tile dal game state
    const nodePositions: {x: number, y: number}[] = gameState.challenges.map(challenge => {
      const topPercent = parseFloat(challenge.position.top.replace('%', ''));
      const leftPercent = parseFloat(challenge.position.left.replace('%', ''));
      return {
        x: Math.floor((leftPercent / 100) * MAP_WIDTH),
        y: Math.floor((topPercent / 100) * MAP_HEIGHT)
      };
    });
    
    // Funzione per verificare se un tile è in zona libera (nodi + strade)
    const isInClearZone = (x: number, y: number): boolean => {
      // Zone libere intorno ai nodi (raggio 5 tile per maggiore sicurezza)
      for (const node of nodePositions) {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance <= 5) return true;
      }
      
      // Zone libere per strade tra nodi consecutivi (corridoio più largo)
      for (let i = 0; i < nodePositions.length - 1; i++) {
        const start = nodePositions[i];
        const end = nodePositions[i + 1];
        
        // Calcola se il tile è vicino alla linea tra due nodi
        const lineDistance = distanceToLine(x, y, start.x, start.y, end.x, end.y);
        if (lineDistance <= 3) return true; // Corridoio di 3 tile di larghezza
      }
      
      // Aggiungi anche connessione dall'ultimo nodo al primo per completare il circuito
      if (nodePositions.length > 1) {
        const start = nodePositions[nodePositions.length - 1];
        const end = nodePositions[0];
        const lineDistance = distanceToLine(x, y, start.x, start.y, end.x, end.y);
        if (lineDistance <= 3) return true;
      }
      
      return false;
    };
    
    // Funzione helper per calcolare distanza punto-linea
    const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) return Math.sqrt(A * A + B * B);
      
      let param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
      
      const dx = px - xx;
      const dy = py - yy;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Genera tiles con logica intelligente
    for (let x = 0; x < MAP_WIDTH; x++) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        let tileType: TerrainType = 'grass'; // Default
        
        // PRIORITÀ ASSOLUTA: Forza grass nelle zone libere
        if (isInClearZone(x, y)) {
          tileType = 'grass';
        } else {
          // Distribuisci altri terreni solo nelle aree sicuramente libere
          // Forest areas (angoli lontani dai nodi)
          if ((x < 8 && y < 6) || (x < 6 && y > 30)) {
            tileType = 'forest';
          }
          // Mountain range (angolo in alto a destra, lontano dai nodi)
          else if (y < 4 && x > 36 && x < 46) {
            tileType = 'mountain';
          }
          // Lake (angolo in basso a destra, molto ridotto)
          else if (x > 42 && y > 32 && x < 47 && y < 36) {
            tileType = 'lake';
          }
          // Scattered forest patches (molto ridotti e distanti)
          else if ((x + y) % 24 === 0 && x > 6 && x < 36 && y > 8 && y < 30 && !isInClearZone(x, y)) {
            tileType = 'forest';
          }
          // Default: sempre grass per sicurezza
          else {
            tileType = 'grass';
          }
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
        // Base grass verde brillante come nel riferimento
        ctx.fillStyle = '#7ed321';
        ctx.fillRect(x, y, size, size);
        
        // Pattern pixel semplice e pulito
        ctx.fillStyle = '#6bb31d';
        const dotSpacing = Math.max(4, Math.floor(size / 4));
        for (let i = 0; i < 4; i++) {
          const dotX = x + ((tile.x * 3 + i * 7) % (size - 2));
          const dotY = y + ((tile.y * 5 + i * 3) % (size - 2));
          if ((dotX + dotY) % 6 === 0) {
            const dotSize = Math.max(1, Math.floor(size / 16));
            ctx.fillRect(dotX, dotY, dotSize, dotSize);
          }
        }
        
        // Variazione tonale per profondità
        ctx.fillStyle = '#8fef47';
        if ((tile.x + tile.y) % 5 === 0) {
          const highlightX = x + ((tile.x * 11) % (size - 3));
          const highlightY = y + ((tile.y * 13) % (size - 3));
          const highlightSize = Math.max(2, Math.floor(size / 8));
          ctx.fillRect(highlightX, highlightY, highlightSize, highlightSize);
        }
        break;

      case 'forest':
        // Base grass verde come sfondo
        ctx.fillStyle = '#7ed321';
        ctx.fillRect(x, y, size, size);
        
        // Albero più organico come nel riferimento
        const treeCenterX = x + size / 2;
        const treeCenterY = y + size / 2;
        const treeSize = Math.max(8, Math.floor(size * 0.7));
        
        // Tronco marrone per primo (più spesso)
        ctx.fillStyle = '#8b4513';
        const trunkWidth = Math.max(3, Math.floor(treeSize / 3));
        const trunkHeight = Math.max(4, Math.floor(treeSize / 2));
        ctx.fillRect(treeCenterX - trunkWidth/2, treeCenterY + treeSize/4, trunkWidth, trunkHeight);
        
        // Chioma principale - forma più organica
        ctx.fillStyle = '#2d8a2f';
        // Centro della chioma
        ctx.fillRect(treeCenterX - treeSize/2, treeCenterY - treeSize/3, treeSize, Math.floor(treeSize * 0.8));
        
        // Espansioni laterali per forma più naturale
        const expansionSize = Math.floor(treeSize * 0.3);
        ctx.fillRect(treeCenterX - treeSize/2 - expansionSize/2, treeCenterY - treeSize/6, expansionSize, Math.floor(treeSize * 0.5));
        ctx.fillRect(treeCenterX + treeSize/2 - expansionSize/2, treeCenterY - treeSize/6, expansionSize, Math.floor(treeSize * 0.5));
        
        // Parte superiore della chioma (più piccola)
        ctx.fillRect(treeCenterX - treeSize/3, treeCenterY - treeSize/2, Math.floor(treeSize * 0.6), Math.floor(treeSize * 0.4));
        
        // Dettagli scuri per profondità
        ctx.fillStyle = '#1f5f21';
        const detailSize = Math.max(1, Math.floor(size / 8));
        // Ombreggiature sui lati
        ctx.fillRect(treeCenterX - treeSize/2, treeCenterY - treeSize/6, detailSize, Math.floor(treeSize * 0.4));
        ctx.fillRect(treeCenterX + treeSize/2 - detailSize, treeCenterY - treeSize/6, detailSize, Math.floor(treeSize * 0.4));
        // Ombreggiatura sotto
        ctx.fillRect(treeCenterX - treeSize/3, treeCenterY + treeSize/4 - detailSize, Math.floor(treeSize * 0.6), detailSize);
        
        // Highlight verde chiaro sulla chioma
        ctx.fillStyle = '#45a049';
        const highlightSize = Math.floor(treeSize * 0.3);
        ctx.fillRect(treeCenterX - highlightSize/2, treeCenterY - treeSize/4, highlightSize, Math.floor(highlightSize * 0.8));
        break;

      case 'mountain':
        // Montagne grigie semplici come nel riferimento
        ctx.fillStyle = '#808080';
        ctx.fillRect(x, y, size, size);
        
        // Texture pietrosa semplice
        ctx.fillStyle = '#696969';
        const rockCount = Math.max(6, Math.floor(size / 4));
        for (let i = 0; i < rockCount; i++) {
          const rockX = x + ((tile.x * 7 + i * 11) % (size - 2));
          const rockY = y + ((tile.y * 11 + i * 7) % (size - 2));
          const rockSize = Math.max(1, Math.floor(size / 12));
          ctx.fillRect(rockX, rockY, rockSize, rockSize);
        }
        
        // Highlight semplice per definizione
        ctx.fillStyle = '#a0a0a0';
        if ((tile.x + tile.y) % 3 === 0) {
          const highlightX = x + size / 3;
          const highlightY = y + size / 4;
          const highlightSize = Math.max(2, Math.floor(size / 8));
          ctx.fillRect(highlightX, highlightY, highlightSize, highlightSize);
        }
        break;

      case 'lake':
        // Acqua con gradiente realistico
        ctx.fillStyle = '#4682b4';
        ctx.fillRect(x, y, size, size);
        
        // Acqua più profonda al centro
        ctx.fillStyle = '#1e3a8a';
        const deepX = x + size / 4;
        const deepY = y + size / 4;
        const deepSize = size / 2;
        ctx.fillRect(deepX, deepY, deepSize, deepSize);
        
        // Increspature animate più realistiche
        ctx.fillStyle = '#87ceeb';
        const rippleCount = Math.max(4, Math.floor(size / 4));
        for (let i = 0; i < rippleCount; i++) {
          const rippleX = x + ((tile.x * 23 + i * 9) % (size - 2));
          const rippleY = y + ((tile.y * 29 + i * 7) % (size - 2));
          const rippleSize = Math.max(1, Math.floor(size / 12));
          // Increspature orizzontali
          ctx.fillRect(rippleX, rippleY, rippleSize * 4, rippleSize);
          // Increspature verticali incrociate
          if (i % 2 === 0) {
            ctx.fillRect(rippleX + rippleSize, rippleY - rippleSize, rippleSize, rippleSize * 3);
          }
        }
        
        // Riflessi di luce sull'acqua
        ctx.fillStyle = '#b0e0e6';
        for (let i = 0; i < 6; i++) {
          const sparkleX = x + ((tile.x * 41 + i * 13) % (size - 1));
          const sparkleY = y + ((tile.y * 43 + i * 17) % (size - 1));
          const sparkleSize = Math.max(1, Math.floor(size / 24));
          ctx.fillRect(sparkleX, sparkleY, sparkleSize, sparkleSize);
        }
        
        // Bordo acqua più scuro
        ctx.fillStyle = '#191970';
        // Bordo superiore
        ctx.fillRect(x, y, size, Math.max(1, Math.floor(size / 16)));
        // Bordo sinistro
        ctx.fillRect(x, y, Math.max(1, Math.floor(size / 16)), size);
        break;

      case 'road':
        // Sentiero beige/giallo come nel riferimento
        ctx.fillStyle = '#f4d03f';
        ctx.fillRect(x, y, size, size);
        
        // Bordo leggermente più scuro per definizione
        ctx.fillStyle = '#e8c547';
        const borderSize = Math.max(1, Math.floor(size / 16));
        // Bordo superiore
        ctx.fillRect(x, y, size, borderSize);
        // Bordo inferiore  
        ctx.fillRect(x, y + size - borderSize, size, borderSize);
        // Bordi laterali
        ctx.fillRect(x, y, borderSize, size);
        ctx.fillRect(x + size - borderSize, y, borderSize, size);
        
        // Texture semplice del sentiero
        ctx.fillStyle = '#dab946';
        for (let i = 0; i < 3; i++) {
          const dotX = x + ((tile.x * 7 + i * 11) % (size - 2));
          const dotY = y + ((tile.y * 5 + i * 13) % (size - 2));
          const dotSize = Math.max(1, Math.floor(size / 24));
          if ((dotX + dotY) % 8 === 0) {
            ctx.fillRect(dotX, dotY, dotSize, dotSize);
          }
        }
        break;
    }
    
    // Aggiungi decorazioni ambientali
    drawEnvironmentalDecorations(ctx, tile, x, y, size);
  };

  /**
   * Aggiunge decorazioni ambientali sparse per rendere la mappa più viva
   * 
   * Include:
   * - Massi sparsi sui prati
   * - Cespugli e vegetazione varia  
   * - Uccelli occasionali nel cielo
   * - Funghi nelle foreste
   * - Cristalli di ghiaccio sulle montagne
   * 
   * @param ctx Contesto 2D del canvas
   * @param tile Tile su cui aggiungere decorazioni
   * @param x Posizione X in pixel
   * @param y Posizione Y in pixel  
   * @param size Dimensione del tile
   */
  const drawEnvironmentalDecorations = (ctx: CanvasRenderingContext2D, tile: MapTile, x: number, y: number, size: number) => {
    // Seed deterministico per decorazioni consistenti
    const decorationSeed = (tile.x * 127 + tile.y * 311) % 100;
    
    // Decorazioni molto ridotte per mantenere il look pulito come nel riferimento
    // Solo piccoli dettagli occasionali per non appesantire la mappa
    
    // Cespugli molto occasionali sui prati (solo 2% probabilità)
    if (tile.type === 'grass' && decorationSeed < 2) {
      ctx.fillStyle = '#6bb31d';
      const bushSize = Math.max(2, Math.floor(size / 6));
      const bushX = x + size / 2;
      const bushY = y + size / 2;
      ctx.fillRect(bushX, bushY, bushSize, bushSize);
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
    const roadWidth = Math.max(12, Math.floor(Math.min(window.innerWidth, window.innerHeight) / 60));
    const borderWidth = roadWidth + 6;
    const edgeWidth = borderWidth + 4;

    // Sentiero semplice beige/giallo come nel riferimento
    // Bordo più scuro per definizione
    ctx.strokeStyle = '#e8c547';
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Sentiero principale chiaro
    ctx.strokeStyle = '#f4d03f';
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

  {/* Map legend removed per request */}

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