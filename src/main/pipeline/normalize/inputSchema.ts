import { z } from 'zod';
import { BLEND_KEYS, EFFECT_KEYS } from '../extract/effects';
import { FILL_KEYS, GEOMETRY_FILL_KEYS } from '../extract/fills';
import {
	AUTO_LAYOUT_CHILD_KEYS,
	AUTO_LAYOUT_CONTAINER_KEYS,
	CONSTRAINT_KEYS,
	GRID_CHILD_KEYS,
	GRID_CONTAINER_KEYS,
	LAYOUT_SIZING_KEYS,
	POSITION_KEYS,
} from '../extract/layout';
import {
	CORNER_KEYS,
	GEOMETRY_STROKE_KEYS,
	INDIVIDUAL_STROKE_KEYS,
	RECTANGLE_CORNER_KEYS,
	STROKE_KEYS,
	VECTOR_NETWORK_KEYS,
} from '../extract/stroke';
import { TEXT_DEFAULT_KEYS, TEXT_SEGMENT_PROPERTIES } from '../extract/text';

const META = {
	direct: { css: 'direct' },
	interpret: { css: 'interpret' },
	none: { css: 'none' },
} as const;

const optionalValue = (meta: Record<string, unknown>) => z.unknown().optional().meta(meta);

const shapeFromKeys = (
	keys: readonly string[],
	baseMeta: Record<string, unknown>,
	overrides: Record<string, Record<string, unknown>> = {},
) => {
	const shape: Record<string, z.ZodTypeAny> = {};
	keys.forEach((key) => {
		shape[key] = optionalValue(overrides[key] ?? baseMeta);
	});
	return shape;
};

const fillKeys = [...FILL_KEYS, ...GEOMETRY_FILL_KEYS] satisfies ReadonlyArray<string>;
const effectKeys = [...BLEND_KEYS, ...EFFECT_KEYS] satisfies ReadonlyArray<string>;
const layoutKeys = [
	...AUTO_LAYOUT_CONTAINER_KEYS,
	...AUTO_LAYOUT_CHILD_KEYS,
	...LAYOUT_SIZING_KEYS,
	...GRID_CONTAINER_KEYS,
	...GRID_CHILD_KEYS,
	...POSITION_KEYS,
	...CONSTRAINT_KEYS,
] satisfies ReadonlyArray<string>;
const strokeKeys = [
	...STROKE_KEYS,
	...INDIVIDUAL_STROKE_KEYS,
	...GEOMETRY_STROKE_KEYS,
	...CORNER_KEYS,
	...RECTANGLE_CORNER_KEYS,
	...VECTOR_NETWORK_KEYS,
] satisfies ReadonlyArray<string>;
const textKeys = [...TEXT_DEFAULT_KEYS] satisfies ReadonlyArray<string>;
const textSegmentKeys = [...TEXT_SEGMENT_PROPERTIES] satisfies ReadonlyArray<string>;

const fillsSchema = z
	.object(
		shapeFromKeys(fillKeys, META.interpret, {
			fillStyleId: META.none,
			fillGeometry: META.none,
		}),
	)
	.meta({ group: 'fills' });

const effectsSchema = z
	.object(
		shapeFromKeys(effectKeys, META.interpret, {
			opacity: META.direct,
			effectStyleId: META.none,
			isMask: META.none,
			maskType: META.none,
		}),
	)
	.meta({ group: 'effects' });

const layoutSchema = z
	.object(
		shapeFromKeys(layoutKeys, META.interpret, {
			x: META.direct,
			y: META.direct,
			width: META.direct,
			height: META.direct,
			gridRowGap: { css: 'interpret', hint: 'gap', cssProp: 'row-gap' },
			gridColumnGap: { css: 'interpret', hint: 'gap', cssProp: 'column-gap' },
			itemSpacing: { css: 'interpret', hint: 'gap' },
			counterAxisSpacing: { css: 'interpret', hint: 'gap' },
		}),
	)
	.meta({ group: 'layout' });

const strokeSchema = z
	.object(
		shapeFromKeys(strokeKeys, META.interpret, {
			strokes: META.interpret,
			strokeStyleId: META.none,
			strokeWeight: META.direct,
			strokeTopWeight: META.direct,
			strokeBottomWeight: META.direct,
			strokeLeftWeight: META.direct,
			strokeRightWeight: META.direct,
			cornerRadius: META.direct,
			topLeftRadius: META.direct,
			topRightRadius: META.direct,
			bottomLeftRadius: META.direct,
			bottomRightRadius: META.direct,
		}),
	)
	.meta({ group: 'stroke' });

const textSegmentSchema = z
	.object({
		characters: z.string().meta(META.direct),
		start: z.number().meta(META.none),
		end: z.number().meta(META.none),
		...shapeFromKeys(textSegmentKeys, META.direct, {
			fills: META.interpret,
			fillStyleId: META.none,
			textStyleId: META.none,
			openTypeFeatures: META.interpret,
			boundVariables: META.interpret,
		}),
	})
	.meta({ group: 'text-segment', css: 'direct' });

const textSchema = z
	.object({
		...shapeFromKeys(textKeys, META.direct, {
			fills: META.interpret,
			fillStyleId: META.none,
			textStyleId: META.none,
			openTypeFeatures: META.interpret,
			boundVariables: META.interpret,
		}),
		characters: z.array(textSegmentSchema).meta({ css: 'direct' }),
	})
	.meta({ group: 'text' });

const styleSchema = z
	.object({
		fills: fillsSchema,
		effects: effectsSchema,
		layout: layoutSchema,
		text: textSchema,
		stroke: strokeSchema,
	})
	.meta({ group: 'style' });

const propsSchema = z.object({
	id: z.string().meta(META.none),
	name: z.string().meta(META.none),
	style: styleSchema,
	componentProperties: z.unknown().optional().meta(META.none),
});

export const inputSchema: z.ZodTypeAny = z.lazy(() =>
	z.object({
		type: z.string().meta(META.none),
		props: propsSchema,
		children: z.array(inputSchema).optional().meta({ css: 'none', group: 'children' }),
	}),
);

export type NormalizedNode = z.infer<typeof inputSchema>;
