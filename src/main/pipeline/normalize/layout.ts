import { isNumber } from 'es-toolkit/compat';
import type { ExtractedLayoutProps } from '../extract/layout';
import type {
	NormalizedLayout,
	NormalizedLayoutChild,
	NormalizedLayoutContainer,
	NormalizedLayoutGap,
	NormalizedLayoutPadding,
	NormalizedLayoutPosition,
} from './types';

const toNumber = (value: number | undefined): number => (typeof value === 'number' ? value : 0);

const buildPosition = (layout: ExtractedLayoutProps): NormalizedLayoutPosition => ({
	x: toNumber(layout.x),
	y: toNumber(layout.y),
	width: toNumber(layout.width),
	height: toNumber(layout.height),
});

const buildPadding = (layout: ExtractedLayoutProps): NormalizedLayoutPadding | undefined => {
	const hasPadding =
		isNumber(layout.paddingTop) ||
		isNumber(layout.paddingRight) ||
		isNumber(layout.paddingBottom) ||
		isNumber(layout.paddingLeft);

	if (!hasPadding) return undefined;

	return {
		top: toNumber(layout.paddingTop),
		right: toNumber(layout.paddingRight),
		bottom: toNumber(layout.paddingBottom),
		left: toNumber(layout.paddingLeft),
	};
};

const buildGap = (layout: ExtractedLayoutProps): NormalizedLayoutGap | undefined => {
	const gap: NormalizedLayoutGap = {};

	if (layout.layoutMode === 'GRID') {
		if (isNumber(layout.gridRowGap)) gap.row = layout.gridRowGap;
		if (isNumber(layout.gridColumnGap)) gap.column = layout.gridColumnGap;
	}

	if (layout.layoutMode === 'HORIZONTAL') {
		if (isNumber(layout.itemSpacing)) gap.column = layout.itemSpacing;
		if (layout.layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing)) {
			gap.row = layout.counterAxisSpacing;
		}
	}

	if (layout.layoutMode === 'VERTICAL') {
		if (isNumber(layout.itemSpacing)) gap.row = layout.itemSpacing;
		if (layout.layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing)) {
			gap.column = layout.counterAxisSpacing;
		}
	}

	if (!isNumber(gap.row) && !isNumber(gap.column)) return undefined;
	return gap;
};

const buildContainer = (layout: ExtractedLayoutProps): NormalizedLayoutContainer | undefined => {
	const container: NormalizedLayoutContainer = {};

	if (layout.layoutMode === 'HORIZONTAL' || layout.layoutMode === 'VERTICAL') {
		container.direction = layout.layoutMode;
	}

	const padding = buildPadding(layout);
	if (padding) container.padding = padding;

	const gap = buildGap(layout);
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
		container.grid = {
			rowCount: toNumber(layout.gridRowCount),
			columnCount: toNumber(layout.gridColumnCount),
			rowGap: toNumber(layout.gridRowGap),
			columnGap: toNumber(layout.gridColumnGap),
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

export const normalizeLayout = (layout: ExtractedLayoutProps): NormalizedLayout => {
	const mode: NormalizedLayout['mode'] =
		layout.layoutMode === 'GRID'
			? 'GRID'
			: layout.layoutMode === 'HORIZONTAL' || layout.layoutMode === 'VERTICAL'
				? 'AUTO'
				: 'ABSOLUTE';

	const normalized: NormalizedLayout = {
		mode,
		position: buildPosition(layout),
	};

	if (layout.constraints) {
		normalized.constraints = layout.constraints;
	}

	const container = buildContainer(layout);
	if (container) normalized.container = container;

	const child = buildChild(layout);
	if (child) normalized.child = child;

	return normalized;
};
