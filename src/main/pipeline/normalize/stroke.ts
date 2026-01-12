import { isNumber } from 'es-toolkit/compat';
import { normalizePaints } from './fills';
import type { ExtractedStrokeProps } from '../extract/stroke';
import type { NormalizedCorner, NormalizedStroke, NormalizedStrokeWeight } from './types';

const toNumber = (value: number | undefined): number => (isNumber(value) ? value : 0);

const isVariableAlias = (value: unknown): value is VariableAlias =>
	!!value &&
	typeof value === 'object' &&
	'type' in value &&
	'id' in value &&
	(value as { type?: unknown }).type === 'VARIABLE_ALIAS' &&
	typeof (value as { id?: unknown }).id === 'string';

const toTokenizedValue = <T>(value: T, alias?: VariableAlias | null) =>
	alias ? { tokenRef: { id: alias.id }, fallback: value } : value;

const getAlias = (boundVariables: Record<string, unknown> | undefined, key: string) => {
	const value = boundVariables?.[key];
	return isVariableAlias(value) ? value : null;
};

const buildStrokeWeight = (
	stroke: ExtractedStrokeProps,
	boundVariables?: Record<string, unknown>,
): NormalizedStrokeWeight => {
	const weightAlias = getAlias(boundVariables, 'strokeWeight');
	const topAlias = getAlias(boundVariables, 'strokeTopWeight');
	const rightAlias = getAlias(boundVariables, 'strokeRightWeight');
	const bottomAlias = getAlias(boundVariables, 'strokeBottomWeight');
	const leftAlias = getAlias(boundVariables, 'strokeLeftWeight');

	const weight = stroke.strokeWeight;
	const hasIndividual =
		isNumber(stroke.strokeTopWeight) &&
		isNumber(stroke.strokeRightWeight) &&
		isNumber(stroke.strokeBottomWeight) &&
		isNumber(stroke.strokeLeftWeight);

	if (weight === figma.mixed || !isNumber(weight)) {
		if (hasIndividual) {
			return {
				type: 'individual',
				top: toTokenizedValue(toNumber(stroke.strokeTopWeight), topAlias),
				right: toTokenizedValue(toNumber(stroke.strokeRightWeight), rightAlias),
				bottom: toTokenizedValue(toNumber(stroke.strokeBottomWeight), bottomAlias),
				left: toTokenizedValue(toNumber(stroke.strokeLeftWeight), leftAlias),
			};
		}
		return { type: 'uniform', value: toTokenizedValue(0, weightAlias) };
	}

	return { type: 'uniform', value: toTokenizedValue(weight, weightAlias) };
};

const buildCorner = (
	stroke: ExtractedStrokeProps,
	boundVariables?: Record<string, unknown>,
): NormalizedCorner | null => {
	const smoothing = isNumber(stroke.cornerSmoothing) ? stroke.cornerSmoothing : 0;
	const topLeftAlias = getAlias(boundVariables, 'topLeftRadius');
	const topRightAlias = getAlias(boundVariables, 'topRightRadius');
	const bottomRightAlias = getAlias(boundVariables, 'bottomRightRadius');
	const bottomLeftAlias = getAlias(boundVariables, 'bottomLeftRadius');
	const uniformAlias = topLeftAlias ?? topRightAlias ?? bottomRightAlias ?? bottomLeftAlias;

	if (stroke.cornerRadius === figma.mixed) {
		const values = [
			toTokenizedValue(toNumber(stroke.topLeftRadius), topLeftAlias),
			toTokenizedValue(toNumber(stroke.topRightRadius), topRightAlias),
			toTokenizedValue(toNumber(stroke.bottomRightRadius), bottomRightAlias),
			toTokenizedValue(toNumber(stroke.bottomLeftRadius), bottomLeftAlias),
		];
		return {
			radius: { type: 'mixed', values },
			smoothing,
		};
	}

	if (isNumber(stroke.cornerRadius)) {
		return {
			radius: { type: 'uniform', value: toTokenizedValue(stroke.cornerRadius, uniformAlias) },
			smoothing,
		};
	}

	const hasIndividual =
		isNumber(stroke.topLeftRadius) ||
		isNumber(stroke.topRightRadius) ||
		isNumber(stroke.bottomRightRadius) ||
		isNumber(stroke.bottomLeftRadius);

	if (hasIndividual) {
		const values = [
			toTokenizedValue(toNumber(stroke.topLeftRadius), topLeftAlias),
			toTokenizedValue(toNumber(stroke.topRightRadius), topRightAlias),
			toTokenizedValue(toNumber(stroke.bottomRightRadius), bottomRightAlias),
			toTokenizedValue(toNumber(stroke.bottomLeftRadius), bottomLeftAlias),
		];
		return {
			radius: { type: 'mixed', values },
			smoothing,
		};
	}

	return null;
};

const normalizeCap = (
	cap: StrokeCap | PluginAPI['mixed'] | undefined,
): StrokeCap | { type: 'mixed'; values: StrokeCap[] } => {
	if (cap === figma.mixed) {
		return {
			type: 'mixed',
			values: [
				'NONE',
				'ROUND',
				'SQUARE',
				'ARROW_LINES',
				'ARROW_EQUILATERAL',
				'DIAMOND_FILLED',
				'TRIANGLE_FILLED',
				'CIRCLE_FILLED',
			] as StrokeCap[],
		};
	}
	return cap ?? 'NONE';
};

const normalizeJoin = (
	join: StrokeJoin | PluginAPI['mixed'] | undefined,
): StrokeJoin | { type: 'mixed'; values: StrokeJoin[] } => {
	if (join === figma.mixed) {
		return { type: 'mixed', values: ['MITER', 'BEVEL', 'ROUND'] as StrokeJoin[] };
	}
	return join ?? 'MITER';
};

export const normalizeStroke = (
	props: ExtractedStrokeProps,
	boundVariables?: Record<string, unknown>,
): NormalizedStroke | null => {
	const paints = normalizePaints(props.strokes);
	if (paints.length === 0) return null;

	const normalized: NormalizedStroke = {
		paints,
		weight: buildStrokeWeight(props, boundVariables),
		align: props.strokeAlign ?? 'CENTER',
		cap: normalizeCap(props.strokeCap),
		join: normalizeJoin(props.strokeJoin),
		dashPattern: props.dashPattern ?? [],
		miterLimit: props.strokeMiterLimit ?? 0,
	};

	const corner = buildCorner(props, boundVariables);
	if (corner) normalized.corner = corner;
	if (props.vectorNetwork) normalized.vectorNetwork = props.vectorNetwork;

	return normalized;
};
