import { toTokenizedValue } from './utils';
import type { ExtractedFillProps } from '../extract/fills';
import type {
	NormalizedColor,
	NormalizedFill,
	NormalizedGradientFill,
	NormalizedGradientStop,
	NormalizedImageFill,
	NormalizedSolidFill,
	NormalizedValue,
} from './types';

export class PaintNormalizer {
	normalizeFills(props: ExtractedFillProps): NormalizedValue<NormalizedFill[]> {
		const extracted = props.fills;
		if (!extracted) {
			return { type: 'uniform', value: [] };
		}

		if (extracted.type === 'range') {
			return {
				type: 'range-based',
				segments: extracted.segments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: this.normalizePaints(seg.value),
				})),
			} satisfies NormalizedValue<NormalizedFill[]>;
		}

		return { type: 'uniform', value: this.normalizePaints(extracted.value) };
	}

	normalizePaints(paints: ReadonlyArray<Paint> | undefined): NormalizedFill[] {
		if (!paints || !Array.isArray(paints)) {
			return [];
		}

		const normalized: NormalizedFill[] = [];
		for (let index = 0; index < paints.length; index += 1) {
			const paint = paints[index];
			if (paint.visible === false) continue;
			const normalizedPaint = this.normalizePaint(paint);
			if (normalizedPaint) normalized.push(normalizedPaint);
		}

		return normalized;
	}

	private normalizePaint(paint: Paint): NormalizedFill | null {
		if (paint.type === 'SOLID') {
			return this.normalizeSolid(paint);
		}

		if (paint.type === 'GRADIENT_LINEAR') {
			return this.normalizeGradient(paint, 'linear');
		}

		if (paint.type === 'GRADIENT_RADIAL') {
			return this.normalizeGradient(paint, 'radial');
		}

		if (paint.type === 'GRADIENT_ANGULAR') {
			return this.normalizeGradient(paint, 'angular');
		}

		if (paint.type === 'GRADIENT_DIAMOND') {
			return this.normalizeGradient(paint, 'diamond');
		}

		if (paint.type === 'IMAGE') {
			return this.normalizeImage(paint, paint.imageHash ?? null, paint.imageTransform ?? null);
		}

		if (paint.type === 'VIDEO') {
			return this.normalizeImage(paint, paint.videoHash ?? null, paint.videoTransform ?? null);
		}

		return null;
	}

	private normalizeSolid(paint: SolidPaint): NormalizedSolidFill {
		const opacity = paint.opacity ?? 1;
		const color = this.normalizeColor(paint.color, opacity);
		const alias = paint.boundVariables?.color;
		const normalized: NormalizedSolidFill = {
			type: 'solid',
			color: toTokenizedValue(color, alias),
		};

		if (paint.blendMode) normalized.blendMode = paint.blendMode;
		if (typeof paint.visible === 'boolean') normalized.visible = paint.visible;

		return normalized;
	}

	private normalizeGradientStops(paint: GradientPaint): NormalizedGradientStop[] {
		const paintOpacity = paint.opacity ?? 1;
		return paint.gradientStops.map((stop) => {
			const opacity = stop.color.a * paintOpacity;
			const color = this.normalizeRgbaColor(stop.color, opacity);
			const alias = stop.boundVariables?.color;
			return {
				position: stop.position,
				color: toTokenizedValue(color, alias),
			};
		});
	}

	private normalizeGradient(
		paint: GradientPaint,
		gradientType: NormalizedGradientFill['gradientType'],
	): NormalizedGradientFill {
		const normalized: NormalizedGradientFill = {
			type: 'gradient',
			gradientType,
			stops: this.normalizeGradientStops(paint),
			angle: this.calculateGradientAngle(paint.gradientTransform),
			transform: paint.gradientTransform,
		};

		if (paint.blendMode) normalized.blendMode = paint.blendMode;
		if (typeof paint.visible === 'boolean') normalized.visible = paint.visible;

		return normalized;
	}

	private normalizeFilters(filters?: ImageFilters): NormalizedImageFill['filters'] {
		return {
			exposure: filters?.exposure ?? null,
			contrast: filters?.contrast ?? null,
			saturation: filters?.saturation ?? null,
			temperature: filters?.temperature ?? null,
			tint: filters?.tint ?? null,
			highlights: filters?.highlights ?? null,
			shadows: filters?.shadows ?? null,
		};
	}

	private normalizeImage(
		paint: ImagePaint | VideoPaint,
		imageHash: string | null,
		imageTransform: Transform | null,
	): NormalizedImageFill {
		const normalized: NormalizedImageFill = {
			type: 'image',
			imageHash,
			scaleMode: paint.scaleMode,
			imageTransform,
			scalingFactor: paint.scalingFactor ?? null,
			rotation: paint.rotation ?? null,
			filters: this.normalizeFilters(paint.filters),
		};

		if (paint.blendMode) normalized.blendMode = paint.blendMode;
		if (typeof paint.visible === 'boolean') normalized.visible = paint.visible;

		return normalized;
	}

	private normalizeColor(color: RGB, opacity: number): NormalizedColor {
		const red = this.toChannel(color.r);
		const green = this.toChannel(color.g);
		const blue = this.toChannel(color.b);
		const alpha = opacity;

		return {
			hex: this.rgbToHex(color),
			rgb: `rgb(${red}, ${green}, ${blue})`,
			rgba: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
			opacity: alpha,
		};
	}

	private normalizeRgbaColor(color: RGBA, opacity: number): NormalizedColor {
		return this.normalizeColor({ r: color.r, g: color.g, b: color.b }, opacity);
	}

	private calculateGradientAngle(transform: Transform): number {
		const [[a], [c]] = transform;
		return Math.atan2(c, a) * (180 / Math.PI);
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

export const paintNormalizer = new PaintNormalizer();
