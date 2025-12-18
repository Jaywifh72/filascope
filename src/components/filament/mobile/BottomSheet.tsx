import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  snapPoints?: number[]; // percentages [0.5, 0.9]
  initialSnap?: number; // index of initial snap point
  children: React.ReactNode;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  children,
  className,
}) => {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  // Handle touch start on drag handle
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    setDragY(Math.max(0, diff)); // Only allow dragging down
  }, [isDragging]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    const screenHeight = window.innerHeight;
    const currentHeight = snapPoints[currentSnap] * screenHeight;
    const newHeight = currentHeight - dragY;
    const newHeightPercent = newHeight / screenHeight;

    // Find closest snap point
    let closestSnap = 0;
    let minDiff = Math.abs(newHeightPercent - snapPoints[0]);
    
    snapPoints.forEach((snap, index) => {
      const diff = Math.abs(newHeightPercent - snap);
      if (diff < minDiff) {
        minDiff = diff;
        closestSnap = index;
      }
    });

    // If dragged down significantly, close
    if (newHeightPercent < snapPoints[0] - 0.15) {
      onClose();
    } else {
      setCurrentSnap(closestSnap);
    }

    setIsDragging(false);
    setDragY(0);
  }, [isDragging, dragY, currentSnap, snapPoints, onClose]);

  // Handle backdrop click
  const handleBackdropClick = () => {
    onClose();
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset snap when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(initialSnap);
      setDragY(0);
    }
  }, [isOpen, initialSnap]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sheetHeight = `${snapPoints[currentSnap] * 100}vh`;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl flex flex-col z-[1001]",
          "animate-in slide-in-from-bottom duration-300",
          !isDragging && "transition-all duration-300 ease-out",
          className
        )}
        style={{ 
          height: sheetHeight,
          maxHeight: '95vh',
          transform: `translateY(${dragY}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
          <h2 id="sheet-title" className="text-lg font-bold text-foreground">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Close"
            className="flex items-center justify-center w-11 h-11 bg-muted/50 rounded-xl text-muted-foreground active:bg-muted"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          {children}
        </div>

        {/* Safe area spacer for notched phones */}
        <div className="h-[env(safe-area-inset-bottom,0px)] flex-shrink-0" />
      </div>
    </>
  );
};

export default BottomSheet;
