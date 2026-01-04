import { isNil } from 'es-toolkit';

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

type ExtractedLayoutKeys =
	| (typeof AUTO_LAYOUT_CONTAINER_KEYS)[number]
	| (typeof AUTO_LAYOUT_CHILD_KEYS)[number]
	| (typeof LAYOUT_SIZING_KEYS)[number]
	| (typeof GRID_CONTAINER_KEYS)[number]
	| (typeof GRID_CHILD_KEYS)[number]
	| (typeof POSITION_KEYS)[number]
	| (typeof CONSTRAINT_KEYS)[number];

export type ExtractedLayoutProps = Partial<
	Pick<
		// LayoutMixin extends DimensionAndPositionMixin, AutoLayoutChildrenMixin,
		// and GridChildrenMixin, so we only need LayoutMixin for child layout props.
		AutoLayoutMixin & LayoutMixin & GridLayoutMixin & DimensionAndPositionMixin & ConstraintMixin,
		ExtractedLayoutKeys
	>
>;

const pickDefined = <T extends object, K extends keyof T>(target: T, keys: ReadonlyArray<K>): Pick<T, K> => {
	const result = {} as Pick<T, K>;

	keys.forEach((key) => {
		if (!isNil(target[key])) {
			result[key] = target[key];
		}
	});

	return result;
};

// 노드의 타입을 더 세분화하여 구분하기 위해, node의 required 속성을 기준으로 type guard
const isAutoLayoutContainer = (node: SceneNode): node is SceneNode & AutoLayoutMixin => 'layoutMode' in node;

const isAutoLayoutChild = (node: SceneNode): node is SceneNode & AutoLayoutChildrenMixin => 'layoutAlign' in node;

const isLayoutSizingNode = (node: SceneNode): node is SceneNode & LayoutMixin => 'layoutSizingHorizontal' in node;

const isGridContainer = (node: SceneNode): node is SceneNode & GridLayoutMixin => 'gridRowCount' in node;

const isGridChild = (node: SceneNode): node is SceneNode & GridChildrenMixin => 'gridRowAnchorIndex' in node;

const isDimensionNode = (node: SceneNode): node is SceneNode & DimensionAndPositionMixin => 'x' in node;

const isConstraintNode = (node: SceneNode): node is SceneNode & ConstraintMixin => 'constraints' in node;

export const extractAutoLayout = (node: SceneNode) => {
	const result: ExtractedLayoutProps = {};
	if (!isAutoLayoutContainer(node)) return result;
	const containerProps = pickDefined(node, AUTO_LAYOUT_CONTAINER_KEYS);
	Object.assign(result, containerProps);
	if (isAutoLayoutChild(node)) {
		const containerChildProps = pickDefined(node, AUTO_LAYOUT_CHILD_KEYS);
		Object.assign(result, containerChildProps);
	}
	if (isLayoutSizingNode(node)) {
		const layoutSize = pickDefined(node, LAYOUT_SIZING_KEYS);
		Object.assign(result, layoutSize);
	}
	if (isGridContainer(node)) {
		const gridContainerProps = pickDefined(node, GRID_CONTAINER_KEYS);
		Object.assign(result, gridContainerProps);
	}
	if (isGridChild(node)) {
		const child = pickDefined(node, GRID_CHILD_KEYS);
		Object.assign(result, child);
	}
	if (isDimensionNode(node)) {
		const dimensions = pickDefined(node, POSITION_KEYS);
		Object.assign(result, dimensions);
	}
	if (isConstraintNode(node)) {
		const constraints = pickDefined(node, CONSTRAINT_KEYS);
		Object.assign(result, constraints);
	}
	return result;
};
