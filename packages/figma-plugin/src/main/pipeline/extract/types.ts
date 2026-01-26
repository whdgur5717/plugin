import type { ExtractedCornerProps } from './corner';
import type { ExtractedEffectProps } from './effects';
import type { ExtractedFillProps } from './fills';
import type { ExtractedLayoutProps } from './layout';
import type { ExtractedStrokeProps } from './stroke';
import type { ExtractedTextProps } from './text';

export type ExtractedBoundVariables = {
	ids: string[];
	byGroup: {
		node: string[];
		fills: string[];
		effects: string[];
		stroke: string[];
		text: string[];
		layoutGrids: string[];
		componentProps: string[];
	};
};

export interface ExtractedStyle {
	nodeType: string;
	fills: ExtractedFillProps;
	effects: ExtractedEffectProps;
	layout: ExtractedLayoutProps;
	text: ExtractedTextProps;
	stroke: ExtractedStrokeProps;
	corner: ExtractedCornerProps;
	boundVariables: ExtractedBoundVariables;
	nodeBoundVariables?: SceneNode['boundVariables'];
}
