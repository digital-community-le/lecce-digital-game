import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/hooks/use-game-store';
import { MapNode } from '@/types/game';

// Import tileset assets
import terrainTilesetUrl from '@assets/generated_images/Base_terrain_tiles_sheet_3cc582ed.png';
import treeTilesetUrl from '@assets/generated_images/Tree_variations_sprite_sheet_57fd4957.png';
import mountainTilesetUrl from '@assets/generated_images/Mountains_and_roads_sheet_6aa0a455.png';

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
  
  // Stato per gestire il caricamento dei tileset
  const [tilesetsLoaded, setTilesetsLoaded] = useState(false);
  const [tilesets, setTilesets] = useState<{
    terrain: HTMLImageElement | null;
    trees: HTMLImageElement | null;
    mountains: HTMLImageElement | null;
  }>({
    terrain: null,
    trees: null,
    mountains: null
  });

  /** Dimensione di ogni tile in pixel - ridotta per forme più smussate */
  const TILE_SIZE = 16;
  /** Dimensione dei tile nei tileset sprite (16x16 pixel) */
  const SPRITE_TILE_SIZE = 16;
  /** Larghezza griglia mappa (numero di tile orizzontali) - bilanciata per dettaglio e visibilità */
  const MAP_WIDTH = 48;
  /** Altezza griglia mappa (numero di tile verticali) - bilanciata per dettaglio e visibilità */
  const MAP_HEIGHT = 36;

  // Carica i tileset al mount del componente
  useEffect(() => {
    const loadTilesets = async () => {
      try {
        const [terrainImg, treesImg, mountainsImg] = await Promise.all([
          loadImage(terrainTilesetUrl),
          loadImage(treeTilesetUrl), 
          loadImage(mountainTilesetUrl)
        ]);
        
        setTilesets({
          terrain: terrainImg,
          trees: treesImg,
          mountains: mountainsImg
        });
        setTilesetsLoaded(true);
      } catch (error) {
        console.error('Errore nel caricamento dei tileset:', error);
        // Fallback al sistema di disegno programmatico
        setTilesetsLoaded(false);
      }
    };
    
    loadTilesets();
  }, []);

  // Helper function per caricare immagini
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

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
          // Distribuisci terreni secondo il nuovo stile del riferimento
          // Mountain clusters (gruppi di montagne triangolari)
          if ((x < 12 && y < 10) || (x > 32 && x < 46 && y < 12) || (x < 10 && y > 25 && y < 35) || (x > 35 && y > 20 && y < 30)) {
            tileType = 'mountain';
          }
          // River system (fiume serpeggiante verticale)
          else if (x > 20 && x < 26 && ((y > 5 && y < 15) || (y > 20 && y < 35))) {
            tileType = 'lake';
          }
          // Scattered individual trees (alberi sparsi come nel riferimento)
          else if ((x + y * 3) % 12 === 0 && x > 8 && x < 40 && y > 8 && y < 35) {
            tileType = 'forest';
          }
          // More tree clusters
          else if ((x * 2 + y) % 15 === 0 && x > 5 && x < 45 && y > 5 && y < 40) {
            tileType = 'forest';
          }
          // Additional scattered trees
          else if ((x * y) % 28 === 0 && x > 10 && x < 35 && y > 10 && y < 30) {
            tileType = 'forest';
          }
          // Default: sempre grass
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
   * Disegna un singolo tile usando sprite dal tileset oppure fallback programmatico
   * 
   * @param ctx Contesto 2D del canvas
   * @param tile Tile da disegnare
   * @param x Posizione X in pixel
   * @param y Posizione Y in pixel
   * @param size Dimensione del tile in pixel
   */
  const drawTileResponsive = (ctx: CanvasRenderingContext2D, tile: MapTile, x: number, y: number, size: number) => {
    // Se i tileset sono caricati, usa gli sprite
    if (tilesetsLoaded && tilesets.terrain && tilesets.trees && tilesets.mountains) {
      drawTileFromSprite(ctx, tile, x, y, size);
      return;
    }
    
    // Fallback al disegno programmatico se gli sprite non sono caricati
    drawTileProgrammatic(ctx, tile, x, y, size);
  };

  /**
   * Disegna tile usando sprite dai tileset
   */
  const drawTileFromSprite = (ctx: CanvasRenderingContext2D, tile: MapTile, x: number, y: number, size: number) => {
    let sourceImage: HTMLImageElement;
    let spriteX = 0, spriteY = 0;

    switch (tile.type) {
      case 'grass':
        sourceImage = tilesets.terrain!;
        // Usa diverse varianti di erba (primi 4 tile della griglia 4x4)
        const grassVariant = (tile.x + tile.y) % 4;
        spriteX = grassVariant * SPRITE_TILE_SIZE;
        spriteY = 0;
        break;
        
      case 'forest':
        sourceImage = tilesets.trees!;
        // Usa diverse varianti di alberi (primi 8 tile della griglia 4x4)
        const treeVariant = (tile.x * 3 + tile.y * 5) % 8;
        spriteX = (treeVariant % 4) * SPRITE_TILE_SIZE;
        spriteY = Math.floor(treeVariant / 4) * SPRITE_TILE_SIZE;
        break;
        
      case 'mountain':
        sourceImage = tilesets.mountains!;
        // Usa diverse varianti di montagne (primi 4 tile)
        const mountainVariant = (tile.x + tile.y * 2) % 4;
        spriteX = mountainVariant * SPRITE_TILE_SIZE;
        spriteY = 0;
        break;
        
      case 'lake':
        sourceImage = tilesets.terrain!;
        // Usa tile di acqua (ultima riga della griglia terrain)
        const waterVariant = (tile.x + tile.y) % 4;
        spriteX = waterVariant * SPRITE_TILE_SIZE;
        spriteY = 3 * SPRITE_TILE_SIZE; // Ultima riga
        break;
        
      default:
        // Default grass
        sourceImage = tilesets.terrain!;
        spriteX = 0;
        spriteY = 0;
    }

    // Disegna lo sprite scalato alla dimensione del tile
    ctx.drawImage(
      sourceImage,
      spriteX, spriteY, SPRITE_TILE_SIZE, SPRITE_TILE_SIZE, // Sorgente
      x, y, size, size // Destinazione scalata
    );
  };

  /**
   * Fallback al disegno programmatico (versione originale)
   */
  const drawTileProgrammatic = (ctx: CanvasRenderingContext2D, tile: MapTile, x: number, y: number, size: number) => {

    switch (tile.type) {
      case 'grass':
        // Base grass verde vivace come nel nuovo riferimento
        ctx.fillStyle = '#6FBF3C';
        ctx.fillRect(x, y, size, size);
        
        // Pattern puntini più piccoli e frequenti
        ctx.fillStyle = '#5FA032';
        const grassDetail = Math.max(1, Math.floor(size / 12));
        for (let i = 0; i < 12; i++) {
          const dotX = x + ((tile.x * 2 + i * 3) % (size - grassDetail));
          const dotY = y + ((tile.y * 5 + i * 7) % (size - grassDetail));
          if ((dotX + dotY + i) % 3 === 0) {
            ctx.fillRect(dotX, dotY, grassDetail, grassDetail);
          }
        }
        
        // Texture più fine per l'erba
        ctx.fillStyle = '#7ED14F';
        for (let i = 0; i < 6; i++) {
          const lightX = x + ((tile.x * 7 + i * 11) % (size - 1));
          const lightY = y + ((tile.y * 13 + i * 5) % (size - 1));
          if ((lightX + lightY + i) % 5 === 0) {
            ctx.fillRect(lightX, lightY, 1, 1);
          }
        }
        break;

      case 'forest':
        // Base grass come sfondo
        ctx.fillStyle = '#6FBF3C';
        ctx.fillRect(x, y, size, size);
        
        // Albero stile pixel art classico come nel riferimento
        const treeCenterX = x + size / 2;
        const treeCenterY = y + size / 2;
        const treeSize = Math.max(6, Math.floor(size * 0.6));
        
        // Tronco marrone semplice
        ctx.fillStyle = '#5D4037';
        const trunkWidth = Math.max(2, Math.floor(treeSize / 4));
        const trunkHeight = Math.max(3, Math.floor(treeSize / 3));
        ctx.fillRect(treeCenterX - trunkWidth/2, treeCenterY + treeSize/3, trunkWidth, trunkHeight);
        
        // Chioma principale - verde scuro compatto
        ctx.fillStyle = '#2E7D32';
        const crownSize = Math.max(8, Math.floor(treeSize * 0.8));
        ctx.fillRect(treeCenterX - crownSize/2, treeCenterY - crownSize/3, crownSize, Math.floor(crownSize * 0.8));
        
        // Parte superiore arrotondata
        const topSize = Math.max(4, Math.floor(crownSize * 0.6));
        ctx.fillRect(treeCenterX - topSize/2, treeCenterY - crownSize/2, topSize, Math.floor(topSize * 0.6));
        
        // Ombreggiatura lato destro per volume
        ctx.fillStyle = '#1B5E20';
        const shadowWidth = Math.max(1, Math.floor(crownSize / 6));
        ctx.fillRect(treeCenterX + crownSize/2 - shadowWidth, treeCenterY - crownSize/3, shadowWidth, Math.floor(crownSize * 0.6));
        
        // Highlight lato sinistro
        ctx.fillStyle = '#4CAF50';
        const highlightWidth = Math.max(1, Math.floor(crownSize / 8));
        ctx.fillRect(treeCenterX - crownSize/2, treeCenterY - crownSize/4, highlightWidth, Math.floor(crownSize * 0.4));
        break;

      case 'mountain':
        // Base grass per sfondo
        ctx.fillStyle = '#6FBF3C';
        ctx.fillRect(x, y, size, size);
        
        // Montagna triangolare 3D come nel riferimento
        const mountainCenterX = x + size / 2;
        const mountainBase = y + size;
        const mountainTop = y + Math.floor(size * 0.2);
        const mountainWidth = Math.max(8, Math.floor(size * 0.8));
        
        // Base della montagna - marrone chiaro
        ctx.fillStyle = '#A0816C';
        for (let dy = 0; dy < size * 0.8; dy++) {
          const currentY = mountainBase - dy;
          const currentWidth = Math.floor(mountainWidth * (1 - dy / (size * 0.8)));
          if (currentWidth > 0) {
            ctx.fillRect(mountainCenterX - currentWidth/2, currentY, currentWidth, 1);
          }
        }
        
        // Lato in ombra (destro) - marrone scuro
        ctx.fillStyle = '#6D4C41';
        for (let dy = 0; dy < size * 0.8; dy++) {
          const currentY = mountainBase - dy;
          const currentWidth = Math.floor(mountainWidth * (1 - dy / (size * 0.8)));
          const shadowWidth = Math.max(1, Math.floor(currentWidth / 3));
          if (currentWidth > 0 && shadowWidth > 0) {
            ctx.fillRect(mountainCenterX + currentWidth/2 - shadowWidth, currentY, shadowWidth, 1);
          }
        }
        
        // Lato illuminato (sinistro) - beige chiaro
        ctx.fillStyle = '#BCAAA4';
        for (let dy = 0; dy < size * 0.8; dy++) {
          const currentY = mountainBase - dy;
          const currentWidth = Math.floor(mountainWidth * (1 - dy / (size * 0.8)));
          const highlightWidth = Math.max(1, Math.floor(currentWidth / 4));
          if (currentWidth > 0 && highlightWidth > 0) {
            ctx.fillRect(mountainCenterX - currentWidth/2, currentY, highlightWidth, 1);
          }
        }
        break;

      case 'lake':
        // Acqua blu vivace come nel riferimento
        ctx.fillStyle = '#2196F3';
        ctx.fillRect(x, y, size, size);
        
        // Increspature orizzontali dell'acqua
        ctx.fillStyle = '#1976D2';
        const waveHeight = Math.max(1, Math.floor(size / 16));
        for (let i = 0; i < 4; i++) {
          const waveY = y + ((tile.y * 3 + i * 5) % (size - waveHeight));
          ctx.fillRect(x, waveY, size, waveHeight);
        }
        
        // Riflessi chiari dell'acqua
        ctx.fillStyle = '#42A5F5';
        for (let i = 0; i < 6; i++) {
          const reflX = x + ((tile.x * 7 + i * 11) % (size - 2));
          const reflY = y + ((tile.y * 13 + i * 5) % (size - 1));
          if ((reflX + reflY + i) % 4 === 0) {
            ctx.fillRect(reflX, reflY, 2, 1);
          }
        }
        
        // Bordi più scuri per definire l'acqua
        ctx.fillStyle = '#0D47A1';
        const borderWidth = Math.max(1, Math.floor(size / 20));
        ctx.fillRect(x, y, size, borderWidth);
        ctx.fillRect(x, y, borderWidth, size);
        break;

      case 'road':
        // Strada beige come nel riferimento
        ctx.fillStyle = '#D4AF8C';
        ctx.fillRect(x, y, size, size);
        
        // Bordi marroni per definire la strada
        ctx.fillStyle = '#A0816C';
        const borderThick = Math.max(1, Math.floor(size / 10));
        // Bordi laterali
        ctx.fillRect(x, y, borderThick, size);
        ctx.fillRect(x + size - borderThick, y, borderThick, size);
        // Bordi superiore e inferiore
        ctx.fillRect(x, y, size, borderThick);
        ctx.fillRect(x, y + size - borderThick, size, borderThick);
        
        // Texture della strada
        ctx.fillStyle = '#C2996E';
        const pathDetail = Math.max(1, Math.floor(size / 12));
        for (let i = 0; i < 4; i++) {
          const detailX = x + borderThick + ((tile.x * 3 + i * 7) % (size - borderThick * 2 - pathDetail));
          const detailY = y + borderThick + ((tile.y * 5 + i * 11) % (size - borderThick * 2 - pathDetail));
          if ((detailX + detailY + i) % 6 === 0) {
            ctx.fillRect(detailX, detailY, pathDetail, pathDetail);
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

    // Strada stile nuovo riferimento - beige con bordi marroni
    // Bordo esterno marrone
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Strada principale beige
    ctx.strokeStyle = '#D4AF8C';
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
    const actualTileSize = Math.max(tileWidth, tileHeight, 12); // Use max to fill screen completely, min 12px

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
  }, [gameState.challenges, tilesetsLoaded]); // Redraw when challenges change or tilesets load

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