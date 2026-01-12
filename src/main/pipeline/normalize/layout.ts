import { isNumber } from 'es-toolkit/compat';
import type { ExtractedLayoutProps } from '../extract/layout';
import type {
	NormalizedLayout,
	NormalizedLayoutChild,
	NormalizedLayoutContainer,
	NormalizedLayoutGap,
	NormalizedLayoutPadding,
	NormalizedLayoutPosition,
	TokenizedValue,
} from './types';

const toNumber = (value: number | undefined): number => (typeof value === 'number' ? value : 0);

const isVariableAlias = (value: unknown): value is VariableAlias =>
	!!value &&
	typeof value === 'object' &&
	'type' in value &&
	'id' in value &&
	(value as { type?: unknown }).type === 'VARIABLE_ALIAS' &&
	typeof (value as { id?: unknown }).id === 'string';

const toTokenizedValue = <T>(value: T, alias?: VariableAlias | null): TokenizedValue<T> =>
	alias ? { tokenRef: { id: alias.id }, fallback: value } : value;

const getAlias = (boundVariables: Record<string, unknown> | undefined, key: string) => {
	const value = boundVariables?.[key];
	return isVariableAlias(value) ? value : null;
};

const buildPosition = (
	layout: ExtractedLayoutProps,
	boundVariables?: Record<string, unknown>,
): NormalizedLayoutPosition => {
	const width = toNumber(layout.width);
	const height = toNumber(layout.height);
	const minWidth = typeof layout.minWidth === 'number' ? layout.minWidth : null;
	const maxWidth = typeof layout.maxWidth === 'number' ? layout.maxWidth : null;
	const minHeight = typeof layout.minHeight === 'number' ? layout.minHeight : null;
	const maxHeight = typeof layout.maxHeight === 'number' ? layout.maxHeight : null;

	return {
		x: toNumber(layout.x),
		y: toNumber(layout.y),
		width: toTokenizedValue(width, getAlias(boundVariables, 'width')),
		height: toTokenizedValue(height, getAlias(boundVariables, 'height')),
		minWidth: minWidth === null ? null : toTokenizedValue(minWidth, getAlias(boundVariables, 'minWidth')),
		maxWidth: maxWidth === null ? null : toTokenizedValue(maxWidth, getAlias(boundVariables, 'maxWidth')),
		minHeight: minHeight === null ? null : toTokenizedValue(minHeight, getAlias(boundVariables, 'minHeight')),
		maxHeight: maxHeight === null ? null : toTokenizedValue(maxHeight, getAlias(boundVariables, 'maxHeight')),
	};
};

const buildPadding = (
	layout: ExtractedLayoutProps,
	boundVariables?: Record<string, unknown>,
): NormalizedLayoutPadding | undefined => {
	const hasPadding =
		isNumber(layout.paddingTop) ||
		isNumber(layout.paddingRight) ||
		isNumber(layout.paddingBottom) ||
		isNumber(layout.paddingLeft);

	if (!hasPadding) return undefined;

	return {
		top: toTokenizedValue(toNumber(layout.paddingTop), getAlias(boundVariables, 'paddingTop')),
		right: toTokenizedValue(toNumber(layout.paddingRight), getAlias(boundVariables, 'paddingRight')),
		bottom: toTokenizedValue(toNumber(layout.paddingBottom), getAlias(boundVariables, 'paddingBottom')),
		left: toTokenizedValue(toNumber(layout.paddingLeft), getAlias(boundVariables, 'paddingLeft')),
	};
};

const buildGap = (
	layout: ExtractedLayoutProps,
	boundVariables?: Record<string, unknown>,
): NormalizedLayoutGap | undefined => {
	const gap: NormalizedLayoutGap = {};
	const gridRowGapAlias = getAlias(boundVariables, 'gridRowGap');
	const gridColumnGapAlias = getAlias(boundVariables, 'gridColumnGap');
	const itemSpacingAlias = getAlias(boundVariables, 'itemSpacing');
	const counterAxisSpacingAlias = getAlias(boundVariables, 'counterAxisSpacing');

	if (layout.layoutMode === 'GRID') {
		if (isNumber(layout.gridRowGap)) {
			gap.row = toTokenizedValue(layout.gridRowGap, gridRowGapAlias);
		}
		if (isNumber(layout.gridColumnGap)) {
			gap.column = toTokenizedValue(layout.gridColumnGap, gridColumnGapAlias);
		}
	}

	if (layout.layoutMode === 'HORIZONTAL') {
		if (isNumber(layout.itemSpacing)) {
			gap.column = toTokenizedValue(layout.itemSpacing, itemSpacingAlias);
		}
		if (layout.layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing)) {
			gap.row = toTokenizedValue(layout.counterAxisSpacing, counterAxisSpacingAlias);
		}
	}

	if (layout.layoutMode === 'VERTICAL') {
		if (isNumber(layout.itemSpacing)) {
			gap.row = toTokenizedValue(layout.itemSpacing, itemSpacingAlias);
		}
		if (layout.layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing)) {
			gap.column = toTokenizedValue(layout.counterAxisSpacing, counterAxisSpacingAlias);
		}
	}

	const hasRow = gap.row !== undefined && gap.row !== null;
	const hasColumn = gap.column !== undefined && gap.column !== null;
	if (!hasRow && !hasColumn) return undefined;
	return gap;
};

const buildContainer = (
	layout: ExtractedLayoutProps,
	boundVariables?: Record<string, unknown>,
): NormalizedLayoutContainer | undefined => {
	const container: NormalizedLayoutContainer = {};

	if (layout.layoutMode === 'HORIZONTAL' || layout.layoutMode === 'VERTICAL') {
		container.direction = layout.layoutMode;
	}

	const padding = buildPadding(layout, boundVariables);
	if (padding) container.padding = padding;

	const gap = buildGap(layout, boundVariables);
	if (gap) container.gap = gap;

	if (layout.primaryAxisAlignItems) container.primaryAxisAlignItems = layout.primaryAxisAlignItems;
	if (layout.counterAxisAlignItems) container.counterAxisAlignItems = layout.counterAxisAlignItems;
	if (layout.counterAxisAlignContent) container.counterAxisAlignContent = layout.counterAxisAlignContent;
	if (layout.primaryAxisSizingMode) container.primaryAxisSizingMode = layout.primaryAxisSizingMode;
	if (layout.counterAxisSizingMode) container.counterAxisSizingMode = layout.counterAxisSizingMode;
	if (layout.layoutWrap) container.layoutWrap = layout.layoutWrap;
	if (typeof layout.strokesIncludedInLayout === 'boolean') {
		container.strokesIncludedInLayout = layout.strokesIncludedInLayout;
	}
	if (typeof layout.itemReverseZIndex === 'boolean') {
		container.itemReverseZIndex = layout.itemReverseZIndex;
	}

	if (
		isNumber(layout.gridRowCount) ||
		isNumber(layout.gridColumnCount) ||
		Array.isArray(layout.gridRowSizes) ||
		Array.isArray(layout.gridColumnSizes)
	) {
		const gridRowGapAlias = getAlias(boundVariables, 'gridRowGap');
		const gridColumnGapAlias = getAlias(boundVariables, 'gridColumnGap');
		container.grid = {
			rowCount: toNumber(layout.gridRowCount),
			columnCount: toNumber(layout.gridColumnCount),
			rowGap: toTokenizedValue(toNumber(layout.gridRowGap), gridRowGapAlias),
			columnGap: toTokenizedValue(toNumber(layout.gridColumnGap), gridColumnGapAlias),
			rowSizes: layout.gridRowSizes ?? [],
			columnSizes: layout.gridColumnSizes ?? [],
		};
	}

	return Object.keys(container).length > 0 ? container : undefined;
};

const buildChild = (layout: ExtractedLayoutProps): NormalizedLayoutChild | undefined => {
	const child: NormalizedLayoutChild = {};

	if (layout.layoutAlign) child.layoutAlign = layout.layoutAlign;
	if (isNumber(layout.layoutGrow)) child.layoutGrow = layout.layoutGrow;
	if (layout.layoutPositioning) child.layoutPositioning = layout.layoutPositioning;
	if (layout.layoutSizingHorizontal) child.layoutSizingHorizontal = layout.layoutSizingHorizontal;
	if (layout.layoutSizingVertical) child.layoutSizingVertical = layout.layoutSizingVertical;

	if (
		isNumber(layout.gridRowAnchorIndex) ||
		isNumber(layout.gridColumnAnchorIndex) ||
		isNumber(layout.gridRowSpan) ||
		isNumber(layout.gridColumnSpan) ||
		layout.gridChildHorizontalAlign ||
		layout.gridChildVerticalAlign
	) {
		child.grid = {
			row: toNumber(layout.gridRowAnchorIndex),
			column: toNumber(layout.gridColumnAnchorIndex),
			rowSpan: isNumber(layout.gridRowSpan) ? layout.gridRowSpan : 1,
			columnSpan: isNumber(layout.gridColumnSpan) ? layout.gridColumnSpan : 1,
			horizontalAlign: layout.gridChildHorizontalAlign ?? 'AUTO',
			verticalAlign: layout.gridChildVerticalAlign ?? 'AUTO',
		};
	}

	return Object.keys(child).length > 0 ? child : undefined;
};

export const normalizeLayout = (
	layout: ExtractedLayoutProps,
	boundVariables?: Record<string, unknown>,
): NormalizedLayout => {
	const mode: NormalizedLayout['mode'] =
		layout.layoutMode === 'GRID'
			? 'GRID'
			: layout.layoutMode === 'HORIZONTAL' || layout.layoutMode === 'VERTICAL'
				? 'AUTO'
				: 'ABSOLUTE';

	const normalized: NormalizedLayout = {
		mode,
		position: buildPosition(layout, boundVariables),
	};

	if (layout.constraints) {
		normalized.constraints = layout.constraints;
	}

	const container = buildContainer(layout, boundVariables);
	if (container) normalized.container = container;

	const child = buildChild(layout);
	if (child) normalized.child = child;

	return normalized;
};
