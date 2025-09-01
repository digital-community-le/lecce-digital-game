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
          // Distribuisci terreni più generosamente nelle aree libere
          // Forest areas principali (angoli e zone sicure)
          if ((x < 10 && y < 8) || (x < 8 && y > 28) || (x > 38 && y > 30)) {
            tileType = 'forest';
          }
          // Mountain ranges (due catene montuose)
          else if ((y < 6 && x > 32 && x < 46) || (x < 8 && y > 20 && y < 28)) {
            tileType = 'mountain';
          }
          // Lake (angolo in basso a destra)
          else if (x > 40 && y > 32 && x < 47 && y < 37) {
            tileType = 'lake';
          }
          // Scattered forest patches (alberi sparsi più numerosi)
          else if ((x + y) % 16 === 0 && x > 8 && x < 38 && y > 10 && y < 30) {
            tileType = 'forest';
          }
          // Additional mountain patches (montagne sparse)
          else if ((x * y) % 32 === 0 && x > 10 && x < 35 && y > 6 && y < 20) {
            tileType = 'mountain';
          }
          // More scattered trees (pattern diverso)
          else if ((x * 3 + y * 7) % 20 === 0 && x > 12 && x < 40 && y > 12 && y < 32) {
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
        // Base grass verde vivace del riferimento
        ctx.fillStyle = '#8FD14F';
        ctx.fillRect(x, y, size, size);
        
        // Pattern punteggiato come nel riferimento
        ctx.fillStyle = '#7BC143';
        const grassDetail = Math.max(1, Math.floor(size / 8));
        for (let i = 0; i < 8; i++) {
          const dotX = x + ((tile.x * 3 + i * 5) % (size - grassDetail));
          const dotY = y + ((tile.y * 7 + i * 3) % (size - grassDetail));
          if ((dotX + dotY + i) % 4 === 0) {
            ctx.fillRect(dotX, dotY, grassDetail, grassDetail);
          }
        }
        
        // Variazioni tonali per texture
        ctx.fillStyle = '#9FE35F';
        for (let i = 0; i < 3; i++) {
          const lightX = x + ((tile.x * 11 + i * 13) % (size - 2));
          const lightY = y + ((tile.y * 17 + i * 7) % (size - 2));
          if ((lightX + lightY) % 6 === 0) {
            const lightSize = Math.max(1, Math.floor(size / 12));
            ctx.fillRect(lightX, lightY, lightSize, lightSize);
          }
        }
        break;

      case 'forest':
        // Base grass verde come sfondo
        ctx.fillStyle = '#8FD14F';
        ctx.fillRect(x, y, size, size);
        
        // Albero più organico (versione precedente migliorata)
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
        // Base grigia delle montagne del riferimento
        ctx.fillStyle = '#8E8E8E';
        ctx.fillRect(x, y, size, size);
        
        // Pattern blocchi scuri per texture rocciosa
        ctx.fillStyle = '#6D6D6D';
        const blockSize = Math.max(2, Math.floor(size / 6));
        for (let i = 0; i < 6; i++) {
          const blockX = x + ((tile.x * 5 + i * 9) % (size - blockSize));
          const blockY = y + ((tile.y * 7 + i * 11) % (size - blockSize));
          if ((blockX + blockY + i) % 4 === 0) {
            ctx.fillRect(blockX, blockY, blockSize, blockSize);
          }
        }
        
        // Highlight chiari per effetto roccia
        ctx.fillStyle = '#ADADAD';
        for (let i = 0; i < 4; i++) {
          const lightX = x + ((tile.x * 13 + i * 17) % (size - 2));
          const lightY = y + ((tile.y * 19 + i * 7) % (size - 2));
          if ((lightX + lightY) % 6 === 0) {
            const lightSize = Math.max(1, Math.floor(size / 10));
            ctx.fillRect(lightX, lightY, lightSize, lightSize);
          }
        }
        
        // Dettagli pixel per definizione
        ctx.fillStyle = '#5A5A5A';
        for (let i = 0; i < 8; i++) {
          const pixelX = x + ((tile.x * 3 + i * 7) % size);
          const pixelY = y + ((tile.y * 11 + i * 5) % size);
          if ((pixelX + pixelY + i) % 8 === 0) {
            ctx.fillRect(pixelX, pixelY, 1, 1);
          }
        }
        break;

      case 'lake':
        // Acqua blu scura come nel riferimento
        ctx.fillStyle = '#1E4A73';
        ctx.fillRect(x, y, size, size);
        
        // Pattern ondulato dell'acqua
        ctx.fillStyle = '#2A5A85';
        const waveDetail = Math.max(1, Math.floor(size / 8));
        for (let i = 0; i < 6; i++) {
          const waveX = x + ((tile.x * 3 + i * 7) % (size - waveDetail));
          const waveY = y + ((tile.y * 5 + i * 11) % (size - waveDetail));
          if ((waveX + waveY + i) % 4 === 0) {
            ctx.fillRect(waveX, waveY, waveDetail, Math.max(1, waveDetail / 2));
          }
        }
        
        // Riflessi chiari per movimento dell'acqua
        ctx.fillStyle = '#4B7BA7';
        for (let i = 0; i < 4; i++) {
          const reflX = x + ((tile.x * 11 + i * 13) % (size - 1));
          const reflY = y + ((tile.y * 17 + i * 7) % (size - 1));
          if ((reflX + reflY) % 6 === 0) {
            ctx.fillRect(reflX, reflY, 1, 1);
          }
        }
        
        // Bordi più scuri per definire l'acqua
        ctx.fillStyle = '#0F2940';
        const edgeSize = Math.max(1, Math.floor(size / 16));
        for (let i = 0; i < 8; i++) {
          const edgeX = x + ((tile.x * 7 + i * 9) % size);
          const edgeY = y + ((tile.y * 13 + i * 5) % size);
          if ((edgeX + edgeY + i) % 8 === 0) {
            ctx.fillRect(edgeX, edgeY, edgeSize, edgeSize);
          }
        }
        break;

      case 'road':
        // Sentiero beige come nel riferimento
        ctx.fillStyle = '#F4E4BC';
        ctx.fillRect(x, y, size, size);
        
        // Bordi scuri per definire il sentiero
        ctx.fillStyle = '#C8B882';
        const borderThick = Math.max(1, Math.floor(size / 12));
        // Bordi laterali
        ctx.fillRect(x, y, borderThick, size);
        ctx.fillRect(x + size - borderThick, y, borderThick, size);
        // Bordi superiore e inferiore
        ctx.fillRect(x, y, size, borderThick);
        ctx.fillRect(x, y + size - borderThick, size, borderThick);
        
        // Pattern interno del sentiero
        ctx.fillStyle = '#E6D7A3';
        const pathDetail = Math.max(1, Math.floor(size / 16));
        for (let i = 0; i < 6; i++) {
          const detailX = x + borderThick + ((tile.x * 5 + i * 7) % (size - borderThick * 2 - pathDetail));
          const detailY = y + borderThick + ((tile.y * 11 + i * 3) % (size - borderThick * 2 - pathDetail));
          if ((detailX + detailY + i) % 5 === 0) {
            ctx.fillRect(detailX, detailY, pathDetail, pathDetail);
          }
        }
        
        // Piccole ombreggiature per texture
        ctx.fillStyle = '#D4C394';
        for (let i = 0; i < 4; i++) {
          const shadowX = x + ((tile.x * 13 + i * 17) % (size - 1));
          const shadowY = y + ((tile.y * 7 + i * 19) % (size - 1));
          if ((shadowX + shadowY) % 7 === 0) {
            ctx.fillRect(shadowX, shadowY, 1, 1);
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

    // Strada fedele al riferimento - bordi scuri e centro chiaro
    // Bordo esterno scuro
    ctx.strokeStyle = '#A0906B';
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Strada principale beige
    ctx.strokeStyle = '#F4E4BC';
    ctx.lineWidth = roadWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Linea centrale più chiara per evidenziare il percorso
    ctx.strokeStyle = '#FDF6E3';
    ctx.lineWidth = Math.max(2, roadWidth / 3);
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