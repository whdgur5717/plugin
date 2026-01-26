import { useState, useRef, type ReactNode } from 'react';
import { Resizable } from 're-resizable';
import type { NodeData, Position, Size } from '@design-editor/core';
import './NodeWrapper.css';

interface NodeWrapperProps {
  node: NodeData;
  isSelected: boolean;
  onSelect: (shiftKey: boolean) => void;
  onHover: (hovered: boolean) => void;
  onMove: (position: Position) => void;
  onResize: (size: Size) => void;
  children: ReactNode;
}

export function NodeWrapper({
  node,
  isSelected,
  onSelect,
  onHover,
  onMove,
  onResize,
  children,
}: NodeWrapperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const style = node.style ?? {};
  const width = (style.width as number) ?? 'auto';
  const height = (style.height as number) ?? 'auto';
  const isLocked = node.locked === true;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelect(e.shiftKey);

    // Locked nodes cannot be dragged
    if (isLocked) return;

    const nodeX = (style.left as number) ?? 0;
    const nodeY = (style.top as number) ?? 0;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX,
      nodeY,
    };

    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      onMove({
        x: dragStartRef.current.nodeX + dx,
        y: dragStartRef.current.nodeY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStop = (
    _e: MouseEvent | TouchEvent,
    _direction: string,
    _ref: HTMLElement,
    d: { width: number; height: number }
  ) => {
    const currentWidth = typeof width === 'number' ? width : 0;
    const currentHeight = typeof height === 'number' ? height : 0;

    onResize({
      width: currentWidth + d.width,
      height: currentHeight + d.height,
    });
  };

  return (
    <div
      ref={wrapperRef}
      className={`node-wrapper ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isLocked ? 'locked' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {isSelected && !isLocked ? (
        <Resizable
          size={{ width, height }}
          onResizeStop={handleResizeStop}
          enable={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
          handleClasses={{
            top: 'resize-handle resize-handle-n',
            right: 'resize-handle resize-handle-e',
            bottom: 'resize-handle resize-handle-s',
            left: 'resize-handle resize-handle-w',
            topRight: 'resize-handle resize-handle-ne',
            bottomRight: 'resize-handle resize-handle-se',
            bottomLeft: 'resize-handle resize-handle-sw',
            topLeft: 'resize-handle resize-handle-nw',
          }}
        >
          {children}
        </Resizable>
      ) : (
        children
      )}
    </div>
  );
}
