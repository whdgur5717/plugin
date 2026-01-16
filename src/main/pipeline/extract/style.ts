import type { ExtractedTextProps } from './text';
import type { ExtractedBoundVariables, ExtractedStyle } from './types';
import { variableAliasSchema } from '../shared/schemas';
import { cornerExtractor } from './corner';
import { effectsExtractor } from './effects';
import { fillExtractor } from './fills';
import { layoutExtractor } from './layout';
import { strokeExtractor } from './stroke';
import { textExtractor } from './text';

const toSortedArray = (values: Set<string>) => Array.from(values).sort();

type BoundVariableValue = VariableAlias | VariableAlias[] | { [key: string]: BoundVariableValue };

const collectAliasIds = (target: Set<string>, aliases: BoundVariableValue | undefined) => {
	// aliases is undefined
	if (!aliases) return;
	// aliases is VariableAlias[]
	if (Array.isArray(aliases)) {
		for (let index = 0; index < aliases.length; index += 1) {
			collectAliasIds(target, aliases[index]);
		}
		return;
	}
	// aliases is VariableAlias
	const parsed = variableAliasSchema.safeParse(aliases);
	if (parsed.success) {
		target.add(parsed.data.id);
		return;
	}
	// aliases is { [key: string]: BoundVariableValue }
	const values = Object.values(aliases) as BoundVariableValue[];
	for (let index = 0; index < values.length; index += 1) {
		collectAliasIds(target, values[index]);
	}
};

const collectPaintBoundVariables = (target: Set<string>, paint: Paint) => {
	if ('boundVariables' in paint) {
		collectAliasIds(target, paint.boundVariables);
	}

	if ('gradientStops' in paint && Array.isArray(paint.gradientStops)) {
		const stops = paint.gradientStops;
		for (let index = 0; index < stops.length; index += 1) {
			const stop = stops[index];
			if ('boundVariables' in stop) {
				collectAliasIds(target, stop.boundVariables);
			}
		}
	}
};

const collectPaintsBoundVariables = (
	target: Set<string>,
	paints: ReadonlyArray<Paint> | PluginAPI['mixed'] | undefined,
) => {
	if (!paints || paints === figma.mixed || !Array.isArray(paints)) return;
	for (let index = 0; index < paints.length; index += 1) {
		collectPaintBoundVariables(target, paints[index]);
	}
};

const collectExtractedFillsBoundVariables = (
	target: Set<string>,
	fills: import('./fills').ExtractedFillProps['fills'],
) => {
	if (!fills) return;
	if (fills.type === 'uniform') {
		collectPaintsBoundVariables(target, fills.value);
	} else if (fills.type === 'range') {
		for (const seg of fills.segments) {
			collectPaintsBoundVariables(target, seg.value);
		}
	}
};
const collectEffectsBoundVariables = (target: Set<string>, effects: ReadonlyArray<Effect> | undefined) => {
	if (!effects) return;
	for (const effect of effects) {
		if ('boundVariables' in effect) {
			collectAliasIds(target, effect.boundVariables);
		}
	}
};

const collectNodeBoundVariables = (target: Set<string>, node: SceneNode) => {
	if ('boundVariables' in node) {
		collectAliasIds(target, node.boundVariables);
	}
};

const collectLayoutGridBoundVariables = (target: Set<string>, node: SceneNode) => {
	if (!('layoutGrids' in node)) return;
	const grids = node.layoutGrids;
	for (let index = 0; index < grids.length; index += 1) {
		const grid = grids[index];
		collectAliasIds(target, grid?.boundVariables);
	}
};

const collectComponentPropsBoundVariables = (target: Set<string>, node: SceneNode) => {
	if (!('componentProperties' in node)) return;
	const componentProps = node.componentProperties;
	if (!componentProps || typeof componentProps !== 'object') return;

	Object.values(componentProps).forEach((prop) => {
		if (prop && typeof prop === 'object' && 'boundVariables' in prop) {
			collectAliasIds(target, prop.boundVariables);
		}
	});
};

const collectTextBoundVariables = (target: Set<string>, text: ExtractedTextProps) => {
	// Node-level boundVariables (now Uniform-wrapped)
	if (text.boundVariables?.value) {
		collectAliasIds(target, text.boundVariables.value);
	}

	// Node-level fills (now Uniform-wrapped)
	if (text.fills?.value) {
		collectPaintsBoundVariables(target, text.fills.value);
	}

	const { characters } = text;
	if (!Array.isArray(characters)) return;

	for (let index = 0; index < characters.length; index += 1) {
		const segment = characters[index];
		if (!segment || typeof segment !== 'object') continue;

		// Segment boundVariables (Uniform-wrapped)
		if (segment.boundVariables?.value) {
			collectAliasIds(target, segment.boundVariables.value);
		}
		// Segment fills (Uniform-wrapped)
		if (segment.fills?.value) {
			collectPaintsBoundVariables(target, segment.fills.value);
		}
	}
};

const addSetValues = (target: Set<string>, source: Set<string>) => {
	source.forEach((value) => {
		target.add(value);
	});
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
	collectExtractedFillsBoundVariables(fills, style.fills.fills);
	if (style.effects.effects) {
		collectEffectsBoundVariables(effects, style.effects.effects.value);
	}
	if (style.stroke.strokes?.value) {
		collectPaintsBoundVariables(stroke, style.stroke.strokes.value);
	}
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

export class StyleExtractor {
	constructor(
		private readonly fills = fillExtractor,
		private readonly effects = effectsExtractor,
		private readonly layout = layoutExtractor,
		private readonly text = textExtractor,
		private readonly stroke = strokeExtractor,
		private readonly corner = cornerExtractor,
	) {}

	extract(node: SceneNode): ExtractedStyle {
		const fills = this.fills.extract(node);
		const effects = this.effects.extract(node);
		const layout = this.layout.extract(node);
		const text = this.text.extract(node);
		const stroke = this.stroke.extract(node);
		const corner = this.corner.extract(node);
		const boundVariables = collectBoundVariables(node, { fills, effects, stroke, text });
		const nodeBoundVariables = 'boundVariables' in node ? node.boundVariables : undefined;

		return {
			nodeType: node.type,
			fills,
			effects,
			layout,
			text,
			stroke,
			corner,
			boundVariables,
			nodeBoundVariables,
		};
	}
}

export const styleExtractor = new StyleExtractor();
