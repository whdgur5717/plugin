import { isNil } from 'es-toolkit';
import type { Uniform, FigmaFieldType } from './value-types';

export const AUTO_LAYOUT_CONTAINER_KEYS = [
	'layoutMode',
	'primaryAxisSizingMode',
	'counterAxisSizingMode',
	'primaryAxisAlignItems',
	'counterAxisAlignItems',
	'layoutWrap',
	'counterAxisAlignContent',
	'itemSpacing',
	'counterAxisSpacing',
	'strokesIncludedInLayout',
	'itemReverseZIndex',
	'paddingLeft',
	'paddingRight',
	'paddingTop',
	'paddingBottom',
] satisfies ReadonlyArray<keyof AutoLayoutMixin>;

export const AUTO_LAYOUT_CHILD_KEYS = ['layoutAlign', 'layoutGrow', 'layoutPositioning'] satisfies ReadonlyArray<
	keyof AutoLayoutChildrenMixin
>;

export const LAYOUT_SIZING_KEYS = [
	'layoutSizingHorizontal',
	'layoutSizingVertical',
	'layoutAlign',
	'layoutGrow',
	'layoutPositioning',
	'minWidth',
	'maxWidth',
	'minHeight',
	'maxHeight',
] satisfies ReadonlyArray<keyof LayoutMixin>;

export const GRID_CONTAINER_KEYS = [
	'gridRowCount',
	'gridColumnCount',
	'gridRowGap',
	'gridColumnGap',
	'gridRowSizes',
	'gridColumnSizes',
] satisfies ReadonlyArray<keyof GridLayoutMixin>;

export const GRID_CHILD_KEYS = [
	'gridRowAnchorIndex',
	'gridColumnAnchorIndex',
	'gridRowSpan',
	'gridColumnSpan',
	'gridChildHorizontalAlign',
	'gridChildVerticalAlign',
] satisfies ReadonlyArray<keyof GridChildrenMixin>;

export const POSITION_KEYS = ['x', 'y', 'width', 'height'] satisfies ReadonlyArray<keyof DimensionAndPositionMixin>;

export const CONSTRAINT_KEYS = ['constraints'] satisfies ReadonlyArray<keyof ConstraintMixin>;

export type ExtractedLayoutProps = {
	// AutoLayoutMixin
	layoutMode?: Uniform<FigmaFieldType<AutoLayoutMixin, 'layoutMode'>>;
	primaryAxisSizingMode?: Uniform<FigmaFieldType<AutoLayoutMixin, 'primaryAxisSizingMode'>>;
	counterAxisSizingMode?: Uniform<FigmaFieldType<AutoLayoutMixin, 'counterAxisSizingMode'>>;
	primaryAxisAlignItems?: Uniform<FigmaFieldType<AutoLayoutMixin, 'primaryAxisAlignItems'>>;
	counterAxisAlignItems?: Uniform<FigmaFieldType<AutoLayoutMixin, 'counterAxisAlignItems'>>;
	layoutWrap?: Uniform<FigmaFieldType<AutoLayoutMixin, 'layoutWrap'>>;
	counterAxisAlignContent?: Uniform<FigmaFieldType<AutoLayoutMixin, 'counterAxisAlignContent'>>;
	itemSpacing?: Uniform<FigmaFieldType<AutoLayoutMixin, 'itemSpacing'>>;
	counterAxisSpacing?: Uniform<FigmaFieldType<AutoLayoutMixin, 'counterAxisSpacing'>>;
	strokesIncludedInLayout?: Uniform<FigmaFieldType<AutoLayoutMixin, 'strokesIncludedInLayout'>>;
	itemReverseZIndex?: Uniform<FigmaFieldType<AutoLayoutMixin, 'itemReverseZIndex'>>;
	paddingLeft?: Uniform<FigmaFieldType<AutoLayoutMixin, 'paddingLeft'>>;
	paddingRight?: Uniform<FigmaFieldType<AutoLayoutMixin, 'paddingRight'>>;
	paddingTop?: Uniform<FigmaFieldType<AutoLayoutMixin, 'paddingTop'>>;
	paddingBottom?: Uniform<FigmaFieldType<AutoLayoutMixin, 'paddingBottom'>>;

	// AutoLayoutChildrenMixin & LayoutMixin
	layoutAlign?: Uniform<FigmaFieldType<LayoutMixin, 'layoutAlign'>>;
	layoutGrow?: Uniform<FigmaFieldType<LayoutMixin, 'layoutGrow'>>;
	layoutPositioning?: Uniform<FigmaFieldType<LayoutMixin, 'layoutPositioning'>>;
	layoutSizingHorizontal?: Uniform<FigmaFieldType<LayoutMixin, 'layoutSizingHorizontal'>>;
	layoutSizingVertical?: Uniform<FigmaFieldType<LayoutMixin, 'layoutSizingVertical'>>;
	minWidth?: Uniform<FigmaFieldType<LayoutMixin, 'minWidth'>>;
	maxWidth?: Uniform<FigmaFieldType<LayoutMixin, 'maxWidth'>>;
	minHeight?: Uniform<FigmaFieldType<LayoutMixin, 'minHeight'>>;
	maxHeight?: Uniform<FigmaFieldType<LayoutMixin, 'maxHeight'>>;

	// GridLayoutMixin
	gridRowCount?: Uniform<FigmaFieldType<GridLayoutMixin, 'gridRowCount'>>;
	gridColumnCount?: Uniform<FigmaFieldType<GridLayoutMixin, 'gridColumnCount'>>;
	gridRowGap?: Uniform<FigmaFieldType<GridLayoutMixin, 'gridRowGap'>>;
	gridColumnGap?: Uniform<FigmaFieldType<GridLayoutMixin, 'gridColumnGap'>>;
	gridRowSizes?: Uniform<FigmaFieldType<GridLayoutMixin, 'gridRowSizes'>>;
	gridColumnSizes?: Uniform<FigmaFieldType<GridLayoutMixin, 'gridColumnSizes'>>;

	// GridChildrenMixin
	gridRowAnchorIndex?: Uniform<FigmaFieldType<GridChildrenMixin, 'gridRowAnchorIndex'>>;
	gridColumnAnchorIndex?: Uniform<FigmaFieldType<GridChildrenMixin, 'gridColumnAnchorIndex'>>;
	gridRowSpan?: Uniform<FigmaFieldType<GridChildrenMixin, 'gridRowSpan'>>;
	gridColumnSpan?: Uniform<FigmaFieldType<GridChildrenMixin, 'gridColumnSpan'>>;
	gridChildHorizontalAlign?: Uniform<FigmaFieldType<GridChildrenMixin, 'gridChildHorizontalAlign'>>;
	gridChildVerticalAlign?: Uniform<FigmaFieldType<GridChildrenMixin, 'gridChildVerticalAlign'>>;

	// DimensionAndPositionMixin
	x?: Uniform<FigmaFieldType<DimensionAndPositionMixin, 'x'>>;
	y?: Uniform<FigmaFieldType<DimensionAndPositionMixin, 'y'>>;
	width?: Uniform<FigmaFieldType<DimensionAndPositionMixin, 'width'>>;
	height?: Uniform<FigmaFieldType<DimensionAndPositionMixin, 'height'>>;

	// ConstraintMixin
	constraints?: Uniform<FigmaFieldType<ConstraintMixin, 'constraints'>>;
};

export class LayoutExtractor {
	extract(node: SceneNode): ExtractedLayoutProps {
		const result: ExtractedLayoutProps = {};

		if (this.isAutoLayoutContainer(node)) {
			this.extractAutoLayoutContainer(result, node);
		}

		if (this.isAutoLayoutChild(node)) {
			this.extractAutoLayoutChild(result, node);
		}

		if (this.isLayoutSizingNode(node)) {
			this.extractLayoutSizing(result, node);
		}

		if (this.isGridContainer(node)) {
			this.extractGridContainer(result, node);
		}

		if (this.isGridChild(node)) {
			this.extractGridChild(result, node);
		}

		if (this.isDimensionNode(node)) {
			this.extractDimensions(result, node);
		}

		if (this.isConstraintNode(node)) {
			this.extractConstraints(result, node);
		}
		console.log(result);
		return result;
	}

	private uniform<T>(value: T): Uniform<T> {
		return { type: 'uniform', value };
	}

	private extractAutoLayoutContainer(result: ExtractedLayoutProps, node: SceneNode & AutoLayoutMixin) {
		if (!isNil(node.layoutMode)) result.layoutMode = this.uniform(node.layoutMode);
		if (!isNil(node.primaryAxisSizingMode)) result.primaryAxisSizingMode = this.uniform(node.primaryAxisSizingMode);
		if (!isNil(node.counterAxisSizingMode)) result.counterAxisSizingMode = this.uniform(node.counterAxisSizingMode);
		if (!isNil(node.primaryAxisAlignItems)) result.primaryAxisAlignItems = this.uniform(node.primaryAxisAlignItems);
		if (!isNil(node.counterAxisAlignItems)) result.counterAxisAlignItems = this.uniform(node.counterAxisAlignItems);
		if (!isNil(node.layoutWrap)) result.layoutWrap = this.uniform(node.layoutWrap);
		if (!isNil(node.counterAxisAlignContent))
			result.counterAxisAlignContent = this.uniform(node.counterAxisAlignContent);
		if (!isNil(node.itemSpacing)) result.itemSpacing = this.uniform(node.itemSpacing);
		if (!isNil(node.counterAxisSpacing)) result.counterAxisSpacing = this.uniform(node.counterAxisSpacing);
		if (!isNil(node.strokesIncludedInLayout))
			result.strokesIncludedInLayout = this.uniform(node.strokesIncludedInLayout);
		if (!isNil(node.itemReverseZIndex)) result.itemReverseZIndex = this.uniform(node.itemReverseZIndex);
		if (!isNil(node.paddingLeft)) result.paddingLeft = this.uniform(node.paddingLeft);
		if (!isNil(node.paddingRight)) result.paddingRight = this.uniform(node.paddingRight);
		if (!isNil(node.paddingTop)) result.paddingTop = this.uniform(node.paddingTop);
		if (!isNil(node.paddingBottom)) result.paddingBottom = this.uniform(node.paddingBottom);
	}

	private extractAutoLayoutChild(result: ExtractedLayoutProps, node: SceneNode & AutoLayoutChildrenMixin) {
		if (!isNil(node.layoutAlign)) result.layoutAlign = this.uniform(node.layoutAlign);
		if (!isNil(node.layoutGrow)) result.layoutGrow = this.uniform(node.layoutGrow);
		if (!isNil(node.layoutPositioning)) result.layoutPositioning = this.uniform(node.layoutPositioning);
	}

	private extractLayoutSizing(result: ExtractedLayoutProps, node: SceneNode & LayoutMixin) {
		if (!isNil(node.layoutSizingHorizontal))
			result.layoutSizingHorizontal = this.uniform(node.layoutSizingHorizontal);
		if (!isNil(node.layoutSizingVertical)) result.layoutSizingVertical = this.uniform(node.layoutSizingVertical);
		if (!isNil(node.minWidth)) result.minWidth = this.uniform(node.minWidth);
		if (!isNil(node.maxWidth)) result.maxWidth = this.uniform(node.maxWidth);
		if (!isNil(node.minHeight)) result.minHeight = this.uniform(node.minHeight);
		if (!isNil(node.maxHeight)) result.maxHeight = this.uniform(node.maxHeight);
	}

	private extractGridContainer(result: ExtractedLayoutProps, node: SceneNode & GridLayoutMixin) {
		if (!isNil(node.gridRowCount)) result.gridRowCount = this.uniform(node.gridRowCount);
		if (!isNil(node.gridColumnCount)) result.gridColumnCount = this.uniform(node.gridColumnCount);
		if (!isNil(node.gridRowGap)) result.gridRowGap = this.uniform(node.gridRowGap);
		if (!isNil(node.gridColumnGap)) result.gridColumnGap = this.uniform(node.gridColumnGap);
		if (!isNil(node.gridRowSizes)) result.gridRowSizes = this.uniform(node.gridRowSizes);
		if (!isNil(node.gridColumnSizes)) result.gridColumnSizes = this.uniform(node.gridColumnSizes);
	}

	private extractGridChild(result: ExtractedLayoutProps, node: SceneNode & GridChildrenMixin) {
		if (!isNil(node.gridRowAnchorIndex)) result.gridRowAnchorIndex = this.uniform(node.gridRowAnchorIndex);
		if (!isNil(node.gridColumnAnchorIndex)) result.gridColumnAnchorIndex = this.uniform(node.gridColumnAnchorIndex);
		if (!isNil(node.gridRowSpan)) result.gridRowSpan = this.uniform(node.gridRowSpan);
		if (!isNil(node.gridColumnSpan)) result.gridColumnSpan = this.uniform(node.gridColumnSpan);
		if (!isNil(node.gridChildHorizontalAlign))
			result.gridChildHorizontalAlign = this.uniform(node.gridChildHorizontalAlign);
		if (!isNil(node.gridChildVerticalAlign))
			result.gridChildVerticalAlign = this.uniform(node.gridChildVerticalAlign);
	}

	private extractDimensions(result: ExtractedLayoutProps, node: SceneNode & DimensionAndPositionMixin) {
		if (!isNil(node.x)) result.x = this.uniform(node.x);
		if (!isNil(node.y)) result.y = this.uniform(node.y);
		if (!isNil(node.width)) result.width = this.uniform(node.width);
		if (!isNil(node.height)) result.height = this.uniform(node.height);
	}

	private extractConstraints(result: ExtractedLayoutProps, node: SceneNode & ConstraintMixin) {
		if (!isNil(node.constraints)) result.constraints = this.uniform(node.constraints);
	}

	private isAutoLayoutContainer(node: SceneNode): node is SceneNode & AutoLayoutMixin {
		return 'layoutMode' in node;
	}

	private isAutoLayoutChild(node: SceneNode): node is SceneNode & AutoLayoutChildrenMixin {
		return 'layoutAlign' in node;
	}

	private isLayoutSizingNode(node: SceneNode): node is SceneNode & LayoutMixin {
		return 'layoutSizingHorizontal' in node;
	}

	private isGridContainer(node: SceneNode): node is SceneNode & GridLayoutMixin {
		return 'gridRowCount' in node;
	}

	private isGridChild(node: SceneNode): node is SceneNode & GridChildrenMixin {
		return 'gridRowAnchorIndex' in node;
	}

	private isDimensionNode(node: SceneNode): node is SceneNode & DimensionAndPositionMixin {
		return 'x' in node;
	}

	private isConstraintNode(node: SceneNode): node is SceneNode & ConstraintMixin {
		return 'constraints' in node;
	}
}

export const layoutExtractor = new LayoutExtractor();
