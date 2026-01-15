import { deepPick } from '../../utils';
import type { Uniform, FigmaFieldType } from './value-types';

export const BLEND_KEYS = ['opacity', 'blendMode'] satisfies ReadonlyArray<keyof MinimalBlendMixin>;

export const EFFECT_KEYS = ['effects', 'effectStyleId', 'isMask', 'maskType'] satisfies ReadonlyArray<keyof BlendMixin>;

export type ExtractedEffectProps = {
	opacity?: Uniform<FigmaFieldType<MinimalBlendMixin, 'opacity'>>;
	blendMode?: Uniform<FigmaFieldType<MinimalBlendMixin, 'blendMode'>>;
	effects?: Uniform<FigmaFieldType<BlendMixin, 'effects'>>;
	effectStyleId?: Uniform<FigmaFieldType<BlendMixin, 'effectStyleId'>>;
	isMask?: Uniform<FigmaFieldType<BlendMixin, 'isMask'>>;
	maskType?: Uniform<FigmaFieldType<BlendMixin, 'maskType'>>;
};

export class EffectsExtractor {
	extract(node: SceneNode): ExtractedEffectProps {
		const result: ExtractedEffectProps = {};

		if (this.hasMinimalBlendMixin(node)) {
			const raw = deepPick(node, BLEND_KEYS);
			if (raw.opacity !== undefined) {
				result.opacity = { type: 'uniform', value: raw.opacity };
			}
			if (raw.blendMode !== undefined) {
				result.blendMode = { type: 'uniform', value: raw.blendMode };
			}
		}

		if (this.hasBlendMixin(node)) {
			const raw = deepPick(node, EFFECT_KEYS);
			if (raw.effects !== undefined) {
				result.effects = { type: 'uniform', value: raw.effects };
			}
			if (raw.effectStyleId !== undefined) {
				result.effectStyleId = { type: 'uniform', value: raw.effectStyleId };
			}
			if (raw.isMask !== undefined) {
				result.isMask = { type: 'uniform', value: raw.isMask };
			}
			if (raw.maskType !== undefined) {
				result.maskType = { type: 'uniform', value: raw.maskType };
			}
		}

		return result;
	}

	private hasMinimalBlendMixin(node: SceneNode): node is SceneNode & MinimalBlendMixin {
		return 'opacity' in node;
	}

	private hasBlendMixin(node: SceneNode): node is SceneNode & BlendMixin {
		return 'effects' in node;
	}
}

export const effectsExtractor = new EffectsExtractor();
