import { Block, GRID_COLS, MAX_VALUE } from "./types";

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createRow = (rowIdx: number): Block[] => {
  return Array.from({ length: GRID_COLS }, (_, colIdx) => ({
    id: generateId(),
    value: Math.floor(Math.random() * MAX_VALUE) + 1,
    row: rowIdx,
    col: colIdx,
  }));
};

export const generateTarget = (mode: 'classic' | 'time', level: number): number => {
  // Base target between 10 and 20, increases slightly with level
  const base = 10 + Math.floor(Math.random() * 10);
  const levelBonus = Math.floor(level / 2);
  return base + levelBonus;
};
