"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const CELL_SIZE = 4;
const WIDTH = 150; // 150 * 4 = 600px
const HEIGHT = 100; // 100 * 4 = 400px

type Cell = 0 | 1 | 2 | 3; // 0 empty, 1 sand, 2 water, 3 stone

export default function SandCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Cell[][]>(Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0)));
  const [selected, setSelected] = useState<Cell>(1);
  const [drawing, setDrawing] = useState(false);

  const colors = {
    0: "#000000",
    1: "#FFD700", // sand
    2: "#1E90FF", // water
    3: "#808080", // stone
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
    // Process from bottom to top
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
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
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
