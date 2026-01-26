import { create } from 'zustand';
import type {
  EditorStore,
  EditorTool,
  DocumentNode,
  NodeData,
  Position,
  Size,
  ComponentDefinition,
  InstanceNode,
} from '@design-editor/core';
import type { CSSProperties } from 'react';

/**
 * 노드 트리에서 특정 노드를 찾는 헬퍼
 */
function findNode(root: NodeData, id: string): NodeData | null {
  if (root.id === id) return root;
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 노드 트리에서 특정 노드를 업데이트하는 헬퍼 (불변성 유지)
 */
function updateNodeInTree(
  root: NodeData,
  id: string,
  updates: Partial<NodeData>
): NodeData {
  if (root.id === id) {
    return { ...root, ...updates };
  }
  if (Array.isArray(root.children)) {
    return {
      ...root,
      children: root.children.map((child) => updateNodeInTree(child, id, updates)),
    };
  }
  return root;
}

/**
 * 노드 트리에서 특정 노드를 삭제하는 헬퍼 (불변성 유지)
 */
function removeNodeFromTree(root: NodeData, id: string): NodeData {
  if (Array.isArray(root.children)) {
    return {
      ...root,
      children: root.children
        .filter((child) => child.id !== id)
        .map((child) => removeNodeFromTree(child, id)),
    };
  }
  return root;
}

/**
 * 노드의 부모를 찾는 헬퍼
 */
function findParent(root: NodeData, id: string): NodeData | null {
  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      if (child.id === id) return root;
      const found = findParent(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 노드를 깊은 복사하며 새로운 ID 부여
 */
function cloneNodeWithNewIds(node: NodeData): NodeData {
  const newId = `${node.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cloned: NodeData = {
    ...node,
    id: newId,
  };
  if (Array.isArray(node.children)) {
    cloned.children = node.children.map(cloneNodeWithNewIds);
  }
  return cloned;
}

/**
 * 초기 문서 상태
 */
const initialDocument: DocumentNode = {
  id: 'root',
  type: 'Frame',
  style: {
    width: 400,
    height: 300,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  children: [
    {
      id: 'text-1',
      type: 'Text',
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
      },
      children: 'Hello, World!',
    },
  ],
  meta: {
    name: 'Untitled',
    createdAt: new Date().toISOString(),
  },
};

/**
 * 에디터 스토어
 */
export const useEditorStore = create<EditorStore>((set, get) => ({
  // 초기 상태
  document: initialDocument,
  components: [],
  selection: [],
  hoveredId: null,
  activeTool: 'select',
  zoom: 1,

  // 액션
  updateNode(id: string, updates: Partial<NodeData>) {
    set((state) => ({
      document: updateNodeInTree(state.document, id, updates) as DocumentNode,
    }));
  },

  addNode(parentId: string, node: NodeData, index?: number) {
    set((state) => {
      const parent = findNode(state.document, parentId);
      if (!parent) return state;

      const children = Array.isArray(parent.children) ? [...parent.children] : [];
      if (index !== undefined) {
        children.splice(index, 0, node);
      } else {
        children.push(node);
      }

      return {
        document: updateNodeInTree(state.document, parentId, { children }) as DocumentNode,
      };
    });
  },

  removeNode(id: string) {
    set((state) => ({
      document: removeNodeFromTree(state.document, id) as DocumentNode,
      selection: state.selection.filter((selectedId) => selectedId !== id),
    }));
  },

  moveNode(id: string, position: Position) {
    const node = findNode(get().document, id);
    if (!node) return;

    const currentStyle = node.style ?? {};
    get().updateNode(id, {
      style: {
        ...currentStyle,
        position: 'absolute',
        left: position.x,
        top: position.y,
      },
    });
  },

  resizeNode(id: string, size: Size) {
    const node = findNode(get().document, id);
    if (!node) return;

    const currentStyle = node.style ?? {};
    get().updateNode(id, {
      style: {
        ...currentStyle,
        width: size.width,
        height: size.height,
      },
    });
  },

  setSelection(ids: string[]) {
    set({ selection: ids });
  },

  toggleSelection(id: string) {
    set((state) => {
      const isSelected = state.selection.includes(id);
      if (isSelected) {
        return { selection: state.selection.filter((s) => s !== id) };
      } else {
        return { selection: [...state.selection, id] };
      }
    });
  },

  setHoveredId(id: string | null) {
    set({ hoveredId: id });
  },

  setActiveTool(tool: EditorTool) {
    set({ activeTool: tool });
  },

  setZoom(zoom: number) {
    set({ zoom: Math.max(0.1, Math.min(4, zoom)) });
  },

  reorderNode(parentId: string, fromIndex: number, toIndex: number) {
    set((state) => {
      const parent = findNode(state.document, parentId);
      if (!parent || !Array.isArray(parent.children)) return state;

      const children = [...parent.children];
      const [removed] = children.splice(fromIndex, 1);
      children.splice(toIndex, 0, removed);

      return {
        document: updateNodeInTree(state.document, parentId, { children })
      };
    });
  },

  toggleVisibility(id: string) {
    const node = findNode(get().document, id);
    if (!node) return;

    const currentVisible = node.visible !== false;
    get().updateNode(id, { visible: !currentVisible });
  },

  toggleLocked(id: string) {
    const node = findNode(get().document, id);
    if (!node) return;

    const currentLocked = node.locked === true;
    get().updateNode(id, { locked: !currentLocked });
  },

  duplicateNode(id: string) {
    const state = get();
    const node = findNode(state.document, id);
    if (!node || id === state.document.id) return; // 루트는 복제 불가

    const parent = findParent(state.document, id);
    if (!parent || !Array.isArray(parent.children)) return;

    const index = parent.children.findIndex((child) => child.id === id);
    if (index === -1) return;

    const cloned = cloneNodeWithNewIds(node);

    // 위치 약간 이동 (offset)
    if (cloned.style) {
      const left = (cloned.style.left as number) ?? 0;
      const top = (cloned.style.top as number) ?? 0;
      cloned.style = { ...cloned.style, left: left + 20, top: top + 20 };
    }

    state.addNode(parent.id, cloned, index + 1);
    state.setSelection([cloned.id]);
  },

  createComponent(nodeId: string, name: string): string | null {
    const state = get();
    const node = findNode(state.document, nodeId);
    if (!node || nodeId === state.document.id) return null;

    const componentId = `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // 컴포넌트 정의 생성
    const componentDef: ComponentDefinition = {
      id: componentId,
      name,
      root: cloneNodeWithNewIds(node),
      createdAt: new Date().toISOString(),
    };

    // 원본 노드를 인스턴스로 교체
    const instance: InstanceNode = {
      id: node.id,
      type: '__INSTANCE__',
      componentId,
      style: node.style,
    };

    set((s) => ({
      components: [...s.components, componentDef],
      document: updateNodeInTree(s.document, nodeId, instance as unknown as Partial<NodeData>) as DocumentNode,
    }));

    return componentId;
  },

  createInstance(componentId: string, parentId: string): string | null {
    const state = get();
    const component = state.components.find((c) => c.id === componentId);
    if (!component) return null;

    const parent = findNode(state.document, parentId);
    if (!parent) return null;

    const instanceId = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const instance: InstanceNode = {
      id: instanceId,
      type: '__INSTANCE__',
      componentId,
      style: {
        ...component.root.style,
        position: 'absolute',
        left: 100,
        top: 100,
      },
    };

    state.addNode(parentId, instance as unknown as NodeData);
    state.setSelection([instanceId]);

    return instanceId;
  },

  updateComponent(componentId: string, updates: Partial<NodeData>) {
    set((state) => ({
      components: state.components.map((comp) =>
        comp.id === componentId
          ? { ...comp, root: { ...comp.root, ...updates } }
          : comp
      ),
    }));
  },

  deleteComponent(componentId: string) {
    set((state) => ({
      components: state.components.filter((c) => c.id !== componentId),
    }));
  },

  setInstanceOverride(
    instanceId: string,
    targetNodeId: string,
    overrides: { props?: Record<string, unknown>; style?: CSSProperties; children?: string }
  ) {
    const node = findNode(get().document, instanceId) as InstanceNode | null;
    if (!node || node.type !== '__INSTANCE__') return;

    const currentOverrides = node.overrides ?? {};
    const newOverrides = {
      ...currentOverrides,
      [targetNodeId]: {
        ...currentOverrides[targetNodeId],
        ...overrides,
      },
    };

    get().updateNode(instanceId, { overrides: newOverrides } as unknown as Partial<NodeData>);
  },

  resetInstanceOverrides(instanceId: string) {
    const node = findNode(get().document, instanceId) as InstanceNode | null;
    if (!node || node.type !== '__INSTANCE__') return;

    get().updateNode(instanceId, { overrides: undefined } as unknown as Partial<NodeData>);
  },
}));
