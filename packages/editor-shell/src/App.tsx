import "./App.css"

import type { AsyncMethodReturns } from "penpal"
import { connectToChild } from "penpal"
import { useEffect, useRef } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { LayersPanel } from "./components/LayersPanel"
import { PropertiesPanel } from "./components/PropertiesPanel"
import { Toolbar } from "./components/Toolbar"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"
import type { CanvasMethods } from "./protocol/types"
import { useEditorStore } from "./store/editor"

export function App() {
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const canvasRef = useRef<AsyncMethodReturns<CanvasMethods> | null>(null)

	// 키보드 단축키 활성화
	useKeyboardShortcuts()

	useEffect(() => {
		if (!iframeRef.current) return

		const canvasConnection = connectToChild<CanvasMethods>({
			iframe: iframeRef.current,
			methods: {
				onNodeClicked(id: string, shiftKey: boolean) {
					if (shiftKey) {
						useEditorStore.getState().toggleSelection(id)
					} else {
						useEditorStore.getState().setSelection([id])
					}
				},
				onNodeHovered(id: string | null) {
					useEditorStore.getState().setHoveredId(id)
				},
				onNodeMoved(id: string, position: { x: number; y: number }) {
					useEditorStore.getState().moveNode(id, position)
				},
				onNodeResized(id: string, size: { width: number; height: number }) {
					useEditorStore.getState().resizeNode(id, size)
				},
			},
		})

		canvasConnection.promise.then((child) => {
			canvasRef.current = child
			// 초기 상태 동기화
			const state = useEditorStore.getState()
			child.syncState({
				document: state.document,
				components: state.components,
				zoom: state.zoom,
				selection: state.selection,
			})
		})

		// store 변경 시 Canvas에 동기화
		const unsubscribe = useEditorStore.subscribe((state) => {
			canvasRef.current?.syncState({
				document: state.document,
				components: state.components,
				zoom: state.zoom,
				selection: state.selection,
			})
		})

		return () => {
			unsubscribe()
			canvasConnection.destroy()
		}
	}, [])

	return (
		<div className="app">
			<Toolbar />
			<PanelGroup direction="horizontal" className="main-content">
				<Panel defaultSize={15} minSize={10} maxSize={25}>
					<LayersPanel />
				</Panel>
				<PanelResizeHandle className="resize-handle" />
				<Panel defaultSize={60} minSize={30}>
					<div className="canvas-container">
						<iframe ref={iframeRef} src="http://localhost:3001" title="Canvas" className="canvas-iframe" />
					</div>
				</Panel>
				<PanelResizeHandle className="resize-handle" />
				<Panel defaultSize={25} minSize={15} maxSize={35}>
					<PropertiesPanel />
				</Panel>
			</PanelGroup>
		</div>
	)
}
