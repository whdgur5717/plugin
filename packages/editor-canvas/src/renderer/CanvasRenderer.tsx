import { getComponent } from "@design-editor/components"
import type {
	ComponentDefinition,
	ElementNode,
	InstanceNode,
	PageNode,
	Position,
	SceneNode,
	Size,
} from "@design-editor/core"
import React from "react"

import { NodeWrapper } from "./NodeWrapper"

interface CanvasRendererProps {
	page: PageNode
	components: ComponentDefinition[]
	selectedIds: string[]
	onNodeClick: (id: string, shiftKey: boolean) => void
	onNodeHover: (id: string | null) => void
	onNodeMove: (id: string, position: Position) => void
	onNodeResize: (id: string, size: Size) => void
}

export function CanvasRenderer({
	page,
	components,
	selectedIds,
	onNodeClick,
	onNodeHover,
	onNodeMove,
	onNodeResize,
}: CanvasRendererProps) {
	return (
		<>
			{page.children
				.filter((child) => child.visible !== false)
				.map((child) => (
					<NodeWrapper
						key={child.id}
						node={child}
						isSelected={selectedIds.includes(child.id)}
						onSelect={(shiftKey) => onNodeClick(child.id, shiftKey)}
						onHover={(hovered) => onNodeHover(hovered ? child.id : null)}
						onMove={(pos) => onNodeMove(child.id, pos)}
						onResize={(size) => onNodeResize(child.id, size)}
					>
						{renderNode(child, components, selectedIds, onNodeClick, onNodeHover, onNodeMove, onNodeResize)}
					</NodeWrapper>
				))}
		</>
	)
}

/**
 * 인스턴스 노드를 렌더링 - 컴포넌트 정의를 참조하여 렌더링
 */
function renderInstance(
	instance: InstanceNode,
	components: ComponentDefinition[],
	selectedIds: string[],
	onNodeClick: (id: string, shiftKey: boolean) => void,
	onNodeHover: (id: string | null) => void,
	onNodeMove: (id: string, position: Position) => void,
	onNodeResize: (id: string, size: Size) => void,
): React.ReactNode {
	const component = components.find((c) => c.id === instance.componentId)
	if (!component) {
		// 컴포넌트를 찾을 수 없으면 placeholder 렌더링
		return <div style={{ ...instance.style, background: "#ff000033", border: "1px dashed red" }}>Missing Component</div>
	}

	// 컴포넌트 루트에 인스턴스 스타일 적용
	const mergedRoot: ElementNode = {
		...component.root,
		style: { ...component.root.style, ...instance.style },
	}

	// 오버라이드 적용
	const rootWithOverrides = applyOverrides(mergedRoot, instance.overrides)

	return renderNode(rootWithOverrides, components, selectedIds, onNodeClick, onNodeHover, onNodeMove, onNodeResize)
}

/**
 * 오버라이드 적용
 */
function applyOverrides(node: ElementNode, overrides?: InstanceNode["overrides"]): ElementNode {
	if (!overrides) return node

	const nodeOverride = overrides[node.id]
	let result = node

	if (nodeOverride) {
		result = {
			...node,
			props: { ...node.props, ...nodeOverride.props },
			style: { ...node.style, ...nodeOverride.style },
			children: nodeOverride.children !== undefined ? nodeOverride.children : node.children,
		}
	}

	// 자식에도 재귀적으로 오버라이드 적용
	if (Array.isArray(result.children)) {
		result = {
			...result,
			children: result.children.map((child) => {
				if (child.type === "instance") return child
				return applyOverrides(child, overrides)
			}),
		}
	}

	return result
}

function renderNode(
	node: SceneNode,
	components: ComponentDefinition[],
	selectedIds: string[],
	onNodeClick: (id: string, shiftKey: boolean) => void,
	onNodeHover: (id: string | null) => void,
	onNodeMove: (id: string, position: Position) => void,
	onNodeResize: (id: string, size: Size) => void,
): React.ReactNode {
	// 인스턴스인 경우 컴포넌트 참조하여 렌더링
	if (node.type === "instance") {
		return renderInstance(node, components, selectedIds, onNodeClick, onNodeHover, onNodeMove, onNodeResize)
	}

	const Component = getComponent(node.tag)

	// position 스타일은 NodeWrapper에서 적용하므로 컴포넌트에서는 제외
	// width/height도 wrapper에 적용되므로 100%로 채움
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { position, left, top, right, bottom, width, height, ...restStyle } = node.style ?? {}
	const contentStyle = { ...restStyle, width: "100%", height: "100%" }

	if (!Component) {
		// 컴포넌트가 없으면 HTML 태그로 렌더링
		return React.createElement(
			node.tag,
			{ style: contentStyle, ...node.props },
			renderChildren(node.children, components, selectedIds, onNodeClick, onNodeHover, onNodeMove, onNodeResize),
		)
	}

	return (
		<Component style={contentStyle} {...node.props}>
			{renderChildren(node.children, components, selectedIds, onNodeClick, onNodeHover, onNodeMove, onNodeResize)}
		</Component>
	)
}

function renderChildren(
	children: ElementNode["children"],
	components: ComponentDefinition[],
	selectedIds: string[],
	onNodeClick: (id: string, shiftKey: boolean) => void,
	onNodeHover: (id: string | null) => void,
	onNodeMove: (id: string, position: Position) => void,
	onNodeResize: (id: string, size: Size) => void,
): React.ReactNode {
	if (!children) return null

	if (typeof children === "string") {
		return children
	}

	return children
		.filter((child) => child.visible !== false)
		.map((child) => (
			<NodeWrapper
				key={child.id}
				node={child}
				isSelected={selectedIds.includes(child.id)}
				onSelect={(shiftKey) => onNodeClick(child.id, shiftKey)}
				onHover={(hovered) => onNodeHover(hovered ? child.id : null)}
				onMove={(pos) => onNodeMove(child.id, pos)}
				onResize={(size) => onNodeResize(child.id, size)}
			>
				{renderNode(child, components, selectedIds, onNodeClick, onNodeHover, onNodeMove, onNodeResize)}
			</NodeWrapper>
		))
}
