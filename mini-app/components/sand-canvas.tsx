"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const CELL_SIZE = 4;
const WIDTH = 150; // 150 * 4 = 600px
const HEIGHT = 100; // 100 * 4 = 400px

type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 empty, 1 sand, 2 water, 3 stone, 4 fire, 5 gas, 6 plant

export default function SandCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Cell[][]>(Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => {
      // Create a solid stone border on all four edges
      if (y === 0 || y === HEIGHT - 1 || x === 0 || x === WIDTH - 1) {
        return 3; // stone
      }
      return 0; // empty
    })
  ));
  const [selected, setSelected] = useState<Cell>(1);
  const [drawing, setDrawing] = useState(false);

  const colors = {
    0: "#000000",
    1: "#FFD700", // sand
    2: "#1E90FF", // water
    3: "#808080", // stone
    4: "#FF4500", // fire (red/orange neon)
    5: "#ADD8E6", // gas (light blue)
    6: "#32CD32", // plant (bright green)
  };

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, type: Cell) => {
    ctx.fillStyle = colors[type];
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, WIDTH * CELL_SIZE, HEIGHT * CELL_SIZE);
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const type = gridRef.current[y][x];
        if (type !== 0) {
          drawCell(ctx, x, y, type);
        }
      }
    }
  };

  const step = () => {
    const grid = gridRef.current;
    // Fire falls and evaporates adjacent water
    for (let y = HEIGHT - 1; y >= 0; y--) {
      for (let x = 0; x < WIDTH; x++) {
        const type = grid[y][x];
        if (type === 4) {
          // Fire moves down
          if (y + 1 < HEIGHT && grid[y + 1][x] === 0) {
            grid[y + 1][x] = 4;
            grid[y][x] = 0;
          } else {
            const dirs = [ -1, 1 ];
            for (const d of dirs) {
              const nx = x + d;
              if (nx >= 0 && nx < WIDTH && grid[y][nx] === 0) {
                grid[y][nx] = 4;
                grid[y][x] = 0;
                break;
              }
            }
          }
          // Evaporate adjacent water
          const neighbors = [
            [x, y - 1],
            [x, y + 1],
            [x - 1, y],
            [x + 1, y]
          ];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT && grid[ny][nx] === 2) {
              grid[ny][nx] = 5; // gas
            }
          }
          // Random decay
          if (Math.random() < 0.01) {
            grid[y][x] = 0;
          }
        }
      }
    }
    // Gas rises and condenses at top
    const copy = grid.map(row => [...row]);
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (copy[y][x] === 5) {
          if (y === 0) {
            grid[y][x] = 2; // condense to water
          } else if (grid[y - 1][x] === 0) {
            grid[y - 1][x] = 5;
            grid[y][x] = 0;
          } else {
            const dirs = [ -1, 1 ];
            for (const d of dirs) {
              const nx = x + d;
              if (nx >= 0 && nx < WIDTH && grid[y][nx] === 0) {
                grid[y][nx] = 5;
                grid[y][x] = 0;
                break;
              }
            }
          }
        }
      }
    }
    // Plant interactions
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const type = grid[y][x];
        if (type === 6) { // plant
          // Flammability: catch fire if adjacent to fire
          const fireNeighbors = [
            [x, y - 1],
            [x, y + 1],
            [x - 1, y],
            [x + 1, y]
          ];
          for (const [nx, ny] of fireNeighbors) {
            if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT && grid[ny][nx] === 4) {
              grid[y][x] = 4; // become fire
              break;
            }
          }
          // Growth: absorb water and grow new plant
          const waterNeighbors = [
            [x, y - 1],
            [x, y + 1],
            [x - 1, y],
            [x + 1, y]
          ];
          for (const [nx, ny] of waterNeighbors) {
            if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT && grid[ny][nx] === 2) {
              grid[ny][nx] = 0; // absorb water
              // find random adjacent empty spot to grow new plant
              const emptyNeighbors = [
                [x, y - 1],
                [x, y + 1],
                [x - 1, y],
                [x + 1, y]
              ].filter(([ex, ey]) => ex >= 0 && ex < WIDTH && ey >= 0 && ey < HEIGHT && grid[ey][ex] === 0);
              if (emptyNeighbors.length > 0) {
                const [ex, ey] = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                grid[ey][ex] = 6;
              }
              break;
            }
          }
        }
      }
    }
    // Sand and water fall
    for (let y = HEIGHT - 1; y >= 0; y--) {
      for (let x = 0; x < WIDTH; x++) {
        const type = grid[y][x];
        if (type === 1) {
          // Sand
          if (y + 1 < HEIGHT && grid[y + 1][x] === 0) {
            grid[y + 1][x] = 1;
            grid[y][x] = 0;
          } else {
            const dirs = [ -1, 1 ];
            for (const d of dirs) {
              const nx = x + d;
              if (nx >= 0 && nx < WIDTH && grid[y + 1][nx] === 0) {
                grid[y + 1][nx] = 1;
                grid[y][x] = 0;
                break;
              }
            }
          }
        } else if (type === 2) {
          // Water
          if (y + 1 < HEIGHT && grid[y + 1][x] === 0) {
            grid[y + 1][x] = 2;
            grid[y][x] = 0;
          } else {
            const dirs = [ -1, 1 ];
            for (const d of dirs) {
              const nx = x + d;
              if (nx >= 0 && nx < WIDTH && grid[y][nx] === 0) {
                grid[y][nx] = 2;
                grid[y][x] = 0;
                break;
              }
            }
          }
        }
      }
    }
  };

  const handleMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    // Ignore any interaction with the indestructible stone border
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    if (y === 0 || y === HEIGHT - 1 || x === 0 || x === WIDTH - 1) return;
    gridRef.current[y][x] = selected;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      step();
      drawGrid(ctx);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <Button variant={selected === 1 ? "default" : "outline"} onClick={() => setSelected(1)}>Sand</Button>
        <Button variant={selected === 2 ? "default" : "outline"} onClick={() => setSelected(2)}>Water</Button>
        <Button variant={selected === 3 ? "default" : "outline"} onClick={() => setSelected(3)}>Stone</Button>
        <Button variant={selected === 4 ? "default" : "outline"} onClick={() => setSelected(4)}>Fire</Button>
        <Button variant={selected === 0 ? "default" : "outline"} onClick={() => setSelected(0)}>Eraser</Button>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH * CELL_SIZE}
        height={HEIGHT * CELL_SIZE}
        className="border border-gray-700"
        onMouseDown={(e) => { setDrawing(true); handleMouse(e); }}
        onMouseMove={(e) => { if (drawing) handleMouse(e); }}
        onMouseUp={() => setDrawing(false)}
        onMouseLeave={() => setDrawing(false)}
      />
    </div>
  );
}
