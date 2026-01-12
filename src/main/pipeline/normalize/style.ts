import { normalizeEffects } from './effects';
import { normalizeFills } from './fills';
import { normalizeLayout } from './layout';
import { normalizeStroke } from './stroke';
import { normalizeText } from './text';
import type { ExtractedStyle } from '../extract/types';
import type { NormalizedStyle } from './types';

export const normalizeStyle = (style: ExtractedStyle): NormalizedStyle => ({
	fills: normalizeFills(style.fills),
	effects: normalizeEffects(style.effects),
	layout: normalizeLayout(style.layout, style.nodeBoundVariables),
	text: normalizeText(style.text, style.nodeBoundVariables),
	stroke: normalizeStroke(style.stroke, style.nodeBoundVariables),
});
