import type { ExtractedEffectProps } from './effects';
import type { ExtractedFillProps } from './fills';
import type { ExtractedLayoutProps } from './layout';
import type { ExtractedStrokeProps } from './stroke';
import type { ExtractedTextProps } from './text';

export type ExtractedBoundVariables = {
	ids: string[];
	byGroup: {
		fills: string[];
		effects: string[];
		stroke: string[];
		text: string[];
	};
};

export interface ExtractedStyle {
	fills: ExtractedFillProps;
	effects: ExtractedEffectProps;
	layout: ExtractedLayoutProps;
	text: ExtractedTextProps;
	stroke: ExtractedStrokeProps;
	boundVariables: ExtractedBoundVariables;
}
