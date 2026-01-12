import { extractEffectProps } from './effects';
import { extractFillProps } from './fills';
import { extractAutoLayout } from './layout';
import { extractStrokeProps } from './stroke';
import { extractTextProps } from './text';
import type { ExtractedTextProps } from './text';
import type { ExtractedBoundVariables, ExtractedStyle } from './types';

const toSortedArray = (values: Set<string>) => Array.from(values).sort();

type BoundVariableValue = VariableAlias | VariableAlias[] | { [key: string]: BoundVariableValue };
type BoundVariables = Record<string, BoundVariableValue>;

const isVariableAlias = (value: unknown): value is VariableAlias => {
	if (!value || typeof value !== 'object') return false;
	const record = value as { id?: unknown; type?: unknown };
	if (typeof record.id !== 'string') return false;
	if (typeof record.type === 'string' && record.type !== 'VARIABLE_ALIAS') return false;
	return true;
};

const NODE_BOUND_VARIABLE_KEYS = new Set([
	'width',
	'height',
	'minWidth',
	'maxWidth',
	'minHeight',
	'maxHeight',
	'itemSpacing',
	'counterAxisSpacing',
	'paddingLeft',
	'paddingRight',
	'paddingTop',
	'paddingBottom',
	'topLeftRadius',
	'topRightRadius',
	'bottomLeftRadius',
	'bottomRightRadius',
	'strokeWeight',
	'strokeTopWeight',
	'strokeRightWeight',
	'strokeBottomWeight',
	'strokeLeftWeight',
	'gridRowGap',
	'gridColumnGap',
	'visible',
	'opacity',
	'characters',
	'fills',
	'strokes',
	'effects',
]);

const warnUnknownNodeBoundVariableKeys = (node: SceneNode) => {
	if (!('boundVariables' in node)) return;
	const boundVariables = (node as SceneNode & { boundVariables?: BoundVariables }).boundVariables;
	if (!boundVariables) return;
	const keys = Object.keys(boundVariables);
	for (let index = 0; index < keys.length; index += 1) {
		const key = keys[index];
		if (!NODE_BOUND_VARIABLE_KEYS.has(key)) {
			console.warn('Unknown boundVariables key', { nodeId: node.id, nodeType: node.type, key });
		}
	}
};

const collectAliasIds = (target: Set<string>, aliases: BoundVariableValue | undefined) => {
	if (!aliases) return;
	if (Array.isArray(aliases)) {
		for (let index = 0; index < aliases.length; index += 1) {
			collectAliasIds(target, aliases[index]);
		}
		return;
	}
	if (isVariableAlias(aliases)) {
		target.add(aliases.id);
		return;
	}
	const values = Object.values(aliases);
	for (let index = 0; index < values.length; index += 1) {
		collectAliasIds(target, values[index]);
	}
};

const isPaint = (value: unknown): value is Paint => typeof value === 'object' && value !== null && 'type' in value;

const collectPaintBoundVariables = (target: Set<string>, paint: Paint) => {
	const boundVariables = (paint as Paint & { boundVariables?: BoundVariableValue }).boundVariables;
	collectAliasIds(target, boundVariables);
	if ('gradientStops' in paint && Array.isArray(paint.gradientStops)) {
		const stops = paint.gradientStops;
		for (let index = 0; index < stops.length; index += 1) {
			const stop = stops[index];
			const stopBoundVariables = (stop as ColorStop & { boundVariables?: BoundVariableValue }).boundVariables;
			collectAliasIds(target, stopBoundVariables);
		}
	}
};

const collectPaintsBoundVariables = (
	target: Set<string>,
	paints: ReadonlyArray<Paint> | PluginAPI['mixed'] | undefined,
) => {
	if (!paints || paints === figma.mixed || !Array.isArray(paints)) return;
	for (let index = 0; index < paints.length; index += 1) {
		const paint = paints[index];
		if (isPaint(paint)) {
			collectPaintBoundVariables(target, paint);
		}
	}
};
const collectEffectsBoundVariables = (
	target: Set<string>,
	effects: ReadonlyArray<Effect> | PluginAPI['mixed'] | undefined,
) => {
	if (!effects || effects === figma.mixed || !Array.isArray(effects)) return;
	for (let index = 0; index < effects.length; index += 1) {
		const effect = effects[index];
		const boundVariables = (effect as Effect & { boundVariables?: BoundVariableValue }).boundVariables;
		collectAliasIds(target, boundVariables);
	}
};

const collectNodeBoundVariables = (target: Set<string>, node: SceneNode) => {
	if ('boundVariables' in node) {
		warnUnknownNodeBoundVariableKeys(node);
		collectAliasIds(target, (node as { boundVariables?: BoundVariableValue }).boundVariables);
	}
};

const collectLayoutGridBoundVariables = (target: Set<string>, node: SceneNode) => {
	if (!('layoutGrids' in node)) return;
	const grids = (node as { layoutGrids?: ReadonlyArray<LayoutGrid> }).layoutGrids;
	if (!Array.isArray(grids)) return;
	for (let index = 0; index < grids.length; index += 1) {
		const grid = grids[index];
		collectAliasIds(target, grid?.boundVariables);
	}
};

const collectComponentPropsBoundVariables = (target: Set<string>, node: SceneNode) => {
	if (!('componentProperties' in node)) return;
	const componentProps = (node as { componentProperties?: Record<string, { boundVariables?: unknown }> })
		.componentProperties;
	if (!componentProps || typeof componentProps !== 'object') return;
	Object.values(componentProps).forEach((prop) => {
		if (prop && typeof prop === 'object') {
			collectAliasIds(target, (prop as { boundVariables?: BoundVariableValue }).boundVariables);
		}
	});
};

const collectTextBoundVariables = (target: Set<string>, text: ExtractedTextProps) => {
	collectAliasIds(target, (text as { boundVariables?: BoundVariableValue }).boundVariables);
	collectPaintsBoundVariables(target, (text as { fills?: ReadonlyArray<Paint> | PluginAPI['mixed'] }).fills);

	const { characters } = text as { characters?: unknown };
	if (!Array.isArray(characters)) return;
	for (let index = 0; index < characters.length; index += 1) {
		const segment = characters[index];
		if (!segment || typeof segment !== 'object') continue;
		const record = segment as Record<string, unknown>;
		collectAliasIds(target, record.boundVariables as BoundVariableValue | undefined);
		collectPaintsBoundVariables(target, record.fills as ReadonlyArray<Paint> | PluginAPI['mixed'] | undefined);
	}
};

const addSetValues = (target: Set<string>, source: Set<string>) => {
	const values = Array.from(source);
	for (let index = 0; index < values.length; index += 1) {
		target.add(values[index]);
	}
};

const collectBoundVariables = (
	node: SceneNode,
	style: Pick<ExtractedStyle, 'fills' | 'effects' | 'stroke' | 'text'>,
): ExtractedBoundVariables => {
	const nodeBound = new Set<string>();
	const fills = new Set<string>();
	const effects = new Set<string>();
	const stroke = new Set<string>();
	const text = new Set<string>();
	const layoutGrids = new Set<string>();
	const componentProps = new Set<string>();

	collectNodeBoundVariables(nodeBound, node);
	collectPaintsBoundVariables(fills, style.fills.fills);
	collectEffectsBoundVariables(effects, style.effects.effects);
	collectPaintsBoundVariables(stroke, style.stroke.strokes);
	collectTextBoundVariables(text, style.text);
	collectLayoutGridBoundVariables(layoutGrids, node);
	collectComponentPropsBoundVariables(componentProps, node);

	const ids = new Set<string>();
	addSetValues(ids, nodeBound);
	addSetValues(ids, fills);
	addSetValues(ids, effects);
	addSetValues(ids, stroke);
	addSetValues(ids, text);
	addSetValues(ids, layoutGrids);
	addSetValues(ids, componentProps);

	return {
		ids: toSortedArray(ids),
		byGroup: {
			node: toSortedArray(nodeBound),
			fills: toSortedArray(fills),
			effects: toSortedArray(effects),
			stroke: toSortedArray(stroke),
			text: toSortedArray(text),
			layoutGrids: toSortedArray(layoutGrids),
			componentProps: toSortedArray(componentProps),
		},
	};
};

export const extractStyle = (node: SceneNode): ExtractedStyle => {
	const fills = extractFillProps(node);
	const effects = extractEffectProps(node);
	const layout = extractAutoLayout(node);
	const text = extractTextProps(node);
	const stroke = extractStrokeProps(node);
	const boundVariables = collectBoundVariables(node, { fills, effects, stroke, text });
	const nodeBoundVariables = 'boundVariables' in node ? node.boundVariables : undefined;

	return {
		nodeType: node.type,
		fills,
		effects,
		layout,
		text,
		stroke,
		boundVariables,
		nodeBoundVariables,
	};
};
