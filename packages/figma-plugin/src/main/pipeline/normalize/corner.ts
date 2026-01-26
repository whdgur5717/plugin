import { isNumber } from 'es-toolkit/compat';
import { toTokenizedValue } from './utils';
import type { ExtractedCornerProps } from '../extract/corner';
import type { NormalizedCorner } from './types';

export class CornerNormalizer {
	normalizeCorner(
		props: ExtractedCornerProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedCorner | null {
		const extracted = props.cornerRadius;
		if (!extracted) return null;

		const smoothing = isNumber(props.cornerSmoothing?.value) ? props.cornerSmoothing.value : 0;
		const topLeftAlias = boundVariables?.topLeftRadius;
		const topRightAlias = boundVariables?.topRightRadius;
		const bottomRightAlias = boundVariables?.bottomRightRadius;
		const bottomLeftAlias = boundVariables?.bottomLeftRadius;
		const uniformAlias = topLeftAlias ?? topRightAlias ?? bottomRightAlias ?? bottomLeftAlias;

		if (extracted.type === 'corner') {
			const values = [
				toTokenizedValue(extracted.topLeft, topLeftAlias),
				toTokenizedValue(extracted.topRight, topRightAlias),
				toTokenizedValue(extracted.bottomRight, bottomRightAlias),
				toTokenizedValue(extracted.bottomLeft, bottomLeftAlias),
			];
			return {
				radius: { type: 'mixed', values },
				smoothing,
			};
		}

		return {
			radius: { type: 'uniform', value: toTokenizedValue(extracted.value, uniformAlias) },
			smoothing,
		};
	}
}

export const cornerNormalizer = new CornerNormalizer();
