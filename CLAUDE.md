# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development
cd packages/editor-shell && pnpm dev  # Shell UI at :3000
cd packages/editor-canvas && pnpm dev # Canvas iframe at :3001

# Code quality
pnpm format                           # Format with Prettier
pnpm lint                             # Lint all packages
pnpm type-check                       # TypeScript check all packages

# Production build
pnpm build                            # Build to dist/

# Tests
npx vitest                            # Run tests (vitest/**/*.test.ts)
npx vitest run                        # Single test run
```

## Architecture Overview

This is a **DOM/React-based design editor**. The editor renders React components directly—what you see in the editor becomes the actual React code.

### Package Structure (pnpm monorepo)

```
packages/
├── editor-core/        # Shared types (NodeData, EditorState) & codegen
├── editor-components/  # Component registry (maps node types → React components)
├── editor-canvas/      # Canvas iframe app (Vite, port 3001) - renders nodes
├── editor-shell/       # Main shell app (Vite, port 3000) - toolbar, panels, state
└── figma-plugin/       # (Legacy) Originally started as Figma plugin, currently unused

config/
├── eslint-config/      # Shared ESLint flat config
└── tsconfig/           # Shared TypeScript base config (strict mode)
```

### Shell/Canvas Separation

Shell and Canvas run as separate Vite apps connected via **Penpal** (postMessage). This provides CSS/JS isolation so canvas component styles don't bleed into the editor UI.

- **Shell → Canvas**: `syncState()`, `selectNodes()`, `setZoom()`
- **Canvas → Shell**: `onNodeClicked()`, `onNodeHovered()`, `onNodeMoved()`, `onNodeResized()`

### Core Data Model

`NodeData` (in `editor-core/src/types/node.ts`) is the source of truth:

```typescript
interface NodeData {
	id: string
	type: string // Component type: 'Frame', 'Text', 'Flex', etc.
	props?: Record<string, unknown>
	style?: CSSProperties
	children?: NodeData[] | string
	visible?: boolean
	locked?: boolean
}
```

### State Management

Zustand store in `editor-shell/src/store/editor.ts` manages:

- `document: DocumentNode` - the node tree
- `components: ComponentDefinition[]` - reusable components
- `selection: string[]` - selected node IDs
- `activeTool`, `zoom`, `hoveredId`

### Rendering Flow

1. `CanvasRenderer` receives DocumentNode from Shell via Penpal
2. Recursively renders nodes using the component registry
3. `NodeWrapper` handles drag/resize interactions with `re-resizable`
4. Selection/hover events bubble back to Shell

### Codegen

`editor-core/src/codegen/serialize.ts` converts NodeData → JSX code for export.

## Key Libraries

- **Penpal**: Shell↔Canvas iframe communication
- **Zustand**: State management in Shell
- **re-resizable**: Node resize handles in Canvas
- **@dnd-kit**: Drag-and-drop for canvas and layer panel sorting
- **Playwright**: E2E testing with cross-origin iframe support

## Task Master AI Instructions

**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
