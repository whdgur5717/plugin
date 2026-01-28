import type { ComponentDefinition, DocumentNode, ElementNode, Position, SceneNode, Size } from "./node"

/**
 * 에디터 도구 타입
 */
export type EditorTool = "select" | "frame" | "text" | "shape"

/**
 * 에디터 상태
 */
export interface EditorState {
	/** 현재 문서 */
	document: DocumentNode

	/** 현재 페이지 ID */
	currentPageId: string

	/** 컴포넌트 정의 목록 */
	components: ComponentDefinition[]

	/** 선택된 노드 ID 목록 */
	selection: string[]

	/** 호버 중인 노드 ID */
	hoveredId: string | null

	/** 현재 선택된 도구 */
	activeTool: EditorTool

	/** 줌 레벨 (1 = 100%) */
	zoom: number
}

/**
 * 에디터 액션
 */
export interface EditorActions {
	/** 노드 업데이트 */
	updateNode: (id: string, updates: Partial<SceneNode>) => void

	/** 노드 추가 */
	addNode: (parentId: string, node: SceneNode, index?: number) => void

	/** 노드 삭제 */
	removeNode: (id: string) => void

	/** 노드 이동 */
	moveNode: (id: string, position: Position) => void

	/** 노드 리사이즈 */
	resizeNode: (id: string, size: Size) => void

	/** 노드 순서 변경 (같은 부모 내에서) */
	reorderNode: (parentId: string, fromIndex: number, toIndex: number) => void

	/** 선택 변경 */
	setSelection: (ids: string[]) => void

	/** 선택 토글 (Shift+클릭 다중 선택) */
	toggleSelection: (id: string) => void

	/** 호버 변경 */
	setHoveredId: (id: string | null) => void

	/** 도구 변경 */
	setActiveTool: (tool: EditorTool) => void

	/** 줌 변경 */
	setZoom: (zoom: number) => void

	/** 가시성 토글 */
	toggleVisibility: (id: string) => void

	/** 잠금 상태 토글 */
	toggleLocked: (id: string) => void

	/** 노드 복제 */
	duplicateNode: (id: string) => void

	/** 선택된 노드를 컴포넌트로 변환 */
	createComponent: (nodeId: string, name: string) => string | null

	/** 컴포넌트 인스턴스 생성 */
	createInstance: (componentId: string, parentId: string) => string | null

	/** 컴포넌트 정의 업데이트 (마스터 변경) */
	updateComponent: (componentId: string, updates: Partial<ElementNode>) => void

	/** 컴포넌트 삭제 */
	deleteComponent: (componentId: string) => void

	/** 인스턴스 오버라이드 설정 */
	setInstanceOverride: (
		instanceId: string,
		targetNodeId: string,
		overrides: { props?: Record<string, unknown>; style?: Record<string, unknown>; children?: string },
	) => void

	/** 인스턴스 오버라이드 리셋 */
	resetInstanceOverrides: (instanceId: string) => void

	/** 페이지 변경 */
	setCurrentPage: (pageId: string) => void

	/** 페이지 추가 */
	addPage: (name: string) => string

	/** 페이지 삭제 */
	removePage: (pageId: string) => void

	/** 페이지 이름 변경 */
	renamePage: (pageId: string, name: string) => void
}

/**
 * 에디터 스토어 (상태 + 액션)
 */
export type EditorStore = EditorState & EditorActions
