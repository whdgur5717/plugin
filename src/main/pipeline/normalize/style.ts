import type { ExtractedStyle } from '../extract/types';
import type { NormalizedStyle } from './types';
import { normalizeEffects } from './effects';
import { normalizeFills } from './fills';
import { normalizeLayout } from './layout';
import { normalizeStroke } from './stroke';
import { normalizeText } from './text';

export const normalizeStyle = (style: ExtractedStyle): NormalizedStyle => ({
	fills: normalizeFills(style.fills),
	effects: normalizeEffects(style.effects),
	layout: normalizeLayout(style.layout),
	text: normalizeText(style.text),
	stroke: normalizeStroke(style.stroke),
});
