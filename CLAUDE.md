# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Figma plugin that converts selected design nodes into a normalized, type-safe IR (Intermediate Representation) for LLM-based code generation. Uses a 2-stage type conversion pipeline (Extract → Normalize) to transform Figma's complex API into an LLM-friendly structure.

**Core Goal**: Transform Figma design data (layout, styles, text, effects, design tokens) into a clean format that enables LLM UI code generation.

## Development Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Development mode with hot-reload
pnpm build          # Production build

pnpm lint           # ESLint
pnpm format         # Prettier formatting
pnpm type-check     # TypeScript type check

pnpm vitest         # Run Vitest tests
```

### Testing in Figma

1. Run `pnpm dev`
2. Figma desktop: `Cmd/Ctrl + K` → "Import plugin from manifest…" → select `dist/manifest.json`
3. Keep dev server running for hot reload

## Architecture: 2-Stage Type Conversion Pipeline

```
SceneNode (Figma API)
  ↓ Extract (src/main/pipeline/extract/)
ExtractedStyle
  ↓ Normalize (src/main/pipeline/normalize/)
NormalizedStyle
  ↓ Build Node (src/main/node/)
ReactNode (final output)
```

### Extract Stage (`src/main/pipeline/extract/`)

**Purpose**: Safely pull raw data from Figma Plugin API without transformation.

- Use Figma Mixin type guards before accessing properties
- Use `Partial<Pick<T, K>>` pattern to extract only needed keys
- Keep `figma.mixed` values as-is (normalization happens next stage)
- No transformation logic - raw data extraction only
- Collect all `VariableAlias` references recursively (fills, effects, stroke, text, nested structures)

### Normalize Stage (`src/main/pipeline/normalize/`)

**Purpose**: Transform raw extracted data into LLM-friendly structures.

Key transformations:

- **figma.mixed**: Convert to typed structures or return empty array/null
- **TokenizedValue wrapping**: When `VariableAlias` exists, wrap as `{ tokenRef, fallback }`
- **Colors**: RGB → `{ hex, rgb, rgba, opacity }` object
- **Layout**: Flat properties → `container`/`child` semantic units
- **Text**: Character ranges → `NormalizedTextRun[]` segments

### Node Building (`src/main/node/`)

- `buildNodeTree()`: Recursive tree traversal, filters `visible === false` children
- Type-specific builders in `builders.ts` for TEXT, FRAME, INSTANCE, etc.

#### buildNodeData() - Common Data Generation (`src/main/node/props.ts`)

All nodes go through this common processing pipeline:

1. `extractStyle()` - Extract raw style from Figma node
2. `normalizeStyle()` - Normalize extracted style
3. `buildTokenRefs()` - Build token reference list (async)
4. `buildTokenRefMap()` - Convert TokenRefMapping[] to Map
5. **`enrichStyle()`** - Apply TokenizedValue wrapping and create Output types
    - Apply tokenRef to fills/effects/stroke array elements
    - Process layoutGrids
    - Apply tokenRef to visible/opacity
6. `buildInstanceRef()` - Build component instance info
7. `buildAssetRefs()` - Build image/vector asset list

## Key Type Patterns

### TokenizedValue - Design Token Preservation

```typescript
type TokenRef = { id: string; name?: string; collectionId?: string; ... };
type TokenizedValue<T> = T | { tokenRef: TokenRef; fallback: T };
```

Used to preserve Figma Variable bindings so LLM can apply token in style code.

### NormalizedValue - Mixed Value Typing

```typescript
type NormalizedValue<T> =
	| { type: 'uniform'; value: T }
	| { type: 'mixed'; values: T[] }
	| { type: 'range-based'; segments: Array<{ start: number; end: number; value: T }> };
```

### BaseReactNode - Generic Node System

```typescript
interface BaseReactNode<TType, TProps, TChildren = ReactNode[]> {
	type: TType;
	props: TProps;
	children?: TChildren;
	instanceRef?: InstanceRef; // Component instance reference
	tokensRef?: TokenRefMapping[]; // Design token references
	assets?: AssetRef[]; // Image/vector assets
}
```

### Output Types - Final Output Structure

The Normalize stage produces types with TokenizedValue only in inner fields.
The `enrichStyle()` function creates Output types with TokenizedValue applied even to array elements.

**Key differences**:

- `NormalizedStyle` → `OutputNormalizedStyle`
    - `fills: NormalizedValue<NormalizedFill[]>` → `fills: NormalizedValue<Array<TokenizedValue<NormalizedFill>>>`
    - Each fill/effect can have individual tokenRef

- `NormalizedStroke` → `OutputNormalizedStroke`
    - `paints: NormalizedValue<NormalizedFill[]>` → `paints: NormalizedValue<Array<TokenizedValue<NormalizedFill>>>`

- `NormalizedLayout` → `OutputNormalizedLayout`
    - Adds `layoutGrids?: OutputLayoutGrid[]`

**Example**:

```typescript
// Normalized (internal)
{ type: 'uniform', value: [{ type: 'solid', color: {...} }] }

// Output (with array-level tokenization)
{ type: 'uniform', value: [
  { tokenRef: { id: 'VariableID:1:7' }, fallback: { type: 'solid', color: {...} } }
]}
```

This allows LLM to recognize which specific fill/effect is bound to a design token.

## Design Principles

1. **Figma Plugin API as SSOT**: Use types defined in `@figma/plugin-typings` as the single source of truth
2. **No Type Bypass**: Never use `any` or unnecessary type assertions to work around issues - improve the type design itself instead
3. **Pipeline Stage Separation**: Extract handles raw access; Normalize handles transformation
4. **Token Preservation**: `VariableAlias` preserved through entire pipeline as `TokenizedValue<T>`
5. **LLM-Optimized Output**: Structure consistency over human readability
6. **Schema Validation**: Runtime type validation with Zod to prevent errors from malformed Figma API data

## Coding Guidelines

### 1. Always Handle `figma.mixed`

**What is `figma.mixed`?**

`figma.mixed` is a unique symbol value returned by Figma Plugin API when a property has multiple different values across selected nodes or text ranges. For example:

- A text node with different font sizes across character ranges returns `fontSize: figma.mixed`
- Multiple selected rectangles with different corner radii return `cornerRadius: figma.mixed`

**CRITICAL**: Never ignore or treat `figma.mixed` as if it doesn't exist. Always explicitly handle it.

**DO**:

```typescript
// Explicitly check and handle mixed values
if (textNode.fontSize === figma.mixed) {
	// Extract actual mixed values using range-based API
	const segments = textNode.getStyledTextSegments(['fontSize']);
	return {
		type: 'range-based',
		segments: segments.map((seg) => ({
			start: seg.start,
			end: seg.end,
			value: seg.fontSize,
		})),
	};
}
// Process uniform value
return { type: 'uniform', value: textNode.fontSize };
```

```typescript
// For stroke weights
if (node.strokeWeight === figma.mixed && 'strokeTopWeight' in node) {
	// Read individual values instead of ignoring mixed
	return {
		type: 'individual',
		top: node.strokeTopWeight,
		right: node.strokeRightWeight,
		bottom: node.strokeBottomWeight,
		left: node.strokeLeftWeight,
	};
}
return { type: 'uniform', value: node.strokeWeight };
```

**DON'T**:

```typescript
// ❌ Ignoring mixed - will cause runtime errors
const fontSize = node.fontSize; // Could be number | figma.mixed
return { type: 'uniform', value: fontSize }; // Type error!
```

**Pattern**: Use discriminated unions to represent mixed states:

```typescript
type NormalizedValue<T> =
	| { type: 'uniform'; value: T }
	| { type: 'mixed'; values: T[] }
	| { type: 'range-based'; segments: Array<{ start: number; end: number; value: T }> };
```

### 2. Avoid Excessive Defensive Code

**Principle**: Trust TypeScript's type system and Figma's API guarantees. Don't add defensive checks for cases that can't happen according to the type system.

**When complex types require verbose defensive code, declare a Zod schema and derive the type from it.**

Zod's purpose: **Declare schema once → Generate type via `z.infer` → Eliminate verbose type definitions and defensive code together.**

**DON'T** - Verbose TypeScript type + defensive code:

```typescript
// ❌ Separate type definition + long defensive checks
type VariableAlias = {
	type: 'VARIABLE_ALIAS';
	id: string;
};

function collectAliasIds(target: Set<string>, aliases: unknown) {
	if (!aliases) return;
	if (typeof aliases !== 'object') return;
	if (aliases === null) return;
	if (!('type' in aliases)) return;
	if (aliases.type !== 'VARIABLE_ALIAS') return;
	if (!('id' in aliases)) return;
	if (typeof aliases.id !== 'string') return;

	target.add((aliases as VariableAlias).id); // Still need type assertion
}
```

**DO** - Zod schema as single source of truth:

```typescript
// ✅ Schema declaration → type generation → unified validation
import { z } from 'zod';

// 1. Declare schema
const variableAliasSchema = z.object({
	type: z.literal('VARIABLE_ALIAS'),
	id: z.string(),
});

// 2. Generate type from schema
type VariableAlias = z.infer<typeof variableAliasSchema>;

// 3. Use schema for validation (no defensive code needed)
function collectAliasIds(target: Set<string>, aliases: unknown) {
	const result = variableAliasSchema.safeParse(aliases);
	if (result.success) {
		target.add(result.data.id); // Fully typed, no assertion
	}
}
```

**DO** - Trust the type system when TypeScript guarantees the type:

```typescript
// ✅ Clean and type-safe
function processFills(fills: Paint[] | undefined): NormalizedFill[] {
	if (!fills) return [];

	return fills
		.filter((fill) => fill.visible !== false)
		.map(normalizePaint)
		.filter((fill): fill is NormalizedFill => fill !== null);
}
```

**When to use Zod**:

- Complex types with nested structures (use schema as type definition source)
- Parsing `boundVariables` (unknown structure from Figma API)
- When you would write 5+ defensive if-checks

**When to trust types**:

- Internal function calls within our codebase
- Data already validated by Extract stage
- Properties guaranteed by `@figma/plugin-typings`

## Variable Resolution

### VariableRegistry (`src/main/pipeline/variables/registry.ts`)

Resolves VariableAlias to full TokenRef with metadata:

```typescript
class VariableRegistry {
	async resolveAlias(alias: VariableAlias): Promise<TokenRef | null>;
}
```

- Calls `figma.variables.getVariableByIdAsync(alias.id)`
- Extracts name, collectionId, collectionName, modeId, modeName
- Caches results for performance

Used in:

- `buildTokenRefs()` - Resolves all collected variable IDs

### Schema Validation (`src/main/pipeline/shared/schemas.ts`)

Defines Zod schemas that serve as both type definitions and validators:

- `variableAliasSchema` - Schema for VariableAlias (type derived via `z.infer`)
- `tokenizedValueSchema` - Schema for TokenizedValue (type derived via `z.infer`)

These schemas replace verbose TypeScript type definitions and defensive code.

## Adding New Features

### New Style Property

1. Define Extract type in `pipeline/extract/types.ts`
2. Implement Extract function with type guard
3. Add to `ExtractedStyle` and `extractStyle()`
4. Define Normalize type in `pipeline/normalize/types.ts`
5. Implement Normalize function (handle mixed, wrap TokenizedValue)
6. Add to `NormalizedStyle` and `normalizeStyle()`

### New Node Type

1. Define Props and ReactNode type in `node/type.ts`
2. Add to `ReactNode` union type
3. Implement builder function in `node/builders.ts`
4. Add switch-case branch in `buildNodeTree()`

## Important References

- **Figma Plugin API**: https://www.figma.com/plugin-docs/api/api-reference/
- **Figma API Types**: `node_modules/@figma/plugin-typings`
- **Build Tool**: [Plugma](https://plugma.dev/docs) (Vite-based)
- **Main/UI Thread Separation**: `src/main/` accesses Figma Plugin API; `src/ui/` runs in iframe (postMessage communication)

## Additional Documentation

For detailed technical references, see the `docs/` folder:

- **Architecture Flow** (`docs/architecture-flow.md`) - Visual diagrams showing the complete data flow from `buildNodeTree()` through Extract/Normalize stages to final ReactNode output. **Use this when**: Understanding how the entire pipeline works end-to-end.

- **Figma boundVariables Guide** (`docs/figma-bound-variables.md`) - Comprehensive guide on reading Variable bindings from Figma Plugin API, including all bindable fields and code examples. **Use this when**: Working with design tokens, variable bindings, or implementing new variable-aware features.

- **Figma Style Type Interpretation** (`docs/figma-style-type.md`) - Detailed rules for interpreting Figma Plugin API types (Paint, Effect, Stroke, Text, Layout) based on official type definitions. **Use this when**: Adding new style properties, understanding mixed values, or troubleshooting type-related issues.
