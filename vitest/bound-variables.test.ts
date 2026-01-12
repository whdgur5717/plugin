/// <reference types="@figma/plugin-typings" />
/// <reference types="vitest" />

import { beforeAll, describe, expect, it } from 'vitest';
import { extractStyle } from '../src/main/pipeline/extract/style';
import { normalizeEffects } from '../src/main/pipeline/normalize/effects';
import { normalizeFills } from '../src/main/pipeline/normalize/fills';
import { normalizeLayout } from '../src/main/pipeline/normalize/layout';
import { normalizeStroke } from '../src/main/pipeline/normalize/stroke';
import { normalizeText } from '../src/main/pipeline/normalize/text';
import type { ExtractedEffectProps } from '../src/main/pipeline/extract/effects';
import type { ExtractedFillProps } from '../src/main/pipeline/extract/fills';
import type { ExtractedLayoutProps } from '../src/main/pipeline/extract/layout';
import type { ExtractedStrokeProps } from '../src/main/pipeline/extract/stroke';
import type { ExtractedTextProps } from '../src/main/pipeline/extract/text';

const alias = (id: string): VariableAlias => ({ type: 'VARIABLE_ALIAS', id });

const isTokenizedValue = (value: unknown): value is { tokenRef: { id: string } } =>
	!!value && typeof value === 'object' && 'tokenRef' in value;

beforeAll(() => {
	(globalThis as unknown as { figma: { mixed: symbol } }).figma = { mixed: Symbol('mixed') };
});

describe('boundVariables coverage', () => {
	it('collects node/layoutGrid/componentProps boundVariables in extractStyle', () => {
		const node = {
			id: '1',
			name: 'Test',
			type: 'FRAME',
			boundVariables: {
				width: alias('v-width'),
				paddingLeft: alias('v-padding'),
			},
			fills: [],
			effects: [],
			strokes: [],
			layoutGrids: [{ boundVariables: { sectionSize: alias('v-grid') } }],
			componentProperties: {
				size: { type: 'VARIANT', value: 'Large', boundVariables: { value: alias('v-prop') } },
			},
			layoutMode: 'HORIZONTAL',
			primaryAxisSizingMode: 'AUTO',
			counterAxisSizingMode: 'AUTO',
			primaryAxisAlignItems: 'MIN',
			counterAxisAlignItems: 'MIN',
			itemSpacing: 8,
			counterAxisSpacing: 4,
			paddingLeft: 12,
			paddingRight: 12,
			paddingTop: 8,
			paddingBottom: 8,
			strokesIncludedInLayout: true,
			itemReverseZIndex: false,
			layoutWrap: 'NO_WRAP',
			x: 0,
			y: 0,
			width: 100,
			height: 50,
			constraints: { horizontal: 'MIN', vertical: 'MIN' },
		} as unknown as SceneNode;

		const extracted = extractStyle(node);

		expect(extracted.boundVariables.byGroup.node).toContain('v-width');
		expect(extracted.boundVariables.byGroup.layoutGrids).toContain('v-grid');
		expect(extracted.boundVariables.byGroup.componentProps).toContain('v-prop');
		expect(extracted.nodeBoundVariables).toBe(node.boundVariables);
	});

	it('tokenizes layout bound variables', () => {
		const layout: ExtractedLayoutProps = {
			layoutMode: 'GRID',
			x: 0,
			y: 0,
			width: 120,
			height: 80,
			minWidth: 60,
			maxWidth: 240,
			minHeight: 40,
			maxHeight: 160,
			gridRowGap: 8,
			gridColumnGap: 12,
			paddingLeft: 4,
			paddingRight: 4,
			paddingTop: 2,
			paddingBottom: 2,
		};
		const boundVariables = {
			width: alias('v-width'),
			height: alias('v-height'),
			minWidth: alias('v-min-width'),
			gridRowGap: alias('v-row-gap'),
			paddingLeft: alias('v-padding-left'),
		};

		const normalized = normalizeLayout(layout, boundVariables);

		expect(isTokenizedValue(normalized.position.width)).toBe(true);
		if (isTokenizedValue(normalized.position.width)) {
			expect(normalized.position.width.tokenRef.id).toBe('v-width');
		}
		expect(isTokenizedValue(normalized.position.height)).toBe(true);
		if (isTokenizedValue(normalized.position.height)) {
			expect(normalized.position.height.tokenRef.id).toBe('v-height');
		}
		expect(isTokenizedValue(normalized.position.minWidth)).toBe(true);
		if (isTokenizedValue(normalized.position.minWidth)) {
			expect(normalized.position.minWidth.tokenRef.id).toBe('v-min-width');
		}
		const paddingLeft = normalized.container?.padding?.left;
		expect(isTokenizedValue(paddingLeft)).toBe(true);
		if (isTokenizedValue(paddingLeft)) {
			expect(paddingLeft.tokenRef.id).toBe('v-padding-left');
		}
		const rowGap = normalized.container?.gap?.row;
		expect(isTokenizedValue(rowGap)).toBe(true);
		if (isTokenizedValue(rowGap)) {
			expect(rowGap.tokenRef.id).toBe('v-row-gap');
		}
	});

	it('tokenizes stroke bound variables', () => {
		const paint: SolidPaint = {
			type: 'SOLID',
			color: { r: 0, g: 0, b: 0 },
			opacity: 1,
			visible: true,
			boundVariables: { color: alias('v-stroke-color') },
		};
		const stroke: ExtractedStrokeProps = {
			strokes: [paint],
			strokeWeight: 4,
			strokeTopWeight: 1,
			strokeRightWeight: 1,
			strokeBottomWeight: 1,
			strokeLeftWeight: 1,
			topLeftRadius: 6,
			topRightRadius: 6,
			bottomRightRadius: 6,
			bottomLeftRadius: 6,
		};
		const boundVariables = {
			strokeWeight: alias('v-stroke-weight'),
			strokeTopWeight: alias('v-stroke-top'),
			topLeftRadius: alias('v-corner'),
		};

		const normalized = normalizeStroke(stroke, boundVariables);
		if (!normalized) throw new Error('expected normalized stroke');

		const weight = normalized.weight;
		if (weight.type !== 'uniform') throw new Error('expected uniform weight');
		if (!isTokenizedValue(weight.value)) throw new Error('expected tokenized weight');
		expect(weight.value.tokenRef.id).toBe('v-stroke-weight');

		const corner = normalized.corner;
		if (!corner || corner.radius.type !== 'mixed') throw new Error('expected mixed corner');
		const topLeft = corner.radius.values[0];
		if (!isTokenizedValue(topLeft)) throw new Error('expected tokenized corner');
		expect(topLeft.tokenRef.id).toBe('v-corner');
	});

	it('tokenizes text characters bound variable', () => {
		const segment = {
			start: 0,
			end: 3,
			characters: 'Hey',
			fontName: { family: 'Inter', style: 'Regular' },
			fontSize: 12,
			fontWeight: 400,
			fontStyle: 'Regular',
			textCase: 'ORIGINAL',
			textDecoration: 'NONE',
			textDecorationStyle: 'SOLID',
			textDecorationOffset: null,
			textDecorationThickness: null,
			textDecorationColor: { value: 'AUTO' },
			textDecorationSkipInk: null,
			lineHeight: { value: 'AUTO' },
			letterSpacing: { unit: 'PERCENT', value: 0 },
			fills: [],
			fillStyleId: '',
			textStyleId: '',
			listOptions: null,
			listSpacing: 0,
			indentation: 0,
			paragraphIndent: 0,
			paragraphSpacing: 0,
			hyperlink: null,
			openTypeFeatures: {},
			textStyleOverrides: [],
			boundVariables: { fontSize: alias('v-font') },
		} as unknown as NonNullable<ExtractedTextProps['characters']>[number];
		const text: ExtractedTextProps = {
			characters: [segment],
			textAlignHorizontal: 'LEFT',
			textAlignVertical: 'TOP',
			textAutoResize: 'NONE',
			textTruncation: 'DISABLED',
			maxLines: null,
			paragraphIndent: 0,
			paragraphSpacing: 0,
			listSpacing: 0,
			hangingPunctuation: false,
			hangingList: false,
			leadingTrim: 'NONE',
			textStyleId: '',
			hyperlink: null,
		};
		const normalized = normalizeText(text, { characters: alias('v-characters') });
		if (!normalized) throw new Error('expected normalized text');
		if (!isTokenizedValue(normalized.characters)) throw new Error('expected tokenized characters');
		expect(normalized.characters.tokenRef.id).toBe('v-characters');
	});

	it('tokenizes paint and effect bound variables', () => {
		const paint: SolidPaint = {
			type: 'SOLID',
			color: { r: 1, g: 0, b: 0 },
			opacity: 1,
			visible: true,
			boundVariables: { color: alias('v-fill-color') },
		};
		const fills: ExtractedFillProps = { fills: [paint] };
		const normalizedFills = normalizeFills(fills);
		const firstFill = normalizedFills[0];
		if (firstFill.type !== 'solid') throw new Error('expected solid fill');
		if (!isTokenizedValue(firstFill.color)) throw new Error('expected tokenized fill color');
		expect(firstFill.color.tokenRef.id).toBe('v-fill-color');

		const effect: DropShadowEffect = {
			type: 'DROP_SHADOW',
			color: { r: 0, g: 0, b: 0, a: 1 },
			offset: { x: 2, y: 3 },
			radius: 4,
			spread: 1,
			blendMode: 'NORMAL',
			visible: true,
			showShadowBehindNode: false,
			boundVariables: {
				color: alias('v-effect-color'),
				offsetX: alias('v-effect-x'),
				offsetY: alias('v-effect-y'),
				radius: alias('v-effect-radius'),
				spread: alias('v-effect-spread'),
			},
		};
		const effects: ExtractedEffectProps = { effects: [effect] };
		const normalizedEffects = normalizeEffects(effects);
		const firstEffect = normalizedEffects[0];
		if (firstEffect.type !== 'shadow') throw new Error('expected shadow effect');
		if (!isTokenizedValue(firstEffect.color)) throw new Error('expected tokenized effect color');
		expect(firstEffect.color.tokenRef.id).toBe('v-effect-color');
		if (!isTokenizedValue(firstEffect.offset.x)) throw new Error('expected tokenized offset x');
		expect(firstEffect.offset.x.tokenRef.id).toBe('v-effect-x');
		if (!isTokenizedValue(firstEffect.offset.y)) throw new Error('expected tokenized offset y');
		expect(firstEffect.offset.y.tokenRef.id).toBe('v-effect-y');
		if (!isTokenizedValue(firstEffect.radius)) throw new Error('expected tokenized radius');
		expect(firstEffect.radius.tokenRef.id).toBe('v-effect-radius');
		if (!isTokenizedValue(firstEffect.spread)) throw new Error('expected tokenized spread');
		expect(firstEffect.spread.tokenRef.id).toBe('v-effect-spread');
	});
});
