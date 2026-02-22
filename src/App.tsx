/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  RotateCcw, 
  Play, 
  Timer, 
  Zap, 
  AlertCircle,
  Pause,
  Home
} from 'lucide-react';
import { 
  Block, 
  GameMode, 
  GRID_ROWS, 
  GRID_COLS, 
  INITIAL_ROWS, 
  TIME_LIMIT 
} from './types';
import { createRow, generateTarget, generateId } from './utils';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [grid, setGrid] = useState<Block[][]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Initialize game
  const startGame = (selectedMode: GameMode) => {
    const initialGrid: Block[][] = Array.from({ length: GRID_ROWS }, () => []);
    // Fill bottom INITIAL_ROWS
    for (let r = GRID_ROWS - INITIAL_ROWS; r < GRID_ROWS; r++) {
      initialGrid[r] = createRow(r);
    }
    
    setGrid(initialGrid);
    setMode(selectedMode);
    setTarget(generateTarget(selectedMode, 1));
    setScore(0);
    setLevel(1);
    setTimeLeft(TIME_LIMIT);
    setSelectedIds([]);
    setGameState('playing');
    setIsPaused(false);
  };

  const gameOver = useCallback(() => {
    setGameState('gameover');
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  const addRow = useCallback(() => {
    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      // Shift all rows up
      for (let r = 0; r < GRID_ROWS - 1; r++) {
        newGrid[r] = newGrid[r + 1].map(b => ({ ...b, row: r }));
      }
      // Add new row at bottom
      newGrid[GRID_ROWS - 1] = createRow(GRID_ROWS - 1);
      return newGrid;
    });
    setTimeLeft(TIME_LIMIT);
  }, []);

  // Monitor for game over
  useEffect(() => {
    if (gameState === 'playing' && grid[0]?.some(b => b)) {
      gameOver();
    }
  }, [grid, gameState, gameOver]);

  // Handle selection and sum logic
  const toggleBlock = (block: Block) => {
    if (gameState !== 'playing' || isPaused) return;

    setSelectedIds(prev => {
      if (prev.includes(block.id)) {
        return prev.filter(id => id !== block.id);
      }
      return [...prev, block.id];
    });
  };

  const currentSum = useMemo(() => {
    let sum = 0;
    grid.flat().forEach(block => {
      if (selectedIds.includes(block.id)) sum += block.value;
    });
    return sum;
  }, [grid, selectedIds]);

  // Check sum effect
  useEffect(() => {
    if (currentSum === target && target > 0) {
      // Success!
      const clearedCount = selectedIds.length;
      setScore(s => s + (target * clearedCount));
      
      // Remove blocks and apply gravity
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => 
          row.filter(block => !selectedIds.includes(block.id))
        );

        // Gravity: blocks fall down within their columns
        const columns: Block[][] = Array.from({ length: GRID_COLS }, () => []);
        newGrid.flat().forEach(block => {
          columns[block.col].push(block);
        });

        const finalGrid: Block[][] = Array.from({ length: GRID_ROWS }, () => []);
        columns.forEach((colBlocks, colIdx) => {
          // Sort blocks by their original row to maintain relative order, 
          // then place them starting from the bottom
          colBlocks.sort((a, b) => b.row - a.row);
          colBlocks.forEach((block, i) => {
            const newRow = GRID_ROWS - 1 - i;
            finalGrid[newRow][colIdx] = { ...block, row: newRow, col: colIdx };
          });
        });

        // Fill empty slots with null/undefined equivalent (empty array elements in our structure)
        return finalGrid.map(row => row.filter(b => b));
      });

      setSelectedIds([]);
      setTarget(generateTarget(mode, level));
      
      if (mode === 'classic') {
        addRow();
      } else {
        setTimeLeft(TIME_LIMIT);
      }

      // Level up every 500 points
      if (score > level * 500) {
        setLevel(l => l + 1);
      }
    } else if (currentSum > target) {
      // Failed - clear selection
      setSelectedIds([]);
    }
  }, [currentSum, target, selectedIds, mode, addRow, level, score]);

  // Timer for Time Mode
  useEffect(() => {
    if (gameState === 'playing' && mode === 'time' && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            addRow();
            return TIME_LIMIT;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, mode, isPaused, addRow]);

  // Auto-add row in Classic mode periodically if user is too slow? 
  // Usually Blokmatik adds a row after every successful move.
  // Let's stick to the rule: Classic = add row on success. Time = add row on timer.

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/5"
        >
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center rotate-3 shadow-lg">
                <Zap className="text-white w-10 h-10" />
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-black mb-2 italic">SUMBURST</h1>
            <p className="text-black/50 font-medium mb-8">Master the math. Clear the grid.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => startGame('classic')}
                className="w-full group relative bg-black text-white py-5 rounded-2xl font-bold text-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Play className="w-6 h-6 fill-current" />
                CLASSIC MODE
              </button>
              
              <button 
                onClick={() => startGame('time')}
                className="w-full group relative border-2 border-black py-5 rounded-2xl font-bold text-xl transition-all hover:bg-black hover:text-white active:scale-95 flex items-center justify-center gap-3"
              >
                <Timer className="w-6 h-6" />
                TIME ATTACK
              </button>
            </div>

            {highScore > 0 && (
              <div className="mt-8 pt-8 border-t border-black/5 flex items-center justify-center gap-2 text-black/60 font-bold">
                <Trophy className="w-5 h-5 text-amber-500" />
                BEST: {highScore}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-black font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="max-w-2xl mx-auto pt-8 px-4 flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setGameState('menu')}
            className="p-3 bg-white rounded-xl shadow-sm border border-black/5 hover:bg-black hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Score</div>
            <div className="text-2xl font-black tabular-nums">{score}</div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Target</div>
          <motion.div 
            key={target}
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-24 h-24 bg-white border-4 border-black brutal-shadow flex items-center justify-center text-5xl font-black"
          >
            {target}
          </motion.div>
          <div className="mt-2 flex gap-1">
            {selectedIds.length > 0 && (
              <div className="text-sm font-bold bg-white px-3 py-1 rounded-full border border-black/5 shadow-sm">
                Sum: <span className={currentSum > target ? 'text-red-500' : 'text-black'}>{currentSum}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
              {mode === 'time' ? 'Time' : 'Level'}
            </div>
            <div className={`text-2xl font-black tabular-nums ${mode === 'time' && timeLeft <= 3 ? 'text-red-500 animate-pulse' : ''}`}>
              {mode === 'time' ? timeLeft : level}
            </div>
          </div>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-3 bg-white rounded-xl shadow-sm border border-black/5 hover:bg-black hover:text-white transition-colors"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="max-w-md mx-auto px-4 pb-12">
        <div 
          className="relative aspect-[6/10] bg-white rounded-3xl shadow-2xl border-4 border-black overflow-hidden grid grid-cols-6 grid-rows-10 p-2 gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)` }}
        >
          {/* Grid Background Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                 backgroundSize: '16.66% 10%' 
               }} 
          />

          <AnimatePresence mode="popLayout">
            {grid.map((row, rIdx) => 
              row.map((block) => (
                <motion.button
                  key={block.id}
                  layoutId={block.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    gridRow: block.row + 1,
                    gridColumn: block.col + 1
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => toggleBlock(block)}
                  className={`
                    relative w-full h-full rounded-xl flex items-center justify-center text-2xl font-black transition-all brutal-shadow-sm border-2 border-black
                    ${selectedIds.includes(block.id) 
                      ? 'bg-black text-white -translate-y-1 translate-x-1 shadow-none' 
                      : 'bg-white text-black hover:-translate-y-0.5 hover:translate-x-0.5 active:translate-y-0 active:translate-x-0'}
                  `}
                  style={{
                    gridRow: block.row + 1,
                    gridColumn: block.col + 1
                  }}
                >
                  {block.value}
                  {selectedIds.includes(block.id) && (
                    <motion.div 
                      layoutId={`check-${block.id}`}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                    >
                      <div className="w-2 h-2 bg-black rounded-full" />
                    </motion.div>
                  )}
                </motion.button>
              ))
            )}
          </AnimatePresence>

          {/* Danger Zone Indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
          {grid[1]?.some(b => b) && (
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute top-0 left-0 w-full h-[10%] bg-red-500/10 pointer-events-none"
            />
          )}

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
              >
                <Pause className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-2xl font-black uppercase tracking-widest">Paused</h2>
                <button 
                  onClick={() => setIsPaused(false)}
                  className="mt-6 px-8 py-3 bg-black text-white rounded-2xl font-bold flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" /> RESUME
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-black/40 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-black/10" />
          Select numbers to sum to {target}
          <div className="h-px flex-1 bg-black/10" />
        </div>
      </main>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl border border-black/5"
            >
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black mb-2 italic">GAME OVER</h2>
              <p className="text-black/50 font-medium mb-8">The blocks reached the top!</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#F5F5F0] p-4 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Score</div>
                  <div className="text-2xl font-black">{score}</div>
                </div>
                <div className="bg-[#F5F5F0] p-4 rounded-2xl">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Best</div>
                  <div className="text-2xl font-black">{highScore}</div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => startGame(mode)}
                  className="w-full bg-black text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <RotateCcw className="w-6 h-6" /> TRY AGAIN
                </button>
                <button 
                  onClick={() => setGameState('menu')}
                  className="w-full border-2 border-black py-4 rounded-2xl font-bold text-lg hover:bg-black hover:text-white transition-all"
                >
                  MAIN MENU
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CSS for custom fonts if needed, though Inter is default */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}} />
    </div>
  );
}
