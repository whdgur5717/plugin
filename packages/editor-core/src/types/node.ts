import type { CSSProperties } from "react"

/**
 * 모든 SceneNode의 공통 필드
 */
export interface BaseNode {
	id: string
	style?: CSSProperties
	visible?: boolean
	locked?: boolean
}

/**
 * 문서 - 여러 페이지를 포함하는 루트
 */
export interface DocumentNode {
	id: string
	children: PageNode[]
	meta?: {
		name?: string
		createdAt?: string
		updatedAt?: string
	}
}

/**
 * 페이지 - 여러 SceneNode를 포함
 */
export interface PageNode {
	id: string
	name: string
	children: SceneNode[]
}

/**
 * 요소 노드 (HTML 태그)
 */
export interface ElementNode extends BaseNode {
	type: "element"
	tag: string
	props?: Record<string, unknown>
	children?: SceneNode[] | string
}

/**
 * 컴포넌트 인스턴스 노드
 */
export interface InstanceNode extends BaseNode {
	type: "instance"
	componentId: string
	overrides?: {
		[nodeId: string]: {
			props?: Record<string, unknown>
			style?: CSSProperties
			children?: string
		}
	}
}

/**
 * 페이지 안에 들어가는 모든 노드
 */
export type SceneNode = ElementNode | InstanceNode

/**
 * 노드 위치 정보
 */
export interface Position {
	x: number
	y: number
}

/**
 * 노드 크기 정보
 */
export interface Size {
	width: number
	height: number
}

/**
 * 노드 바운딩 박스
 */
export interface BoundingBox extends Position, Size {}

/**
 * 컴포넌트 정의 (Master Component)
 */
export interface ComponentDefinition {
	id: string
	name: string
	root: ElementNode
	createdAt: string
}
