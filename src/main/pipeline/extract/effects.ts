import { deepPick } from '../../utils';

export const BLEND_KEYS = ['opacity', 'blendMode'] satisfies ReadonlyArray<keyof MinimalBlendMixin>;

export const EFFECT_KEYS = ['effects', 'effectStyleId', 'isMask', 'maskType'] satisfies ReadonlyArray<keyof BlendMixin>;

type EffectKeys = (typeof BLEND_KEYS)[number] | (typeof EFFECT_KEYS)[number];

export type ExtractedEffectProps = Partial<Pick<MinimalBlendMixin & BlendMixin, EffectKeys>>;

const hasMinimalBlendMixin = (node: SceneNode): node is SceneNode & MinimalBlendMixin => 'opacity' in node;

const hasBlendMixin = (node: SceneNode): node is SceneNode & BlendMixin => 'effects' in node;

export const extractEffectProps = (node: SceneNode): ExtractedEffectProps => {
	const result: ExtractedEffectProps = {};

	if (hasMinimalBlendMixin(node)) {
		Object.assign(result, deepPick(node, BLEND_KEYS));
	}

	if (hasBlendMixin(node)) {
		Object.assign(result, deepPick(node, EFFECT_KEYS));
	}

	return result;
};
