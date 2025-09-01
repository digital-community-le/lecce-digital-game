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
        // Base grass texture con sfumature multiple
        ctx.fillStyle = '#32cd32';
        ctx.fillRect(x, y, size, size);
        
        // Layer di dettagli per grass più realistico
        ctx.fillStyle = '#228b22';
        const grassBlade = Math.max(1, Math.floor(size / 8));
        for (let i = 0; i < 12; i++) {
          const bladeX = x + ((tile.x * 7 + tile.y * 3 + i * 5) % (size - grassBlade));
          const bladeY = y + ((tile.y * 11 + tile.x * 13 + i * 3) % (size - grassBlade));
          ctx.fillRect(bladeX, bladeY, grassBlade, grassBlade * 2);
        }
        
        // Piccoli fiori sparsi
        ctx.fillStyle = '#ffff99';
        if ((tile.x + tile.y) % 8 === 0) {
          const flowerX = x + size / 2;
          const flowerY = y + size / 2;
          const flowerSize = Math.max(1, Math.floor(size / 12));
          ctx.fillRect(flowerX, flowerY, flowerSize, flowerSize);
        }
        
        // Texture aggiuntiva con puntini
        ctx.fillStyle = '#2e8b57';
        for (let i = 0; i < 6; i++) {
          const dotX = x + ((tile.x * 17 + i * 7) % size);
          const dotY = y + ((tile.y * 19 + i * 11) % size);
          const dotSize = Math.max(1, Math.floor(size / 16));
          ctx.fillRect(dotX, dotY, dotSize, dotSize);
        }
        break;

      case 'forest':
        // Base foresta con tonalità più ricche
        ctx.fillStyle = '#1a5d1a';
        ctx.fillRect(x, y, size, size);
        
        // Sottobosco scuro
        ctx.fillStyle = '#0d4a0d';
        for (let i = 0; i < 8; i++) {
          const bushX = x + ((tile.x * 13 + i * 9) % (size - 4));
          const bushY = y + ((tile.y * 17 + i * 7) % (size - 4));
          const bushSize = Math.max(2, Math.floor(size / 6));
          ctx.fillRect(bushX, bushY, bushSize, bushSize);
        }
        
        // Alberi stilizzati più dettagliati
        const treeCount = Math.max(2, Math.floor(size / 6));
        for (let i = 0; i < treeCount; i++) {
          const treeX = x + ((tile.x * 11 + i * 7) % (size - 6));
          const treeY = y + ((tile.y * 13 + i * 5) % (size - 8));
          const trunkWidth = Math.max(2, Math.floor(size / 10));
          const trunkHeight = Math.max(3, Math.floor(size / 5));
          
          // Tronco marrone
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(treeX, treeY + trunkHeight + 2, trunkWidth, trunkHeight);
          
          // Chioma verde con più dettaglio
          ctx.fillStyle = '#228b22';
          const crownSize = trunkWidth * 3;
          ctx.fillRect(treeX - crownSize/2, treeY, crownSize, trunkHeight + 2);
          
          // Highlight sulla chioma
          ctx.fillStyle = '#32cd32';
          ctx.fillRect(treeX - crownSize/4, treeY + 1, crownSize/2, trunkHeight/2);
        }
        
        // Muschio e vegetazione
        ctx.fillStyle = '#2d5a2d';
        for (let i = 0; i < 10; i++) {
          const mossX = x + ((tile.x * 23 + i * 11) % size);
          const mossY = y + ((tile.y * 29 + i * 13) % size);
          const mossSize = Math.max(1, Math.floor(size / 20));
          ctx.fillRect(mossX, mossY, mossSize, mossSize);
        }
        break;

      case 'mountain':
        // Base montana con gradiente di grigi
        ctx.fillStyle = '#708090';
        ctx.fillRect(x, y, size, size);
        
        // Rocce grandi per dare struttura
        ctx.fillStyle = '#556b6b';
        const bigRockCount = Math.max(3, Math.floor(size / 8));
        for (let i = 0; i < bigRockCount; i++) {
          const rockX = x + ((tile.x * 13 + i * 9) % (size - 4));
          const rockY = y + ((tile.y * 17 + i * 7) % (size - 4));
          const rockSize = Math.max(3, Math.floor(size / 4));
          ctx.fillRect(rockX, rockY, rockSize, rockSize);
        }
        
        // Texture rocciosa dettagliata
        ctx.fillStyle = '#2f4f4f';
        const rockCount = Math.max(12, Math.floor(size * size / 16));
        for (let i = 0; i < rockCount; i++) {
          const rockX = x + ((tile.x * 17 + tile.y * 11 + i * 3) % size);
          const rockY = y + ((tile.y * 19 + tile.x * 7 + i * 5) % size);
          const rockSize = Math.max(1, Math.floor(size / 12));
          ctx.fillRect(rockX, rockY, rockSize, rockSize);
        }
        
        // Highlight sulle rocce per effetto 3D
        ctx.fillStyle = '#9acd32';
        for (let i = 0; i < 4; i++) {
          const highlightX = x + ((tile.x * 31 + i * 13) % (size - 2));
          const highlightY = y + ((tile.y * 37 + i * 17) % (size - 2));
          const highlightSize = Math.max(1, Math.floor(size / 20));
          ctx.fillRect(highlightX, highlightY, highlightSize, highlightSize);
        }
        
        // Neve sui picchi (occasionale)
        if ((tile.x + tile.y) % 7 === 0) {
          ctx.fillStyle = '#f0f8ff';
          const snowX = x + size / 4;
          const snowY = y + size / 6;
          const snowSize = Math.max(2, Math.floor(size / 6));
          ctx.fillRect(snowX, snowY, snowSize, snowSize);
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
        // Strada sterrata dettagliata
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(x, y, size, size);
        
        // Texture strada con solchi
        ctx.fillStyle = '#654321';
        const roadLineCount = Math.max(2, Math.floor(size / 8));
        for (let i = 0; i < roadLineCount; i++) {
          const lineY = y + (i * size / roadLineCount);
          const lineHeight = Math.max(1, Math.floor(size / 16));
          ctx.fillRect(x, lineY, size, lineHeight);
        }
        
        // Solchi delle ruote
        ctx.fillStyle = '#4a3c1a';
        const rutWidth = Math.max(2, Math.floor(size / 6));
        ctx.fillRect(x + size / 4, y, rutWidth, size);
        ctx.fillRect(x + (3 * size / 4) - rutWidth, y, rutWidth, size);
        
        // Sassi e detriti
        ctx.fillStyle = '#696969';
        const stoneCount = Math.max(4, Math.floor(size / 4));
        for (let i = 0; i < stoneCount; i++) {
          const stoneX = x + ((tile.x * 31 + i * 13) % (size - 2));
          const stoneY = y + ((tile.y * 37 + i * 11) % (size - 2));
          const stoneSize = Math.max(1, Math.floor(size / 16));
          ctx.fillRect(stoneX, stoneY, stoneSize, stoneSize);
        }
        
        // Bordi erbosi
        ctx.fillStyle = '#228b22';
        const grassBorderSize = Math.max(1, Math.floor(size / 12));
        // Bordo sinistro
        for (let i = 0; i < size / 4; i++) {
          if ((tile.x + tile.y + i) % 4 === 0) {
            ctx.fillRect(x, y + i * 4, grassBorderSize, grassBorderSize);
          }
        }
        // Bordo destro
        for (let i = 0; i < size / 4; i++) {
          if ((tile.x + tile.y + i) % 5 === 0) {
            ctx.fillRect(x + size - grassBorderSize, y + i * 4, grassBorderSize, grassBorderSize);
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
    
    // Massi sparsi sui prati (5% probabilità)
    if (tile.type === 'grass' && decorationSeed < 5) {
      ctx.fillStyle = '#708090';
      const boulderSize = Math.max(3, Math.floor(size / 4));
      const boulderX = x + size / 3;
      const boulderY = y + size / 3;
      ctx.fillRect(boulderX, boulderY, boulderSize, boulderSize);
      // Ombra del masso
      ctx.fillStyle = '#556b6b';
      ctx.fillRect(boulderX + 1, boulderY + boulderSize, boulderSize, Math.max(1, boulderSize / 3));
    }
    
    // Cespugli sui prati (8% probabilità)
    if (tile.type === 'grass' && decorationSeed >= 20 && decorationSeed < 28) {
      ctx.fillStyle = '#228b22';
      const bushSize = Math.max(2, Math.floor(size / 5));
      const bushX = x + ((tile.x * 17) % (size - bushSize));
      const bushY = y + ((tile.y * 19) % (size - bushSize));
      // Cespuglio circolare stilizzato
      ctx.fillRect(bushX, bushY + bushSize/2, bushSize, bushSize/2);
      ctx.fillRect(bushX + bushSize/4, bushY, bushSize/2, bushSize);
      
      // Bacche rosse occasionali
      if (decorationSeed % 7 === 0) {
        ctx.fillStyle = '#dc143c';
        const berrySize = Math.max(1, Math.floor(size / 20));
        ctx.fillRect(bushX + bushSize/2, bushY + bushSize/3, berrySize, berrySize);
      }
    }
    
    // Funghi nelle foreste (12% probabilità)
    if (tile.type === 'forest' && decorationSeed >= 35 && decorationSeed < 47) {
      const mushroomX = x + ((tile.x * 23) % (size - 4));
      const mushroomY = y + ((tile.y * 29) % (size - 4));
      const mushroomSize = Math.max(2, Math.floor(size / 8));
      
      // Gambo
      ctx.fillStyle = '#f5deb3';
      ctx.fillRect(mushroomX + mushroomSize/3, mushroomY + mushroomSize, mushroomSize/3, mushroomSize);
      
      // Cappello
      ctx.fillStyle = decorationSeed % 3 === 0 ? '#dc143c' : '#8b4513'; // Rosso o marrone
      ctx.fillRect(mushroomX, mushroomY, mushroomSize, mushroomSize/2);
      
      // Puntini bianchi sui funghi rossi
      if (decorationSeed % 3 === 0) {
        ctx.fillStyle = '#ffffff';
        const spotSize = Math.max(1, Math.floor(size / 32));
        ctx.fillRect(mushroomX + mushroomSize/4, mushroomY + mushroomSize/4, spotSize, spotSize);
        ctx.fillRect(mushroomX + (3*mushroomSize)/4, mushroomY + mushroomSize/3, spotSize, spotSize);
      }
    }
    
    // Cristalli di ghiaccio sulle montagne (7% probabilità)
    if (tile.type === 'mountain' && decorationSeed >= 50 && decorationSeed < 57) {
      ctx.fillStyle = '#b0e0e6';
      const crystalX = x + ((tile.x * 31) % (size - 3));
      const crystalY = y + ((tile.y * 37) % (size - 3));
      const crystalSize = Math.max(2, Math.floor(size / 6));
      
      // Cristallo a forma di diamante stilizzato
      ctx.fillRect(crystalX + crystalSize/2, crystalY, crystalSize/2, crystalSize/2);
      ctx.fillRect(crystalX, crystalY + crystalSize/2, crystalSize, crystalSize/2);
      ctx.fillRect(crystalX + crystalSize/2, crystalY + crystalSize, crystalSize/2, crystalSize/2);
      
      // Riflesso cristallo
      ctx.fillStyle = '#ffffff';
      const gleamSize = Math.max(1, Math.floor(crystalSize / 4));
      ctx.fillRect(crystalX + crystalSize/3, crystalY + crystalSize/3, gleamSize, gleamSize);
    }
    
    // Ninfee sui laghi (10% probabilità)
    if (tile.type === 'lake' && decorationSeed >= 65 && decorationSeed < 75) {
      const lilyX = x + ((tile.x * 41) % (size - 4));
      const lilyY = y + ((tile.y * 43) % (size - 4));
      const lilySize = Math.max(3, Math.floor(size / 5));
      
      // Foglia di ninfea
      ctx.fillStyle = '#228b22';
      ctx.fillRect(lilyX, lilyY, lilySize, lilySize);
      
      // Taglio nella foglia per realismo
      ctx.fillStyle = '#4682b4'; // Colore acqua
      ctx.fillRect(lilyX + lilySize - 1, lilyY, 1, lilySize/2);
      
      // Fiore occasionale
      if (decorationSeed % 5 === 0) {
        ctx.fillStyle = '#ffb6c1';
        const flowerSize = Math.max(1, Math.floor(lilySize / 3));
        ctx.fillRect(lilyX + lilySize/2, lilyY + lilySize/2, flowerSize, flowerSize);
      }
    }
    
    // Uccelli nel cielo (3% probabilità, solo su tile vuoti)
    if (decorationSeed >= 85 && decorationSeed < 88 && tile.type === 'grass') {
      ctx.fillStyle = '#2f4f4f';
      const birdX = x + ((tile.x * 47) % (size - 2));
      const birdY = y + ((tile.y * 53) % (size/2)); // Solo nella parte alta del tile
      const birdSize = Math.max(1, Math.floor(size / 20));
      
      // Uccello stilizzato (due piccoli tratti)
      ctx.fillRect(birdX, birdY, birdSize * 2, birdSize);
      ctx.fillRect(birdX + birdSize * 3, birdY, birdSize * 2, birdSize);
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

    // Draw road foundation (darkest - terra battuta)
    ctx.strokeStyle = '#4a3c1a';
    ctx.lineWidth = edgeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw road border (medium - bordo strada)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = borderWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw main road path (lighter - sentiero principale)
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = roadWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw central worn path (lightest - traccia centrale consumata)
    ctx.strokeStyle = '#a0861a';
    ctx.lineWidth = Math.max(4, roadWidth / 2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Add road texture details
    const roadLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const stepCount = Math.floor(roadLength / 20);
    
    for (let i = 0; i < stepCount; i++) {
      const t = i / stepCount;
      const currentX = startX + t * (endX - startX);
      const currentY = startY + t * (endY - startY);
      
      // Small rocks and debris on road edges
      ctx.fillStyle = '#654321';
      if (Math.random() > 0.7) {
        const offsetX = (Math.random() - 0.5) * roadWidth;
        const offsetY = (Math.random() - 0.5) * roadWidth;
        const debrisSize = Math.max(1, Math.floor(roadWidth / 8));
        ctx.fillRect(currentX + offsetX, currentY + offsetY, debrisSize, debrisSize);
      }
    }
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