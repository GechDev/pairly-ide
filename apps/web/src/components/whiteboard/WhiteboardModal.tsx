'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pen,
  Square,
  Circle,
  Minus,
  Type,
  Eraser,
  RotateCcw,
  Trash2,
  Download,
  X,
  Palette,
} from 'lucide-react';

export interface WhiteboardElement {
  id: string;
  type: 'pen' | 'rect' | 'circle' | 'line' | 'text' | 'eraser';
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  text?: string;
  authorId?: string;
  createdAt?: number;
}

export interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  elements: WhiteboardElement[];
  onAddElement: (element: WhiteboardElement) => void;
  onClearElements: () => void;
}

const COLOR_PALETTE = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'White', value: '#ffffff' },
  { name: 'Slate', value: '#64748b' },
];

const STROKE_WIDTHS = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
];

export function WhiteboardModal({
  isOpen,
  onClose,
  roomCode,
  elements,
  onAddElement,
  onClearElements,
}: WhiteboardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'rect' | 'circle' | 'line' | 'text' | 'eraser'>('pen');
  const [color, setColor] = useState('#10b981');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });

  // Dynamically match canvas size to container
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setCanvasDimensions({ width: clientWidth, height: clientHeight });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isOpen]);

  // Main canvas rendering function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle technical grid dots
    ctx.fillStyle = '#1e293b';
    const gridSize = 24;
    for (let x = gridSize; x < canvas.width; x += gridSize) {
      for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Render committed elements
    elements.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'pen' && el.points && el.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (
        el.type === 'rect' &&
        el.x !== undefined &&
        el.y !== undefined &&
        el.width !== undefined &&
        el.height !== undefined
      ) {
        ctx.beginPath();
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (
        el.type === 'circle' &&
        el.x !== undefined &&
        el.y !== undefined &&
        el.width !== undefined
      ) {
        ctx.beginPath();
        ctx.arc(el.x, el.y, Math.abs(el.width), 0, 2 * Math.PI);
        ctx.stroke();
      } else if (
        el.type === 'line' &&
        el.x !== undefined &&
        el.y !== undefined &&
        el.width !== undefined &&
        el.height !== undefined
      ) {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.width, el.height);
        ctx.stroke();
      } else if (el.type === 'text' && el.x !== undefined && el.y !== undefined && el.text) {
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.fillText(el.text, el.x, el.y);
      }
    });

    // Render active drawing preview
    if (isDrawing && tool === 'pen' && currentPoints.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
    }
  }, [elements, isDrawing, tool, currentPoints, color, strokeWidth]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, canvasDimensions]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (tool === 'text') {
      setTextPos(coords);
      return;
    }

    setIsDrawing(true);
    setStartPos(coords);
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentPoints([coords]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    if (tool === 'pen') {
      setCurrentPoints((prev) => [...prev, coords]);
    } else if (tool === 'eraser') {
      // In eraser mode, draw with dark background color
      setCurrentPoints((prev) => [...prev, coords]);
    } else if (startPos && canvasRef.current) {
      // Dynamic shape ghost preview
      renderCanvas();
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'rect') {
          ctx.beginPath();
          ctx.strokeRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
        } else if (tool === 'circle') {
          const radius = Math.hypot(coords.x - startPos.x, coords.y - startPos.y);
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (tool === 'line') {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const coords = getCanvasCoords(e);
    const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (tool === 'pen' && currentPoints.length > 0) {
      onAddElement({
        id,
        type: 'pen',
        points: [...currentPoints, coords],
        color,
        strokeWidth,
        createdAt: Date.now(),
      });
      setCurrentPoints([]);
    } else if (tool === 'eraser' && currentPoints.length > 0) {
      onAddElement({
        id,
        type: 'pen',
        points: [...currentPoints, coords],
        color: '#020617',
        strokeWidth: strokeWidth * 3,
        createdAt: Date.now(),
      });
      setCurrentPoints([]);
    } else if (startPos) {
      if (tool === 'rect') {
        onAddElement({
          id,
          type: 'rect',
          x: Math.min(startPos.x, coords.x),
          y: Math.min(startPos.y, coords.y),
          width: Math.abs(coords.x - startPos.x),
          height: Math.abs(coords.y - startPos.y),
          color,
          strokeWidth,
          createdAt: Date.now(),
        });
      } else if (tool === 'circle') {
        const radius = Math.hypot(coords.x - startPos.x, coords.y - startPos.y);
        onAddElement({
          id,
          type: 'circle',
          x: startPos.x,
          y: startPos.y,
          width: radius,
          color,
          strokeWidth,
          createdAt: Date.now(),
        });
      } else if (tool === 'line') {
        onAddElement({
          id,
          type: 'line',
          x: startPos.x,
          y: startPos.y,
          width: coords.x,
          height: coords.y,
          color,
          strokeWidth,
          createdAt: Date.now(),
        });
      }
      setStartPos(null);
    }
  };

  const handleAddText = () => {
    if (!textPos || !textInput.trim()) {
      setTextPos(null);
      setTextInput('');
      return;
    }

    onAddElement({
      id: `el_text_${Date.now()}`,
      type: 'text',
      x: textPos.x,
      y: textPos.y,
      color,
      strokeWidth,
      text: textInput.trim(),
      createdAt: Date.now(),
    });

    setTextPos(null);
    setTextInput('');
  };

  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${roomCode}-${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="whiteboard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-6xl h-[88vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Top Floating Control Bar */}
        <header className="h-14 px-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3 select-none z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-100">Architecture Whiteboard</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {roomCode}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            {/* Tools Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                data-testid="tool-pen"
                onClick={() => setTool('pen')}
                title="Pen / Freehand"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  tool === 'pen'
                    ? 'bg-brand-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Pen className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="tool-line"
                onClick={() => setTool('line')}
                title="Straight Line / Vector"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  tool === 'line'
                    ? 'bg-brand-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="tool-rect"
                onClick={() => setTool('rect')}
                title="Rectangle / Architecture Block"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  tool === 'rect'
                    ? 'bg-brand-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="tool-circle"
                onClick={() => setTool('circle')}
                title="Circle / Node"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  tool === 'circle'
                    ? 'bg-brand-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="tool-text"
                onClick={() => setTool('text')}
                title="Text Annotation"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  tool === 'text'
                    ? 'bg-brand-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid="tool-eraser"
                onClick={() => setTool('eraser')}
                title="Eraser"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  tool === 'eraser'
                    ? 'bg-brand-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center: Color & Stroke Width */}
          <div className="flex items-center gap-3">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.name}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    color === c.value
                      ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900'
                      : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {STROKE_WIDTHS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStrokeWidth(s.value)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                    strokeWidth === s.value
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="whiteboard-clear-btn"
              onClick={onClearElements}
              title="Clear Canvas"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Clear</span>
            </button>

            <button
              type="button"
              data-testid="whiteboard-export-btn"
              onClick={handleExportPng}
              title="Export as High-Resolution PNG"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PNG</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close Whiteboard"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Canvas Body */}
        <div ref={containerRef} className="relative flex-1 bg-slate-950 overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            data-testid="whiteboard-canvas"
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full block"
          />

          {/* Text input prompt overlay when clicking with text tool */}
          {textPos && (
            <div
              className="absolute z-20 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl flex items-center gap-2"
              style={{ left: textPos.x, top: textPos.y }}
            >
              <input
                type="text"
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddText();
                  if (e.key === 'Escape') setTextPos(null);
                }}
                placeholder="Type annotation and press Enter..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-sans w-56"
              />
              <button
                type="button"
                onClick={handleAddText}
                className="px-2 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-500 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setTextPos(null)}
                className="p-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
