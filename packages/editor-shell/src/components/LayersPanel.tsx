import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NodeData } from '@design-editor/core';
import { useEditorStore } from '../store/editor';
import './LayersPanel.css';

interface SortableLayerItemProps {
  node: NodeData;
  depth: number;
  parentId: string | null;
  index: number;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
}

function SortableLayerItem({
  node,
  depth,
  parentId: _parentId,
  index: _index,
  collapsedIds,
  onToggleCollapse,
}: SortableLayerItemProps) {
  const selection = useEditorStore((state) => state.selection);
  const hoveredId = useEditorStore((state) => state.hoveredId);
  const setSelection = useEditorStore((state) => state.setSelection);
  const setHoveredId = useEditorStore((state) => state.setHoveredId);
  const toggleVisibility = useEditorStore((state) => state.toggleVisibility);
  const toggleLocked = useEditorStore((state) => state.toggleLocked);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selection.includes(node.id);
  const isHovered = hoveredId === node.id;
  const isVisible = node.visible !== false;
  const isLocked = node.locked === true;
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isCollapsed = collapsedIds.has(node.id);

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelection([node.id]);
  };

  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleVisibility(node.id);
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLocked(node.id);
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCollapse(node.id);
  };

  return (
    <div ref={setNodeRef} style={style} className="layer-item">
      <div
        className={`layer-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${!isVisible ? 'hidden-layer' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleRowClick}
        onMouseEnter={() => setHoveredId(node.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <button
          className="layer-collapse-btn"
          onClick={handleCollapseClick}
          disabled={!hasChildren}
        >
          {hasChildren ? (isCollapsed ? '▶' : '▼') : '─'}
        </button>
        <span className="layer-name" {...attributes} {...listeners}>
          {node.type}
        </span>
        <div className="layer-actions">
          <button
            className={`layer-action-btn ${isLocked ? 'active' : ''}`}
            onClick={handleLockClick}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            {isLocked ? '🔒' : '🔓'}
          </button>
          <button
            className={`layer-action-btn ${!isVisible ? 'active' : ''}`}
            onClick={handleVisibilityClick}
            title={isVisible ? 'Hide' : 'Show'}
          >
            {isVisible ? '👁' : '👁‍🗨'}
          </button>
        </div>
      </div>
      {hasChildren && !isCollapsed && (
        <LayerChildren
          children={node.children as NodeData[]}
          depth={depth + 1}
          parentId={node.id}
          collapsedIds={collapsedIds}
          onToggleCollapse={onToggleCollapse}
        />
      )}
    </div>
  );
}

interface LayerChildrenProps {
  children: NodeData[];
  depth: number;
  parentId: string;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
}

function LayerChildren({
  children,
  depth,
  parentId,
  collapsedIds,
  onToggleCollapse,
}: LayerChildrenProps) {
  const reorderNode = useEditorStore((state) => state.reorderNode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = children.findIndex((c) => c.id === active.id);
    const newIndex = children.findIndex((c) => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderNode(parentId, oldIndex, newIndex);
    }
  };

  return (
    <div className="layer-children">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={children.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {children.map((child, index) => (
            <SortableLayerItem
              key={child.id}
              node={child}
              depth={depth}
              parentId={parentId}
              index={index}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export function LayersPanel() {
  const document = useEditorStore((state) => state.document);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const hasChildren = Array.isArray(document.children) && document.children.length > 0;
  const isCollapsed = collapsedIds.has(document.id);

  return (
    <div className="layers-panel">
      <div className="panel-header">Layers</div>
      <div className="layers-list">
        <div className="layer-item">
          <div
            className="layer-row root-layer"
            style={{ paddingLeft: 8 }}
          >
            <button
              className="layer-collapse-btn"
              onClick={() => toggleCollapse(document.id)}
              disabled={!hasChildren}
            >
              {hasChildren ? (isCollapsed ? '▶' : '▼') : '─'}
            </button>
            <span className="layer-name">{document.meta?.name || document.type}</span>
          </div>
          {hasChildren && !isCollapsed && (
            <LayerChildren
              children={document.children as NodeData[]}
              depth={1}
              parentId={document.id}
              collapsedIds={collapsedIds}
              onToggleCollapse={toggleCollapse}
            />
          )}
        </div>
      </div>
    </div>
  );
}
