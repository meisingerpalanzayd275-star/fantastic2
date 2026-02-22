
export type GameMode = 'classic' | 'time';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  grid: Block[][]; // grid[row][col]
  target: number;
  score: number;
  selectedIds: string[];
  gameOver: boolean;
  mode: GameMode;
  timeLeft: number; // For time mode
  level: number;
}

export const GRID_ROWS = 10;
export const GRID_COLS = 6;
export const INITIAL_ROWS = 4;
export const MAX_VALUE = 9;
export const TIME_LIMIT = 10; // seconds per round in time mode
