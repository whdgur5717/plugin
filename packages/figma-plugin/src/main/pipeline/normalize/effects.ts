import { toTokenizedValue } from './utils';
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
} from './types';

export class EffectsNormalizer {
	normalizeEffects(props: ExtractedEffectProps): NormalizedValue<NormalizedEffect[]> {
		const extracted = props.effects;

		if (!extracted) {
			return { type: 'uniform', value: [] };
		}

		const effects = extracted.value;
		const normalized: NormalizedEffect[] = [];
		for (let index = 0; index < effects.length; index += 1) {
			const effect = effects[index];
			if (!effect) continue;
			const normalizedEffect = this.normalizeEffect(effect);
			if (normalizedEffect) normalized.push(normalizedEffect);
		}

		return { type: 'uniform', value: normalized };
	}

	private normalizeEffect(effect: Effect): NormalizedEffect | null {
		switch (effect.type) {
			case 'DROP_SHADOW':
			case 'INNER_SHADOW':
				return this.toShadow(effect);
			case 'LAYER_BLUR':
			case 'BACKGROUND_BLUR':
				return this.toBlur(effect);
			case 'NOISE':
				return this.toNoise(effect);
			case 'TEXTURE':
				return this.toTexture(effect);
			case 'GLASS':
				return this.toGlass(effect);
			default:
				return null;
		}
	}

	private toShadow(effect: DropShadowEffect | InnerShadowEffect): NormalizedShadowEffect {
		const boundVariables = effect.boundVariables;
		const colorAlias = boundVariables?.color;
		const offsetXAlias = boundVariables?.offsetX;
		const offsetYAlias = boundVariables?.offsetY;
		const radiusAlias = boundVariables?.radius;
		const spreadAlias = boundVariables?.spread;
		const spreadValue = typeof effect.spread === 'number' ? effect.spread : null;

		return {
			type: 'shadow',
			shadowType: effect.type === 'DROP_SHADOW' ? 'drop' : 'inner',
			color: toTokenizedValue(this.normalizeRgbaColor(effect.color), colorAlias),
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
	}

	private toBlur(effect: BlurEffect): NormalizedBlurEffect {
		const radiusAlias = effect.boundVariables?.radius;

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
	}

	private toNoise(effect: NoiseEffect): NormalizedNoiseEffect {
		return {
			type: 'noise',
			noiseType:
				effect.noiseType === 'DUOTONE'
					? 'duotone'
					: effect.noiseType === 'MULTITONE'
						? 'multitone'
						: 'monotone',
			color: this.normalizeRgbaColor(effect.color),
			secondaryColor: 'secondaryColor' in effect ? this.normalizeRgbaColor(effect.secondaryColor) : undefined,
			opacity: 'opacity' in effect ? effect.opacity : undefined,
			noiseSize: effect.noiseSize,
			density: effect.density,
			blendMode: effect.blendMode,
			visible: effect.visible,
		};
	}

	private toTexture(effect: TextureEffect): NormalizedTextureEffect {
		return {
			type: 'texture',
			noiseSize: effect.noiseSize,
			radius: effect.radius,
			clipToShape: effect.clipToShape,
			visible: effect.visible,
		};
	}

	private toGlass(effect: GlassEffect): NormalizedGlassEffect {
		return {
			type: 'glass',
			lightIntensity: effect.lightIntensity,
			lightAngle: effect.lightAngle,
			refraction: effect.refraction,
			depth: effect.depth,
			dispersion: effect.dispersion,
			radius: effect.radius,
			visible: effect.visible,
		};
	}

	private normalizeColor(color: RGB, opacity: number): NormalizedColor {
		const red = this.toChannel(color.r);
		const green = this.toChannel(color.g);
		const blue = this.toChannel(color.b);

		return {
			hex: this.rgbToHex(color),
			rgb: `rgb(${red}, ${green}, ${blue})`,
			rgba: `rgba(${red}, ${green}, ${blue}, ${opacity})`,
			opacity,
		};
	}

	private normalizeRgbaColor(color: RGBA): NormalizedColor {
		return this.normalizeColor({ r: color.r, g: color.g, b: color.b }, color.a);
	}

	private toChannel(value: number): number {
		return Math.round(value * 255);
	}

	private toHex(value: number): string {
		return this.toChannel(value).toString(16).padStart(2, '0');
	}

	private rgbToHex(color: RGB): string {
		return `#${this.toHex(color.r)}${this.toHex(color.g)}${this.toHex(color.b)}`;
	}
}

export const effectsNormalizer = new EffectsNormalizer();
