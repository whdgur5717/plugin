import type { DocumentNode, Position, Size, ComponentDefinition } from '@design-editor/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * Shell에서 Canvas로 호출 가능한 메서드
 */
export interface CanvasMethods {
  [key: string]: AnyFunction;
  /** 문서 상태 동기화 */
  syncState: (document: DocumentNode, components: ComponentDefinition[]) => void;
  /** 노드 선택 */
  selectNodes: (ids: string[]) => void;
  /** 줌 레벨 변경 */
  setZoom: (zoom: number) => void;
}

/**
 * Canvas에서 Shell로 호출 가능한 메서드
 */
export interface ShellMethods {
  [key: string]: AnyFunction;
  /** 노드 클릭 이벤트 */
  onNodeClicked: (id: string, shiftKey: boolean) => void;
  /** 노드 호버 이벤트 */
  onNodeHovered: (id: string | null) => void;
  /** 노드 이동 이벤트 */
  onNodeMoved: (id: string, position: Position) => void;
  /** 노드 리사이즈 이벤트 */
  onNodeResized: (id: string, size: Size) => void;
}
