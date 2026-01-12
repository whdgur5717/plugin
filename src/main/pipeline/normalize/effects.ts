import type { ExtractedEffectProps } from '../extract/effects';
import type {
	NormalizedBlurEffect,
	NormalizedColor,
	NormalizedEffect,
	NormalizedGlassEffect,
	NormalizedNoiseEffect,
	NormalizedShadowEffect,
	NormalizedTextureEffect,
	NormalizedValue,
	TokenizedValue,
} from './types';

const toChannel = (value: number) => Math.round(value * 255);

const toHex = (value: number) => toChannel(value).toString(16).padStart(2, '0');

const rgbToHex = (color: RGB) => `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;

const normalizeColor = (color: RGB, opacity: number): NormalizedColor => {
	const red = toChannel(color.r);
	const green = toChannel(color.g);
	const blue = toChannel(color.b);

	return {
		hex: rgbToHex(color),
		rgb: `rgb(${red}, ${green}, ${blue})`,
		rgba: `rgba(${red}, ${green}, ${blue}, ${opacity})`,
		opacity,
	};
};

const normalizeRgbaColor = (color: RGBA): NormalizedColor =>
	normalizeColor({ r: color.r, g: color.g, b: color.b }, color.a);

const isVariableAlias = (value: unknown): value is VariableAlias =>
	!!value &&
	typeof value === 'object' &&
	'type' in value &&
	'id' in value &&
	(value as { type?: unknown }).type === 'VARIABLE_ALIAS' &&
	typeof (value as { id?: unknown }).id === 'string';

const toTokenizedValue = <T>(value: T, alias?: VariableAlias | null): TokenizedValue<T> =>
	alias ? { tokenRef: { id: alias.id }, fallback: value } : value;

const toShadow = (effect: DropShadowEffect | InnerShadowEffect): NormalizedShadowEffect => {
	const boundVariables = effect.boundVariables;
	const colorAlias = isVariableAlias(boundVariables?.color) ? boundVariables?.color : null;
	const offsetXAlias = isVariableAlias(boundVariables?.offsetX) ? boundVariables?.offsetX : null;
	const offsetYAlias = isVariableAlias(boundVariables?.offsetY) ? boundVariables?.offsetY : null;
	const radiusAlias = isVariableAlias(boundVariables?.radius) ? boundVariables?.radius : null;
	const spreadAlias = isVariableAlias(boundVariables?.spread) ? boundVariables?.spread : null;
	const spreadValue = typeof effect.spread === 'number' ? effect.spread : null;

	return {
		type: 'shadow',
		shadowType: effect.type === 'DROP_SHADOW' ? 'drop' : 'inner',
		color: toTokenizedValue(normalizeRgbaColor(effect.color), colorAlias),
		offset: {
			x: toTokenizedValue(effect.offset.x, offsetXAlias),
			y: toTokenizedValue(effect.offset.y, offsetYAlias),
		},
		radius: toTokenizedValue(effect.radius, radiusAlias),
		spread: spreadValue === null ? null : toTokenizedValue(spreadValue, spreadAlias),
		blendMode: effect.blendMode,
		visible: effect.visible,
		showShadowBehindNode: effect.type === 'DROP_SHADOW' ? effect.showShadowBehindNode : undefined,
	};
};

const toBlur = (effect: BlurEffect): NormalizedBlurEffect => {
	const radiusAlias = isVariableAlias(effect.boundVariables?.radius) ? effect.boundVariables?.radius : null;

	return {
		type: 'blur',
		blurType: effect.type === 'BACKGROUND_BLUR' ? 'background' : 'layer',
		radius: toTokenizedValue(effect.radius, radiusAlias),
		visible: effect.visible,
		progressive:
			effect.blurType === 'PROGRESSIVE'
				? {
						startRadius: effect.startRadius,
						startOffset: effect.startOffset,
						endOffset: effect.endOffset,
					}
				: null,
	};
};

const toNoise = (effect: NoiseEffect): NormalizedNoiseEffect => ({
	type: 'noise',
	noiseType: effect.noiseType === 'DUOTONE' ? 'duotone' : effect.noiseType === 'MULTITONE' ? 'multitone' : 'monotone',
	color: normalizeRgbaColor(effect.color),
	secondaryColor: 'secondaryColor' in effect ? normalizeRgbaColor(effect.secondaryColor) : undefined,
	opacity: 'opacity' in effect ? effect.opacity : undefined,
	noiseSize: effect.noiseSize,
	density: effect.density,
	blendMode: effect.blendMode,
	visible: effect.visible,
});

const toTexture = (effect: TextureEffect): NormalizedTextureEffect => ({
	type: 'texture',
	noiseSize: effect.noiseSize,
	radius: effect.radius,
	clipToShape: effect.clipToShape,
	visible: effect.visible,
});

const toGlass = (effect: GlassEffect): NormalizedGlassEffect => ({
	type: 'glass',
	lightIntensity: effect.lightIntensity,
	lightAngle: effect.lightAngle,
	refraction: effect.refraction,
	depth: effect.depth,
	dispersion: effect.dispersion,
	radius: effect.radius,
	visible: effect.visible,
});

const normalizeEffect = (effect: Effect): NormalizedEffect | null => {
	switch (effect.type) {
		case 'DROP_SHADOW':
		case 'INNER_SHADOW':
			return toShadow(effect);
		case 'LAYER_BLUR':
		case 'BACKGROUND_BLUR':
			return toBlur(effect);
		case 'NOISE':
			return toNoise(effect);
		case 'TEXTURE':
			return toTexture(effect);
		case 'GLASS':
			return toGlass(effect);
		default:
			return null;
	}
};

export const normalizeEffects = (props: ExtractedEffectProps): NormalizedValue<NormalizedEffect[]> => {
	const effects = props.effects;

	if (effects === figma.mixed) {
		console.warn('Unexpected mixed effects on single node');
		return { type: 'mixed', values: [] };
	}

	if (!effects || !Array.isArray(effects)) {
		return { type: 'uniform', value: [] };
	}

	const normalized: NormalizedEffect[] = [];
	for (let index = 0; index < effects.length; index += 1) {
		const effect = effects[index];
		const normalizedEffect = normalizeEffect(effect);
		if (normalizedEffect) normalized.push(normalizedEffect);
	}

	return { type: 'uniform', value: normalized };
};
