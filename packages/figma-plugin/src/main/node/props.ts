import type { ExtractedTextProps } from '../pipeline/extract/text';
import type { ExtractedBoundVariables, ExtractedStyle } from '../pipeline/extract/types';
import type {
	NormalizedCorner,
	NormalizedEffect,
	NormalizedFill,
	NormalizedLayout,
	NormalizedStyle,
	NormalizedStroke,
	NormalizedText,
	NormalizedValue,
	TokenRef,
	TokenizedValue,
} from '../pipeline/normalize/types';
import type {
	AssetRef,
	BaseNodeProps,
	InstanceRef,
	OutputComponentProperties,
	OutputLayoutGrid,
	OutputNormalizedCorner,
	OutputNormalizedLayout,
	OutputNormalizedStroke,
	OutputNormalizedStyle,
	TokenRefMapping,
} from './type';
import { styleExtractor } from '../pipeline/extract/style';
import { styleNormalizer } from '../pipeline/normalize/style';
import { cssCompatibilityChecker } from '../pipeline/compatibility';
import { exportSvg } from '../pipeline/export';
import { tokenizedValueSchema, variableAliasSchema } from '../pipeline/shared/schemas';
import { VariableRegistry } from '../pipeline/variables/registry';

type BuiltNodeData = {
	props: BaseNodeProps;
	instanceRef?: InstanceRef;
	tokensRef?: TokenRefMapping[];
	assets?: AssetRef[];
	svgFallback?: string;
};

type TextSegment = NonNullable<ExtractedTextProps['characters']>[number];

export type BoundVariablesRecord = Record<string, unknown> | undefined;

type TokenRegistryPort = {
	resolveAlias: (alias: VariableAlias) => Promise<TokenRef | null>;
};

const variableRegistry: TokenRegistryPort = new VariableRegistry();

const unwrapTokenized = <T>(value: TokenizedValue<T>): T => {
	const parsed = tokenizedValueSchema.safeParse(value);
	return parsed.success ? (parsed.data.fallback as T) : (value as T);
};

const resolveTokenRef = (tokenRef: TokenRef, tokenRefs: Map<string, TokenRef>): TokenRef =>
	tokenRefs.get(tokenRef.id) ?? tokenRef;

const resolveTokenizedValue = <T>(value: TokenizedValue<T>, tokenRefs: Map<string, TokenRef>): TokenizedValue<T> => {
	const parsed = tokenizedValueSchema.safeParse(value);
	if (!parsed.success) return value;
	const tokenRef = resolveTokenRef(parsed.data.tokenRef as TokenRef, tokenRefs);
	return tokenRef === parsed.data.tokenRef ? value : { tokenRef, fallback: parsed.data.fallback as T };
};

const toTokenizedValue = <T>(
	value: T,
	alias: VariableAlias | null,
	tokenRefs: Map<string, TokenRef>,
): TokenizedValue<T> => {
	if (!alias) return value;
	const tokenRef = tokenRefs.get(alias.id) ?? { id: alias.id };
	return { tokenRef, fallback: value };
};

const applyAliasToken = <T>(
	value: TokenizedValue<T>,
	alias: VariableAlias | null,
	tokenRefs: Map<string, TokenRef>,
): TokenizedValue<T> => {
	if (alias) {
		const parsed = tokenizedValueSchema.safeParse(value);
		const fallback = parsed.success ? (parsed.data.fallback as T) : (value as T);
		return toTokenizedValue(fallback, alias, tokenRefs);
	}
	return resolveTokenizedValue(value, tokenRefs);
};

const resolveOptionalTokenizedValue = <T>(
	value: TokenizedValue<T> | null | undefined,
	tokenRefs: Map<string, TokenRef>,
): TokenizedValue<T> | null | undefined =>
	value === null || value === undefined ? value : resolveTokenizedValue(value, tokenRefs);

const applyAliasTokenOptional = <T>(
	value: TokenizedValue<T> | null,
	alias: VariableAlias | null,
	tokenRefs: Map<string, TokenRef>,
): TokenizedValue<T> | null => (value === null ? null : applyAliasToken(value, alias, tokenRefs));

const getAlias = (record: BoundVariablesRecord, key: string): VariableAlias | null => {
	const parsed = variableAliasSchema.safeParse(record?.[key]);
	return parsed.success ? parsed.data : null;
};

const getAliasFromArray = (record: unknown, index: number): VariableAlias | null => {
	if (!Array.isArray(record)) return null;
	const parsed = variableAliasSchema.safeParse(record[index]);
	return parsed.success ? parsed.data : null;
};

const buildTokenRefs = async (
	boundVariables?: ExtractedBoundVariables,
	registry: TokenRegistryPort = variableRegistry,
): Promise<TokenRefMapping[] | undefined> => {
	if (!boundVariables || boundVariables.ids.length === 0) return undefined;
	const refs = await Promise.all(
		boundVariables.ids.map(async (id) => {
			const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id };
			const resolved = await registry.resolveAlias(alias);
			return {
				variableId: id,
				token: resolved ?? { id },
			};
		}),
	);
	return refs;
};

export const buildTokenRefMap = (tokenRefs?: TokenRefMapping[]): Map<string, TokenRef> => {
	if (!tokenRefs) return new Map();
	return new Map(tokenRefs.map((ref) => [ref.variableId, ref.token]));
};

const resolveFillTokens = (fill: NormalizedFill, tokenRefs: Map<string, TokenRef>): NormalizedFill => {
	if (fill.type === 'solid') {
		return {
			...fill,
			color: resolveTokenizedValue(fill.color, tokenRefs),
		};
	}
	if (fill.type === 'gradient') {
		return {
			...fill,
			stops: fill.stops.map((stop) => ({
				...stop,
				color: resolveTokenizedValue(stop.color, tokenRefs),
			})),
		};
	}
	return fill;
};

const resolveFillsValue = (
	fills: TokenizedValue<NormalizedFill[]>,
	tokenRefs: Map<string, TokenRef>,
): TokenizedValue<NormalizedFill[]> => {
	const parsed = tokenizedValueSchema.safeParse(fills);
	const fallback = parsed.success ? (parsed.data.fallback as NormalizedFill[]) : (fills as NormalizedFill[]);
	const resolved = fallback.map((fill) => resolveFillTokens(fill, tokenRefs));
	if (parsed.success) {
		return { tokenRef: resolveTokenRef(parsed.data.tokenRef as TokenRef, tokenRefs), fallback: resolved };
	}
	return resolved;
};

const resolveEffectTokens = (effect: NormalizedEffect, tokenRefs: Map<string, TokenRef>): NormalizedEffect => {
	if (effect.type === 'shadow') {
		return {
			...effect,
			color: resolveTokenizedValue(effect.color, tokenRefs),
			offset: {
				x: resolveTokenizedValue(effect.offset.x, tokenRefs),
				y: resolveTokenizedValue(effect.offset.y, tokenRefs),
			},
			radius: resolveTokenizedValue(effect.radius, tokenRefs),
			spread: effect.spread === null ? null : resolveTokenizedValue(effect.spread, tokenRefs),
		};
	}
	if (effect.type === 'blur') {
		return {
			...effect,
			radius: resolveTokenizedValue(effect.radius, tokenRefs),
		};
	}
	return effect;
};

const resolveStrokeTokens = (
	stroke: NormalizedStroke,
	strokeAliases: unknown,
	tokenRefs: Map<string, TokenRef>,
): OutputNormalizedStroke => {
	const paintsValue =
		stroke.paints.type === 'uniform'
			? stroke.paints.value.map((paint, index) => {
					const resolved = resolveFillTokens(paint, tokenRefs);
					const alias = getAliasFromArray(strokeAliases, index);
					// Only apply paint-level alias to solid paints (gradient/image have nested bindings)
					if (alias && paint.type === 'solid') {
						return toTokenizedValue(resolved, alias, tokenRefs);
					}
					return resolved;
				})
			: [];
	const paints: NormalizedValue<Array<TokenizedValue<NormalizedFill>>> =
		stroke.paints.type === 'uniform' ? { type: 'uniform', value: paintsValue } : { type: 'mixed', values: [] };

	const weight =
		stroke.weight.type === 'uniform'
			? { type: 'uniform' as const, value: resolveTokenizedValue(stroke.weight.value, tokenRefs) }
			: {
					type: 'individual' as const,
					top: resolveTokenizedValue(stroke.weight.top, tokenRefs),
					right: resolveTokenizedValue(stroke.weight.right, tokenRefs),
					bottom: resolveTokenizedValue(stroke.weight.bottom, tokenRefs),
					left: resolveTokenizedValue(stroke.weight.left, tokenRefs),
				};

	return {
		...stroke,
		paints,
		weight,
	};
};

const resolveCornerTokens = (
	corner: NormalizedCorner,
	tokenRefs: Map<string, TokenRef>,
): OutputNormalizedCorner => {
	const radius =
		corner.radius.type === 'uniform'
			? {
					type: 'uniform' as const,
					value: resolveTokenizedValue(corner.radius.value, tokenRefs),
				}
			: corner.radius.type === 'mixed'
				? {
						type: 'mixed' as const,
						values: corner.radius.values.map((value) => resolveTokenizedValue(value, tokenRefs)),
					}
				: {
						type: 'range-based' as const,
						segments: corner.radius.segments.map((segment) => ({
							...segment,
							value: resolveTokenizedValue(segment.value, tokenRefs),
						})),
					};

	return {
		...corner,
		radius,
	};
};

const resolveLayoutTokens = (layout: NormalizedLayout, tokenRefs: Map<string, TokenRef>): OutputNormalizedLayout => {
	const position = {
		...layout.position,
		x: resolveTokenizedValue(layout.position.x, tokenRefs),
		y: resolveTokenizedValue(layout.position.y, tokenRefs),
		width: resolveTokenizedValue(layout.position.width, tokenRefs),
		height: resolveTokenizedValue(layout.position.height, tokenRefs),
		minWidth: resolveOptionalTokenizedValue(layout.position.minWidth, tokenRefs),
		maxWidth: resolveOptionalTokenizedValue(layout.position.maxWidth, tokenRefs),
		minHeight: resolveOptionalTokenizedValue(layout.position.minHeight, tokenRefs),
		maxHeight: resolveOptionalTokenizedValue(layout.position.maxHeight, tokenRefs),
	};

	const container = layout.container
		? {
				...layout.container,
				padding: layout.container.padding
					? {
							...layout.container.padding,
							top: resolveTokenizedValue(layout.container.padding.top, tokenRefs),
							right: resolveTokenizedValue(layout.container.padding.right, tokenRefs),
							bottom: resolveTokenizedValue(layout.container.padding.bottom, tokenRefs),
							left: resolveTokenizedValue(layout.container.padding.left, tokenRefs),
						}
					: undefined,
				gap: layout.container.gap
					? {
							...layout.container.gap,
							row:
								layout.container.gap.row === null || layout.container.gap.row === undefined
									? layout.container.gap.row
									: resolveTokenizedValue(layout.container.gap.row, tokenRefs),
							column:
								layout.container.gap.column === null || layout.container.gap.column === undefined
									? layout.container.gap.column
									: resolveTokenizedValue(layout.container.gap.column, tokenRefs),
						}
					: undefined,
				grid: layout.container.grid
					? {
							...layout.container.grid,
							rowGap: resolveTokenizedValue(layout.container.grid.rowGap, tokenRefs),
							columnGap: resolveTokenizedValue(layout.container.grid.columnGap, tokenRefs),
						}
					: undefined,
			}
		: undefined;

	return {
		...layout,
		position,
		container,
	};
};

const resolveTextTokens = (
	text: NormalizedText,
	extractedText: ExtractedTextProps,
	nodeBoundVariables: BoundVariablesRecord,
	tokenRefs: Map<string, TokenRef>,
): NormalizedText => {
	const segments = Array.isArray(extractedText.characters) ? extractedText.characters : [];
	const textRangeFills = nodeBoundVariables?.['textRangeFills'];

	const runs = text.runs.map((run, index) => {
		const segment = segments[index] as TextSegment | undefined;
		const boundVariables = (segment?.boundVariables as BoundVariablesRecord) ?? undefined;

		const fontFamilyAlias =
			getAlias(boundVariables, 'fontFamily') ?? getAliasFromArray(nodeBoundVariables?.['fontFamily'], index);
		const fontStyleAlias =
			getAlias(boundVariables, 'fontStyle') ?? getAliasFromArray(nodeBoundVariables?.['fontStyle'], index);
		const fontWeightAlias =
			getAlias(boundVariables, 'fontWeight') ?? getAliasFromArray(nodeBoundVariables?.['fontWeight'], index);
		const fontSizeAlias =
			getAlias(boundVariables, 'fontSize') ?? getAliasFromArray(nodeBoundVariables?.['fontSize'], index);
		const letterSpacingAlias =
			getAlias(boundVariables, 'letterSpacing') ??
			getAliasFromArray(nodeBoundVariables?.['letterSpacing'], index);
		const lineHeightAlias =
			getAlias(boundVariables, 'lineHeight') ?? getAliasFromArray(nodeBoundVariables?.['lineHeight'], index);
		const paragraphSpacingAlias =
			getAlias(boundVariables, 'paragraphSpacing') ??
			getAliasFromArray(nodeBoundVariables?.['paragraphSpacing'], index);
		const paragraphIndentAlias =
			getAlias(boundVariables, 'paragraphIndent') ??
			getAliasFromArray(nodeBoundVariables?.['paragraphIndent'], index);
		const fillsAlias = getAliasFromArray(textRangeFills, index);

		const resolvedFills = resolveFillsValue(run.style.fills, tokenRefs);
		// Only apply fills alias if all fills are solid (gradient/image have nested bindings)
		const fillsArray = unwrapTokenized(run.style.fills);
		const allSolidFills = fillsArray.every((fill) => fill.type === 'solid');

		return {
			...run,
			style: {
				...run.style,
				fontName: applyAliasToken(run.style.fontName, fontFamilyAlias, tokenRefs),
				fontSize: applyAliasToken(run.style.fontSize, fontSizeAlias, tokenRefs),
				fontWeight: applyAliasToken(run.style.fontWeight, fontWeightAlias, tokenRefs),
				fontStyle: applyAliasToken(run.style.fontStyle, fontStyleAlias, tokenRefs),
				letterSpacing: applyAliasToken(run.style.letterSpacing, letterSpacingAlias, tokenRefs),
				lineHeight: applyAliasToken(run.style.lineHeight, lineHeightAlias, tokenRefs),
				paragraphIndent: applyAliasTokenOptional(run.style.paragraphIndent, paragraphIndentAlias, tokenRefs),
				paragraphSpacing: applyAliasTokenOptional(run.style.paragraphSpacing, paragraphSpacingAlias, tokenRefs),
				fills: fillsAlias && allSolidFills ? applyAliasToken(resolvedFills, fillsAlias, tokenRefs) : resolvedFills,
				textCase: resolveTokenizedValue(run.style.textCase, tokenRefs),
				textDecoration: resolveTokenizedValue(run.style.textDecoration, tokenRefs),
				textDecorationColor: resolveTokenizedValue(run.style.textDecorationColor, tokenRefs),
				fillStyleId: resolveOptionalTokenizedValue(run.style.fillStyleId, tokenRefs) ?? null,
				textStyleId: resolveOptionalTokenizedValue(run.style.textStyleId, tokenRefs) ?? null,
				listSpacing: resolveOptionalTokenizedValue(run.style.listSpacing, tokenRefs) ?? null,
				indentation: resolveOptionalTokenizedValue(run.style.indentation, tokenRefs) ?? null,
			},
		};
	});

	const charactersAlias = getAlias(nodeBoundVariables, 'characters');

	const textStyleIdParsed = tokenizedValueSchema.safeParse(text.textStyleId);
	const textStyleId = textStyleIdParsed.success
		? resolveTokenizedValue(text.textStyleId as TokenizedValue<string>, tokenRefs)
		: text.textStyleId;

	return {
		...text,
		characters: applyAliasToken(text.characters, charactersAlias, tokenRefs),
		runs,
		textStyleId,
	};
};

const buildLayoutGrids = (node: SceneNode, tokenRefs: Map<string, TokenRef>): OutputLayoutGrid[] | undefined => {
	if (!('layoutGrids' in node)) return undefined;
	const layoutGrids = node.layoutGrids;
	if (!Array.isArray(layoutGrids) || layoutGrids.length === 0) return undefined;

	return layoutGrids.map((grid, index) => {
		const boundVariables = grid.boundVariables as BoundVariablesRecord;
		const sectionSize = typeof grid.sectionSize === 'number' ? grid.sectionSize : undefined;
		const count = 'count' in grid && typeof grid.count === 'number' ? grid.count : undefined;
		const offset = 'offset' in grid && typeof grid.offset === 'number' ? grid.offset : undefined;
		const gutterSize = 'gutterSize' in grid && typeof grid.gutterSize === 'number' ? grid.gutterSize : undefined;

		const gridAlias = getAliasFromArray(node.boundVariables?.layoutGrids, index);

		return {
			pattern: grid.pattern,
			alignment: 'alignment' in grid ? grid.alignment : undefined,
			sectionSize:
				sectionSize === undefined
					? undefined
					: applyAliasToken(sectionSize, getAlias(boundVariables, 'sectionSize'), tokenRefs),
			count:
				count === undefined ? undefined : applyAliasToken(count, getAlias(boundVariables, 'count'), tokenRefs),
			offset:
				offset === undefined
					? undefined
					: applyAliasToken(offset, getAlias(boundVariables, 'offset'), tokenRefs),
			gutterSize:
				gutterSize === undefined
					? undefined
					: applyAliasToken(gutterSize, getAlias(boundVariables, 'gutterSize'), tokenRefs),
			visible: grid.visible,
			color: grid.color,
			tokenRef: gridAlias ? (tokenRefs.get(gridAlias.id) ?? { id: gridAlias.id }) : undefined,
		};
	});
};

export const buildComponentProperties = (
	node: InstanceNode,
	nodeBoundVariables: BoundVariablesRecord,
	tokenRefs: Map<string, TokenRef>,
): OutputComponentProperties | undefined => {
	const componentProperties = node.componentProperties;
	if (!componentProperties) return undefined;
	const boundVariableProps = nodeBoundVariables?.['componentProperties'] as BoundVariablesRecord;

	const result: OutputComponentProperties = {};
	Object.entries(componentProperties).forEach(([name, prop]) => {
		const propBoundVariables = (prop.boundVariables as BoundVariablesRecord) ?? undefined;
		const alias = getAlias(propBoundVariables, 'value') ?? getAlias(boundVariableProps, name);
		result[name] = {
			...prop,
			value: applyAliasToken(prop.value, alias, tokenRefs),
		};
	});

	return result;
};

const buildInstanceRef = async (node: SceneNode): Promise<InstanceRef | undefined> => {
	if (node.type !== 'INSTANCE') return undefined;
	const mainComponent = await node.getMainComponentAsync();
	if (!mainComponent) return undefined;
	const variantProperties =
		'variantProperties' in node
			? (node as { variantProperties?: Record<string, string> }).variantProperties
			: undefined;
	const variantInfo = variantProperties && Object.keys(variantProperties).length > 0 ? variantProperties : undefined;

	return {
		componentId: mainComponent.id,
		componentName: mainComponent.name,
		variantInfo,
	};
};

const collectImageAssets = (fills: NormalizedFill[], assets: Map<string, AssetRef>) => {
	for (const fill of fills) {
		if (fill.type !== 'image') continue;
		if (!fill.imageHash) continue;
		assets.set(fill.imageHash, { kind: 'image', id: fill.imageHash });
	}
};

const buildAssetRefs = (style: NormalizedStyle): AssetRef[] | undefined => {
	const assets = new Map<string, AssetRef>();
	if (style.fills.type === 'uniform') {
		collectImageAssets(style.fills.value, assets);
	}
	if (style.stroke && style.stroke.paints.type === 'uniform') {
		collectImageAssets(style.stroke.paints.value, assets);
	}
	if (style.text) {
		for (const run of style.text.runs) {
			const fills = unwrapTokenized(run.style.fills);
			collectImageAssets(fills, assets);
		}
	}
	return assets.size > 0 ? Array.from(assets.values()) : undefined;
};

const enrichStyle = (
	normalizedStyle: NormalizedStyle,
	extractedStyle: ExtractedStyle,
	node: SceneNode,
	tokenRefs: Map<string, TokenRef>,
): OutputNormalizedStyle => {
	const nodeBoundVariables = extractedStyle.nodeBoundVariables;
	const fillsAliases = nodeBoundVariables?.['fills'];
	const effectsAliases = nodeBoundVariables?.['effects'];
	const strokeAliases = nodeBoundVariables?.['strokes'];

	const fillsValue =
		normalizedStyle.fills.type === 'uniform'
			? normalizedStyle.fills.value.map((fill, index) => {
					const resolved = resolveFillTokens(fill, tokenRefs);
					const alias = getAliasFromArray(fillsAliases, index);
					// Only apply fill-level alias to solid paints (gradient/image have nested bindings)
					if (alias && fill.type === 'solid') {
						return toTokenizedValue(resolved, alias, tokenRefs);
					}
					return resolved;
				})
			: [];
	const fills: NormalizedValue<Array<TokenizedValue<NormalizedFill>>> =
		normalizedStyle.fills.type === 'uniform'
			? { type: 'uniform', value: fillsValue }
			: { type: 'mixed', values: [] };

	const effectsValue =
		normalizedStyle.effects.type === 'uniform'
			? normalizedStyle.effects.value.map((effect, index) => {
					const resolved = resolveEffectTokens(effect, tokenRefs);
					const alias = getAliasFromArray(effectsAliases, index);
					return alias ? toTokenizedValue(resolved, alias, tokenRefs) : resolved;
				})
			: [];
	const effects: NormalizedValue<Array<TokenizedValue<NormalizedEffect>>> =
		normalizedStyle.effects.type === 'uniform'
			? { type: 'uniform', value: effectsValue }
			: { type: 'mixed', values: [] };

	const stroke = normalizedStyle.stroke
		? resolveStrokeTokens(normalizedStyle.stroke, strokeAliases, tokenRefs)
		: null;

	const corner = normalizedStyle.corner ? resolveCornerTokens(normalizedStyle.corner, tokenRefs) : null;

	const layout = resolveLayoutTokens(normalizedStyle.layout, tokenRefs);
	const layoutGrids = buildLayoutGrids(node, tokenRefs);
	const text = normalizedStyle.text
		? resolveTextTokens(normalizedStyle.text, extractedStyle.text, nodeBoundVariables, tokenRefs)
		: null;

	const visibleAlias = getAlias(nodeBoundVariables, 'visible');
	const opacityAlias = getAlias(nodeBoundVariables, 'opacity');
	const visibleValue = typeof node.visible === 'boolean' ? node.visible : undefined;
	const opacityValue =
		typeof extractedStyle.effects.opacity === 'number' ? extractedStyle.effects.opacity : undefined;

	return {
		...normalizedStyle,
		fills,
		effects,
		stroke,
		corner,
		layout: layoutGrids ? { ...layout, layoutGrids } : layout,
		text,
		visible: visibleValue === undefined ? undefined : applyAliasToken(visibleValue, visibleAlias, tokenRefs),
		opacity: opacityValue === undefined ? undefined : applyAliasToken(opacityValue, opacityAlias, tokenRefs),
	};
};

export class NodeDataBuilder {
	constructor(
		private readonly extractor = styleExtractor,
		private readonly normalizer = styleNormalizer,
		private readonly tokenRegistry: TokenRegistryPort = variableRegistry,
	) {}

	async build(node: SceneNode): Promise<BuiltNodeData> {
		const extractedStyle = this.extractor.extract(node);
		const compatibility = cssCompatibilityChecker.check(extractedStyle);

		if (!compatibility.compatible) {
			const svg = await exportSvg(node);
			return {
				props: { id: node.id, name: node.name },
				svgFallback: svg ?? undefined,
			};
		}

		const normalizedStyle = this.normalizer.normalize(extractedStyle);
		const tokensRef = await buildTokenRefs(extractedStyle.boundVariables, this.tokenRegistry);
		const tokenRefMap = buildTokenRefMap(tokensRef);
		const style = enrichStyle(normalizedStyle, extractedStyle, node, tokenRefMap);

		const props: BaseNodeProps = {
			id: node.id,
			name: node.name,
			style,
			boundVariables: extractedStyle.boundVariables,
		};

		return {
			props,
			instanceRef: await buildInstanceRef(node),
			tokensRef,
			assets: buildAssetRefs(normalizedStyle),
		};
	}
}

export const nodeDataBuilder = new NodeDataBuilder();

export const buildNodeData = async (node: SceneNode): Promise<BuiltNodeData> => nodeDataBuilder.build(node);
