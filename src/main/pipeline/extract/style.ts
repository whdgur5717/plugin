import { extractEffectProps } from './effects';
import { extractFillProps } from './fills';
import { extractAutoLayout } from './layout';
import { extractStrokeProps } from './stroke';
import { extractTextProps } from './text';
import type { ExtractedTextProps } from './text';
import type { ExtractedBoundVariables, ExtractedStyle } from './types';

const toSortedArray = (values: Set<string>) => Array.from(values).sort();

const collectAliasIds = (target: Set<string>, aliases: unknown) => {
	if (!aliases || typeof aliases !== 'object') return;
	const values = Object.values(aliases as Record<string, unknown>);
	for (let index = 0; index < values.length; index += 1) {
		const alias = values[index];
		if (alias && typeof alias === 'object' && 'id' in alias) {
			const { id } = alias as { id: unknown };
			if (typeof id === 'string') {
				target.add(id);
			}
		}
	}
};

const isPaint = (value: unknown): value is Paint => typeof value === 'object' && value !== null && 'type' in value;

const collectPaintBoundVariables = (target: Set<string>, paint: Paint) => {
	collectAliasIds(target, 'boundVariables' in paint ? paint.boundVariables : undefined);
	if ('gradientStops' in paint && Array.isArray(paint.gradientStops)) {
		const stops = paint.gradientStops;
		for (let index = 0; index < stops.length; index += 1) {
			const stop = stops[index];
			collectAliasIds(target, stop.boundVariables);
		}
	}
};

const collectPaintsBoundVariables = (target: Set<string>, paints: unknown) => {
	if (!paints || paints === figma.mixed || !Array.isArray(paints)) return;
	for (let index = 0; index < paints.length; index += 1) {
		const paint = paints[index];
		if (isPaint(paint)) {
			collectPaintBoundVariables(target, paint);
		}
	}
};

const collectEffectsBoundVariables = (target: Set<string>, effects: unknown) => {
	if (!effects || !Array.isArray(effects)) return;
	for (let index = 0; index < effects.length; index += 1) {
		const effect = effects[index];
		if (effect && typeof effect === 'object' && 'boundVariables' in effect) {
			collectAliasIds(target, (effect as { boundVariables?: unknown }).boundVariables);
		}
	}
};

const collectTextBoundVariables = (target: Set<string>, text: ExtractedTextProps) => {
	collectAliasIds(target, (text as { boundVariables?: unknown }).boundVariables);
	collectPaintsBoundVariables(target, (text as { fills?: unknown }).fills);

	const { characters } = text as { characters?: unknown };
	if (!Array.isArray(characters)) return;
	for (let index = 0; index < characters.length; index += 1) {
		const segment = characters[index];
		if (!segment || typeof segment !== 'object') continue;
		const record = segment as Record<string, unknown>;
		collectAliasIds(target, record.boundVariables);
		collectPaintsBoundVariables(target, record.fills);
	}
};

const addSetValues = (target: Set<string>, source: Set<string>) => {
	const values = Array.from(source);
	for (let index = 0; index < values.length; index += 1) {
		target.add(values[index]);
	}
};

const collectBoundVariables = (
	style: Pick<ExtractedStyle, 'fills' | 'effects' | 'stroke' | 'text'>,
): ExtractedBoundVariables => {
	const fills = new Set<string>();
	const effects = new Set<string>();
	const stroke = new Set<string>();
	const text = new Set<string>();

	collectPaintsBoundVariables(fills, style.fills.fills);
	collectEffectsBoundVariables(effects, style.effects.effects);
	collectPaintsBoundVariables(stroke, style.stroke.strokes);
	collectTextBoundVariables(text, style.text);

	const ids = new Set<string>();
	addSetValues(ids, fills);
	addSetValues(ids, effects);
	addSetValues(ids, stroke);
	addSetValues(ids, text);

	return {
		ids: toSortedArray(ids),
		byGroup: {
			fills: toSortedArray(fills),
			effects: toSortedArray(effects),
			stroke: toSortedArray(stroke),
			text: toSortedArray(text),
		},
	};
};

export const extractStyle = (node: SceneNode): ExtractedStyle => {
	const fills = extractFillProps(node);
	const effects = extractEffectProps(node);
	const layout = extractAutoLayout(node);
	const text = extractTextProps(node);
	const stroke = extractStrokeProps(node);
	const boundVariables = collectBoundVariables({ fills, effects, stroke, text });

	return {
		fills,
		effects,
		layout,
		text,
		stroke,
		boundVariables,
	};
};
