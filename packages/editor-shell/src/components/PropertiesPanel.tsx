import "./PropertiesPanel.css"

import type { NodeData } from "@design-editor/core"
import { serializeDocument, serializeNode } from "@design-editor/core"
import { useState } from "react"

import { useEditorStore } from "../store/editor"

type Tab = "design" | "prototype" | "code"

function findNode(root: NodeData, id: string): NodeData | null {
	if (root.id === id) return root
	if (Array.isArray(root.children)) {
		for (const child of root.children) {
			const found = findNode(child, id)
			if (found) return found
		}
	}
	return null
}

function DesignTab({ node }: { node: NodeData }) {
	const updateNode = useEditorStore((state) => state.updateNode)
	const style = node.style ?? {}

	const handleStyleChange = (key: string, value: string | number | undefined) => {
		updateNode(node.id, {
			style: { ...style, [key]: value },
		})
	}

	return (
		<div className="design-tab">
			{/* Position */}
			<section className="property-section">
				<h3 className="section-title">Position</h3>
				<div className="property-grid">
					<label>
						<span>X</span>
						<input
							type="number"
							value={style.left ?? 0}
							onChange={(e) => handleStyleChange("left", Number(e.target.value))}
						/>
					</label>
					<label>
						<span>Y</span>
						<input type="number" value={style.top ?? 0} onChange={(e) => handleStyleChange("top", Number(e.target.value))} />
					</label>
				</div>
			</section>

			{/* Size */}
			<section className="property-section">
				<h3 className="section-title">Size</h3>
				<div className="property-grid">
					<label>
						<span>W</span>
						<input
							type="number"
							value={style.width ?? ""}
							onChange={(e) => handleStyleChange("width", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>H</span>
						<input
							type="number"
							value={style.height ?? ""}
							onChange={(e) => handleStyleChange("height", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
				</div>
			</section>

			{/* Layout */}
			<section className="property-section">
				<h3 className="section-title">Layout</h3>
				<div className="property-row">
					<select value={style.display ?? "block"} onChange={(e) => handleStyleChange("display", e.target.value)}>
						<option value="block">Block</option>
						<option value="flex">Flex</option>
						<option value="grid">Grid</option>
						<option value="inline">Inline</option>
						<option value="none">None</option>
					</select>
				</div>
				{style.display === "flex" && (
					<>
						<div className="property-grid" style={{ marginTop: 8 }}>
							<label>
								<span>Dir</span>
								<select
									value={style.flexDirection ?? "row"}
									onChange={(e) => handleStyleChange("flexDirection", e.target.value)}
								>
									<option value="row">Row</option>
									<option value="column">Column</option>
									<option value="row-reverse">Row Rev</option>
									<option value="column-reverse">Col Rev</option>
								</select>
							</label>
							<label>
								<span>Gap</span>
								<input
									type="number"
									value={style.gap ?? 0}
									onChange={(e) => handleStyleChange("gap", Number(e.target.value))}
								/>
							</label>
						</div>
						<div className="property-grid" style={{ marginTop: 8 }}>
							<label>
								<span>Align</span>
								<select value={style.alignItems ?? "stretch"} onChange={(e) => handleStyleChange("alignItems", e.target.value)}>
									<option value="stretch">Stretch</option>
									<option value="flex-start">Start</option>
									<option value="center">Center</option>
									<option value="flex-end">End</option>
								</select>
							</label>
							<label>
								<span>Justify</span>
								<select
									value={style.justifyContent ?? "flex-start"}
									onChange={(e) => handleStyleChange("justifyContent", e.target.value)}
								>
									<option value="flex-start">Start</option>
									<option value="center">Center</option>
									<option value="flex-end">End</option>
									<option value="space-between">Between</option>
									<option value="space-around">Around</option>
								</select>
							</label>
						</div>
					</>
				)}
			</section>

			{/* Spacing */}
			<section className="property-section">
				<h3 className="section-title">Spacing</h3>
				<div className="property-grid">
					<label>
						<span>P</span>
						<input
							type="number"
							placeholder="Padding"
							value={style.padding ?? ""}
							onChange={(e) => handleStyleChange("padding", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>M</span>
						<input
							type="number"
							placeholder="Margin"
							value={style.margin ?? ""}
							onChange={(e) => handleStyleChange("margin", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
				</div>
			</section>

			{/* Fill */}
			<section className="property-section">
				<h3 className="section-title">Fill</h3>
				<div className="property-row">
					<input
						type="color"
						value={style.backgroundColor ?? "#ffffff"}
						onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
					/>
					<input
						type="text"
						value={style.backgroundColor ?? ""}
						placeholder="#ffffff"
						onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
					/>
				</div>
			</section>

			{/* Border */}
			<section className="property-section">
				<h3 className="section-title">Border</h3>
				<div className="property-grid">
					<label>
						<span>Width</span>
						<input
							type="number"
							value={style.borderWidth ?? ""}
							onChange={(e) => handleStyleChange("borderWidth", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>Radius</span>
						<input
							type="number"
							value={style.borderRadius ?? ""}
							onChange={(e) => handleStyleChange("borderRadius", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
				</div>
				<div className="property-row" style={{ marginTop: 8 }}>
					<input
						type="color"
						value={style.borderColor ?? "#000000"}
						onChange={(e) => handleStyleChange("borderColor", e.target.value)}
					/>
					<select value={style.borderStyle ?? "solid"} onChange={(e) => handleStyleChange("borderStyle", e.target.value)}>
						<option value="none">None</option>
						<option value="solid">Solid</option>
						<option value="dashed">Dashed</option>
						<option value="dotted">Dotted</option>
					</select>
				</div>
			</section>

			{/* Typography */}
			<section className="property-section">
				<h3 className="section-title">Typography</h3>
				<div className="property-grid">
					<label>
						<span>Size</span>
						<input
							type="number"
							value={style.fontSize ?? ""}
							onChange={(e) => handleStyleChange("fontSize", e.target.value ? Number(e.target.value) : undefined)}
						/>
					</label>
					<label>
						<span>Weight</span>
						<select value={style.fontWeight ?? "normal"} onChange={(e) => handleStyleChange("fontWeight", e.target.value)}>
							<option value="normal">Normal</option>
							<option value="500">Medium</option>
							<option value="600">Semibold</option>
							<option value="bold">Bold</option>
						</select>
					</label>
				</div>
				<div className="property-row" style={{ marginTop: 8 }}>
					<input
						type="color"
						value={style.color ?? "#000000"}
						onChange={(e) => handleStyleChange("color", e.target.value)}
					/>
					<input
						type="text"
						value={style.color ?? ""}
						placeholder="#000000"
						onChange={(e) => handleStyleChange("color", e.target.value)}
					/>
				</div>
				<div className="property-row" style={{ marginTop: 8 }}>
					<select
						value={style.textAlign ?? "left"}
						onChange={(e) => handleStyleChange("textAlign", e.target.value)}
						style={{ flex: 1 }}
					>
						<option value="left">Left</option>
						<option value="center">Center</option>
						<option value="right">Right</option>
					</select>
				</div>
			</section>
		</div>
	)
}

function CodeTab({ node }: { node: NodeData }) {
	const [showFull, setShowFull] = useState(false)
	const [copied, setCopied] = useState(false)

	const code = showFull ? serializeDocument(node, "Component") : serializeNode(node)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="code-tab">
			<div className="code-header">
				<div className="code-toggle">
					<button className={`toggle-btn ${!showFull ? "active" : ""}`} onClick={() => setShowFull(false)}>
						JSX
					</button>
					<button className={`toggle-btn ${showFull ? "active" : ""}`} onClick={() => setShowFull(true)}>
						Component
					</button>
				</div>
				<button className="copy-btn" onClick={handleCopy}>
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>
			<pre className="code-preview">
				<code>{code}</code>
			</pre>
		</div>
	)
}

export function PropertiesPanel() {
	const [activeTab, setActiveTab] = useState<Tab>("design")
	const document = useEditorStore((state) => state.document)
	const selection = useEditorStore((state) => state.selection)

	const selectedNode = selection.length === 1 ? findNode(document, selection[0]) : null

	return (
		<div className="properties-panel">
			<div className="panel-tabs">
				<button className={`tab-button ${activeTab === "design" ? "active" : ""}`} onClick={() => setActiveTab("design")}>
					Design
				</button>
				<button
					className={`tab-button ${activeTab === "prototype" ? "active" : ""}`}
					onClick={() => setActiveTab("prototype")}
				>
					Prototype
				</button>
				<button className={`tab-button ${activeTab === "code" ? "active" : ""}`} onClick={() => setActiveTab("code")}>
					Code
				</button>
			</div>

			<div className="panel-content">
				{selectedNode ? (
					<>
						{activeTab === "design" && <DesignTab node={selectedNode} />}
						{activeTab === "prototype" && <div className="empty-state">Prototype features coming soon</div>}
						{activeTab === "code" && <CodeTab node={selectedNode} />}
					</>
				) : (
					<div className="empty-state">Select a layer to see its properties</div>
				)}
			</div>
		</div>
	)
}
