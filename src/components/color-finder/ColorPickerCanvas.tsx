import React, { useRef, useCallback, useEffect, useState } from 'react';
import { hslToHex } from '@/lib/colorMatchUtils';

interface ColorPickerCanvasProps {
  selectedHex: string;
  onColorChange: (hex: string) => void;
}

export function ColorPickerCanvas({ selectedHex, onColorChange }: ColorPickerCanvasProps) {
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const slCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingSL, setIsDraggingSL] = useState(false);
  const debounceRef = useRef<number>(0);

  // Draw hue bar
  useEffect(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    for (let i = 0; i <= 360; i += 30) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Draw indicator
    const x = (hue / 360) * w;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 4, 0, 8, h, 2);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 3, 1, 6, h - 2, 2);
    ctx.stroke();
  }, [hue]);

  // Draw saturation-lightness square
  useEffect(() => {
    const canvas = slCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Fill with colors
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const s = (x / w) * 100;
        const l = 100 - (y / h) * 100;
        ctx.fillStyle = `hsl(${hue}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw crosshair indicator
    const cx = (saturation / 100) * w;
    const cy = ((100 - lightness) / 100) * h;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.stroke();
  }, [hue, saturation, lightness]);

  const emitColor = useCallback((h: number, s: number, l: number) => {
    cancelAnimationFrame(debounceRef.current);
    debounceRef.current = requestAnimationFrame(() => {
      const hex = hslToHex(h, s, l);
      onColorChange(hex);
    });
  }, [onColorChange]);

  const handleHueInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const newHue = Math.round((x / rect.width) * 360);
    setHue(newHue);
    emitColor(newHue, saturation, lightness);
  }, [saturation, lightness, emitColor]);

  const handleSLInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = slCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const newS = Math.round((x / rect.width) * 100);
    const newL = Math.round(100 - (y / rect.height) * 100);
    setSaturation(newS);
    setLightness(newL);
    emitColor(hue, newS, newL);
  }, [hue, emitColor]);

  // Global mouse/touch up handlers
  useEffect(() => {
    const handleUp = () => {
      setIsDraggingHue(false);
      setIsDraggingSL(false);
    };
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDraggingHue) {
        const canvas = hueCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const newHue = Math.round((x / rect.width) * 360);
        setHue(newHue);
        emitColor(newHue, saturation, lightness);
      }
      if (isDraggingSL) {
        const canvas = slCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        const newS = Math.round((x / rect.width) * 100);
        const newL = Math.round(100 - (y / rect.height) * 100);
        setSaturation(newS);
        setLightness(newL);
        emitColor(hue, newS, newL);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [isDraggingHue, isDraggingSL, hue, saturation, lightness, emitColor]);

  return (
    <div className="space-y-3">
      {/* SL Square */}
      <canvas
        ref={slCanvasRef}
        width={280}
        height={200}
        className="w-full rounded-lg cursor-crosshair border border-border/50"
        style={{ touchAction: 'none', aspectRatio: '280/200' }}
        onMouseDown={(e) => { setIsDraggingSL(true); handleSLInteraction(e); }}
        onTouchStart={(e) => { e.preventDefault(); setIsDraggingSL(true); handleSLInteraction(e); }}
      />
      {/* Hue Bar */}
      <canvas
        ref={hueCanvasRef}
        width={280}
        height={20}
        className="w-full h-5 rounded-full cursor-pointer border border-border/50"
        style={{ touchAction: 'none' }}
        onMouseDown={(e) => { setIsDraggingHue(true); handleHueInteraction(e); }}
        onTouchStart={(e) => { e.preventDefault(); setIsDraggingHue(true); handleHueInteraction(e); }}
      />
    </div>
  );
}
