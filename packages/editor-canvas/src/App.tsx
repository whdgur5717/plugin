import "./App.css"
import "@design-editor/components"

import type { ComponentDefinition, DocumentNode, Position, Size } from "@design-editor/core"
import { type AsyncMethodReturns, connectToParent } from "penpal"
import { useEffect, useRef, useState } from "react"

import type { ShellMethods } from "./protocol/types"
import { CanvasRenderer } from "./renderer/CanvasRenderer"

export function App() {
	const [document, setDocument] = useState<DocumentNode | null>(null)
	const [components, setComponents] = useState<ComponentDefinition[]>([])
	const [selectedIds, setSelectedIds] = useState<string[]>([])
	const [zoom, setZoom] = useState(1)
	const parentMethodsRef = useRef<AsyncMethodReturns<ShellMethods> | null>(null)

	useEffect(() => {
		const connection = connectToParent<ShellMethods>({
			methods: {
				syncState(state: { document: DocumentNode; components: ComponentDefinition[]; zoom: number; selection: string[] }) {
					setDocument(state.document)
					setComponents(state.components)
					setZoom(state.zoom)
					setSelectedIds(state.selection)
				},
			},
		})

		connection.promise.then((parent) => {
			parentMethodsRef.current = parent
		})

		return () => {
			connection.destroy()
		}
	}, [])

	const handleNodeClick = (id: string, shiftKey: boolean) => {
		parentMethodsRef.current?.onNodeClicked(id, shiftKey)
	}

	const handleNodeHover = (id: string | null) => {
		parentMethodsRef.current?.onNodeHovered(id)
	}

	const handleNodeMove = (id: string, position: Position) => {
		parentMethodsRef.current?.onNodeMoved(id, position)
	}

	const handleNodeResize = (id: string, size: Size) => {
		parentMethodsRef.current?.onNodeResized(id, size)
	}

	if (!document) {
		return <div className="loading">Loading...</div>
	}

	return (
		<div className="canvas-app" style={{ transform: `scale(${zoom})` }}>
			<CanvasRenderer
				document={document}
				components={components}
				selectedIds={selectedIds}
				onNodeClick={handleNodeClick}
				onNodeHover={handleNodeHover}
				onNodeMove={handleNodeMove}
				onNodeResize={handleNodeResize}
			/>
		</div>
	)
}
