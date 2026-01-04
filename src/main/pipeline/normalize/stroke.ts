import { isNumber } from 'es-toolkit/compat';
import type { ExtractedStrokeProps } from '../extract/stroke';
import type { NormalizedCorner, NormalizedStroke, NormalizedStrokeWeight } from './types';
import { normalizePaints } from './fills';

const toNumber = (value: number | undefined): number => (isNumber(value) ? value : 0);

const buildStrokeWeight = (stroke: ExtractedStrokeProps): NormalizedStrokeWeight => {
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
				top: toNumber(stroke.strokeTopWeight),
				right: toNumber(stroke.strokeRightWeight),
				bottom: toNumber(stroke.strokeBottomWeight),
				left: toNumber(stroke.strokeLeftWeight),
			};
		}
		return { type: 'uniform', value: 0 };
	}

	return { type: 'uniform', value: weight };
};

const buildCorner = (stroke: ExtractedStrokeProps): NormalizedCorner | null => {
	const smoothing = isNumber(stroke.cornerSmoothing) ? stroke.cornerSmoothing : 0;

	if (stroke.cornerRadius === figma.mixed) {
		const values = [
			stroke.topLeftRadius,
			stroke.topRightRadius,
			stroke.bottomRightRadius,
			stroke.bottomLeftRadius,
		].map((value) => (isNumber(value) ? value : 0));
		return {
			radius: { type: 'mixed', values },
			smoothing,
		};
	}

	if (isNumber(stroke.cornerRadius)) {
		return {
			radius: { type: 'uniform', value: stroke.cornerRadius },
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
			stroke.topLeftRadius,
			stroke.topRightRadius,
			stroke.bottomRightRadius,
			stroke.bottomLeftRadius,
		].map((value) => (isNumber(value) ? value : 0));
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

export const normalizeStroke = (props: ExtractedStrokeProps): NormalizedStroke | null => {
	const paints = normalizePaints(props.strokes);
	if (paints.length === 0) return null;

	const normalized: NormalizedStroke = {
		paints,
		weight: buildStrokeWeight(props),
		align: props.strokeAlign ?? 'CENTER',
		cap: normalizeCap(props.strokeCap),
		join: normalizeJoin(props.strokeJoin),
		dashPattern: props.dashPattern ?? [],
		miterLimit: props.strokeMiterLimit ?? 0,
	};

	const corner = buildCorner(props);
	if (corner) normalized.corner = corner;
	if (props.vectorNetwork) normalized.vectorNetwork = props.vectorNetwork;

	return normalized;
};
