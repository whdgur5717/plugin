import type { ExtractedStyle } from '../extract/types';

export type CssCompatibilityResult = {
	compatible: boolean;
};

export class CssCompatibilityChecker {
	check(style: ExtractedStyle): CssCompatibilityResult {
		if (this.hasIncompatibleEffects(style)) return { compatible: false };
		if (this.hasIncompatibleFills(style)) return { compatible: false };
		if (this.hasIncompatibleStrokes(style)) return { compatible: false };
		return { compatible: true };
	}

	private hasIncompatibleEffects(style: ExtractedStyle): boolean {
		const effects = style.effects.effects?.value;
		if (!effects) return false;
		return effects.some((e) => e.type === 'NOISE' || e.type === 'TEXTURE' || e.type === 'GLASS');
	}

	private hasIncompatibleFills(style: ExtractedStyle): boolean {
		const fillsData = style.fills.fills;
		if (!fillsData) return false;

		const paints = fillsData.type === 'uniform' ? fillsData.value : fillsData.segments.flatMap((seg) => seg.value);

		return paints.some((p) => p.type === 'GRADIENT_ANGULAR' || p.type === 'GRADIENT_DIAMOND');
	}

	private hasIncompatibleStrokes(style: ExtractedStyle): boolean {
		const paints = style.stroke.strokes?.value;
		const align = style.stroke.strokeAlign?.value;
		if (!paints || !align) return false;

		if (align !== 'CENTER') {
			return paints.some((p) => p.type.startsWith('GRADIENT_'));
		}
		return false;
	}

}

export const cssCompatibilityChecker = new CssCompatibilityChecker();
