import { isNumber } from 'es-toolkit/compat';
import { toTokenizedValue } from './utils';
import type { ExtractedLayoutProps } from '../extract/layout';
import type {
	NormalizedLayout,
	NormalizedLayoutChild,
	NormalizedLayoutContainer,
	NormalizedLayoutGap,
	NormalizedLayoutPadding,
	NormalizedLayoutPosition,
} from './types';

export class LayoutNormalizer {
	normalizeLayout(layout: ExtractedLayoutProps, boundVariables?: SceneNode['boundVariables']): NormalizedLayout {
		const layoutMode = layout.layoutMode?.value;
		const mode =
			layoutMode === 'GRID'
				? 'GRID'
				: layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL'
					? 'AUTO'
					: 'ABSOLUTE';

		const normalized: NormalizedLayout = {
			mode,
			position: this.buildPosition(layout, boundVariables),
		};

		if (layout.constraints) {
			normalized.constraints = layout.constraints.value;
		}

		const container = this.buildContainer(layout, boundVariables);
		if (container) normalized.container = container;

		const child = this.buildChild(layout);
		if (child) normalized.child = child;

		return normalized;
	}

	private buildPosition(
		layout: ExtractedLayoutProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedLayoutPosition {
		const width = this.toNumber(layout.width?.value);
		const height = this.toNumber(layout.height?.value);
		const minWidth = layout.minWidth?.value ?? null;
		const maxWidth = layout.maxWidth?.value ?? null;
		const minHeight = layout.minHeight?.value ?? null;
		const maxHeight = layout.maxHeight?.value ?? null;

		return {
			x: this.toNumber(layout.x?.value),
			y: this.toNumber(layout.y?.value),
			width: toTokenizedValue(width, boundVariables?.width),
			height: toTokenizedValue(height, boundVariables?.height),
			minWidth: minWidth === null ? null : toTokenizedValue(minWidth, boundVariables?.minWidth),
			maxWidth: maxWidth === null ? null : toTokenizedValue(maxWidth, boundVariables?.maxWidth),
			minHeight: minHeight === null ? null : toTokenizedValue(minHeight, boundVariables?.minHeight),
			maxHeight: maxHeight === null ? null : toTokenizedValue(maxHeight, boundVariables?.maxHeight),
		};
	}

	private buildPadding(
		layout: ExtractedLayoutProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedLayoutPadding | undefined {
		const hasPadding =
			isNumber(layout.paddingTop?.value) ||
			isNumber(layout.paddingRight?.value) ||
			isNumber(layout.paddingBottom?.value) ||
			isNumber(layout.paddingLeft?.value);

		if (!hasPadding) return undefined;

		return {
			top: toTokenizedValue(this.toNumber(layout.paddingTop?.value), boundVariables?.paddingTop),
			right: toTokenizedValue(this.toNumber(layout.paddingRight?.value), boundVariables?.paddingRight),
			bottom: toTokenizedValue(this.toNumber(layout.paddingBottom?.value), boundVariables?.paddingBottom),
			left: toTokenizedValue(this.toNumber(layout.paddingLeft?.value), boundVariables?.paddingLeft),
		};
	}

	private buildGap(
		layout: ExtractedLayoutProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedLayoutGap | undefined {
		const gap: NormalizedLayoutGap = {};
		const gridRowGapAlias = boundVariables?.gridRowGap;
		const gridColumnGapAlias = boundVariables?.gridColumnGap;
		const itemSpacingAlias = boundVariables?.itemSpacing;
		const counterAxisSpacingAlias = boundVariables?.counterAxisSpacing;
		const layoutMode = layout.layoutMode?.value;
		const layoutWrap = layout.layoutWrap?.value;

		if (layoutMode === 'GRID') {
			if (isNumber(layout.gridRowGap?.value)) {
				gap.row = toTokenizedValue(layout.gridRowGap.value, gridRowGapAlias);
			}
			if (isNumber(layout.gridColumnGap?.value)) {
				gap.column = toTokenizedValue(layout.gridColumnGap.value, gridColumnGapAlias);
			}
		}

		if (layoutMode === 'HORIZONTAL') {
			if (isNumber(layout.itemSpacing?.value)) {
				gap.column = toTokenizedValue(layout.itemSpacing.value, itemSpacingAlias);
			}
			if (layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing?.value)) {
				gap.row = toTokenizedValue(layout.counterAxisSpacing.value, counterAxisSpacingAlias);
			}
		}

		if (layoutMode === 'VERTICAL') {
			if (isNumber(layout.itemSpacing?.value)) {
				gap.row = toTokenizedValue(layout.itemSpacing.value, itemSpacingAlias);
			}
			if (layoutWrap === 'WRAP' && isNumber(layout.counterAxisSpacing?.value)) {
				gap.column = toTokenizedValue(layout.counterAxisSpacing.value, counterAxisSpacingAlias);
			}
		}

		const hasRow = gap.row !== undefined && gap.row !== null;
		const hasColumn = gap.column !== undefined && gap.column !== null;
		if (!hasRow && !hasColumn) return undefined;
		return gap;
	}

	private buildContainer(
		layout: ExtractedLayoutProps,
		boundVariables?: SceneNode['boundVariables'],
	): NormalizedLayoutContainer | undefined {
		const container: NormalizedLayoutContainer = {};
		const layoutMode = layout.layoutMode?.value;

		if (layoutMode === 'HORIZONTAL' || layoutMode === 'VERTICAL') {
			container.direction = layoutMode;
		}

		const padding = this.buildPadding(layout, boundVariables);
		if (padding) container.padding = padding;

		const gap = this.buildGap(layout, boundVariables);
		if (gap) container.gap = gap;

		if (layout.primaryAxisAlignItems?.value) container.primaryAxisAlignItems = layout.primaryAxisAlignItems.value;
		if (layout.counterAxisAlignItems?.value) container.counterAxisAlignItems = layout.counterAxisAlignItems.value;
		if (layout.counterAxisAlignContent?.value)
			container.counterAxisAlignContent = layout.counterAxisAlignContent.value;
		if (layout.primaryAxisSizingMode?.value) container.primaryAxisSizingMode = layout.primaryAxisSizingMode.value;
		if (layout.counterAxisSizingMode?.value) container.counterAxisSizingMode = layout.counterAxisSizingMode.value;
		if (layout.layoutWrap?.value) container.layoutWrap = layout.layoutWrap.value;
		if (typeof layout.strokesIncludedInLayout?.value === 'boolean') {
			container.strokesIncludedInLayout = layout.strokesIncludedInLayout.value;
		}
		if (typeof layout.itemReverseZIndex?.value === 'boolean') {
			container.itemReverseZIndex = layout.itemReverseZIndex.value;
		}

		if (
			isNumber(layout.gridRowCount?.value) ||
			isNumber(layout.gridColumnCount?.value) ||
			Array.isArray(layout.gridRowSizes?.value) ||
			Array.isArray(layout.gridColumnSizes?.value)
		) {
			container.grid = {
				rowCount: this.toNumber(layout.gridRowCount?.value),
				columnCount: this.toNumber(layout.gridColumnCount?.value),
				rowGap: toTokenizedValue(this.toNumber(layout.gridRowGap?.value), boundVariables?.gridRowGap),
				columnGap: toTokenizedValue(this.toNumber(layout.gridColumnGap?.value), boundVariables?.gridColumnGap),
				rowSizes: layout.gridRowSizes?.value ?? [],
				columnSizes: layout.gridColumnSizes?.value ?? [],
			};
		}

		return Object.keys(container).length > 0 ? container : undefined;
	}

	private buildChild(layout: ExtractedLayoutProps): NormalizedLayoutChild | undefined {
		const child: NormalizedLayoutChild = {};

		if (layout.layoutAlign?.value) child.layoutAlign = layout.layoutAlign.value;
		if (isNumber(layout.layoutGrow?.value)) child.layoutGrow = layout.layoutGrow.value;
		if (layout.layoutPositioning?.value) child.layoutPositioning = layout.layoutPositioning.value;
		if (layout.layoutSizingHorizontal?.value) child.layoutSizingHorizontal = layout.layoutSizingHorizontal.value;
		if (layout.layoutSizingVertical?.value) child.layoutSizingVertical = layout.layoutSizingVertical.value;

		if (
			isNumber(layout.gridRowAnchorIndex?.value) ||
			isNumber(layout.gridColumnAnchorIndex?.value) ||
			isNumber(layout.gridRowSpan?.value) ||
			isNumber(layout.gridColumnSpan?.value) ||
			layout.gridChildHorizontalAlign?.value ||
			layout.gridChildVerticalAlign?.value
		) {
			child.grid = {
				row: this.toNumber(layout.gridRowAnchorIndex?.value),
				column: this.toNumber(layout.gridColumnAnchorIndex?.value),
				rowSpan: isNumber(layout.gridRowSpan?.value) ? layout.gridRowSpan.value : 1,
				columnSpan: isNumber(layout.gridColumnSpan?.value) ? layout.gridColumnSpan.value : 1,
				horizontalAlign: layout.gridChildHorizontalAlign?.value ?? 'AUTO',
				verticalAlign: layout.gridChildVerticalAlign?.value ?? 'AUTO',
			};
		}

		return Object.keys(child).length > 0 ? child : undefined;
	}

	private toNumber(value: number | undefined): number {
		return typeof value === 'number' ? value : 0;
	}
}

export const layoutNormalizer = new LayoutNormalizer();
