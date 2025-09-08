/**
 * Types and interfaces for map rendering
 */

import { MapNode } from '@/types/game';

export type { MapNode };

export type TerrainType = 'grass' | 'forest' | 'mountain' | 'lake' | 'road';

export interface MapTile {
  x: number;
  y: number;
  type: TerrainType;
}

export interface PathSegment {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export type NodeRect = {
  cx: number;
  cy: number;
  w: number;
  h: number;
  bgColor?: string;
  title?: string;
  emoji?: string;
  shortTitle?: string
};
