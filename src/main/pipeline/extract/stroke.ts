import { deepPick } from '../../utils';
export const STROKE_KEYS = [
	'strokes',
	'strokeStyleId',
	'strokeWeight',
	'strokeJoin',
	'strokeAlign',
	'dashPattern',
	'strokeGeometry',
] satisfies ReadonlyArray<keyof MinimalStrokesMixin>;

export const INDIVIDUAL_STROKE_KEYS = [
	'strokeTopWeight',
	'strokeBottomWeight',
	'strokeLeftWeight',
	'strokeRightWeight',
] satisfies ReadonlyArray<keyof IndividualStrokesMixin>;

export const GEOMETRY_STROKE_KEYS = ['strokeCap', 'strokeMiterLimit'] satisfies ReadonlyArray<keyof GeometryMixin>;

export const CORNER_KEYS = ['cornerRadius', 'cornerSmoothing'] satisfies ReadonlyArray<keyof CornerMixin>;

export const RECTANGLE_CORNER_KEYS = [
	'topLeftRadius',
	'topRightRadius',
	'bottomLeftRadius',
	'bottomRightRadius',
] satisfies ReadonlyArray<keyof RectangleCornerMixin>;

export const VECTOR_NETWORK_KEYS = ['vectorNetwork'] satisfies ReadonlyArray<keyof VectorNode>;

type StrokeKeys =
	| (typeof STROKE_KEYS)[number]
	| (typeof INDIVIDUAL_STROKE_KEYS)[number]
	| (typeof GEOMETRY_STROKE_KEYS)[number]
	| (typeof CORNER_KEYS)[number]
	| (typeof RECTANGLE_CORNER_KEYS)[number]
	| (typeof VECTOR_NETWORK_KEYS)[number];

export type ExtractedStrokeProps = Partial<
	Pick<
		MinimalStrokesMixin & IndividualStrokesMixin & GeometryMixin & CornerMixin & RectangleCornerMixin & VectorNode,
		StrokeKeys
	>
>;

const hasMinimalStrokesMixin = (node: SceneNode): node is SceneNode & MinimalStrokesMixin => 'strokes' in node;

const hasIndividualStrokesMixin = (node: SceneNode): node is SceneNode & IndividualStrokesMixin =>
	'strokeTopWeight' in node;

const hasGeometryStrokeMixin = (node: SceneNode): node is SceneNode & GeometryMixin => 'strokeCap' in node;

const hasCornerMixin = (node: SceneNode): node is SceneNode & CornerMixin => 'cornerRadius' in node;

const hasRectangleCornerMixin = (node: SceneNode): node is SceneNode & RectangleCornerMixin => 'topLeftRadius' in node;

const hasVectorNetwork = (node: SceneNode): node is SceneNode & VectorNode => 'vectorNetwork' in node;

export const extractStrokeProps = (node: SceneNode): ExtractedStrokeProps => {
	const result: ExtractedStrokeProps = {};

	if (hasMinimalStrokesMixin(node)) {
		Object.assign(result, deepPick(node, STROKE_KEYS));
	}

	if (hasIndividualStrokesMixin(node)) {
		Object.assign(result, deepPick(node, INDIVIDUAL_STROKE_KEYS));
	}

	if (hasGeometryStrokeMixin(node)) {
		Object.assign(result, deepPick(node, GEOMETRY_STROKE_KEYS));
	}

	if (hasCornerMixin(node)) {
		Object.assign(result, deepPick(node, CORNER_KEYS));
	}

	if (hasRectangleCornerMixin(node)) {
		Object.assign(result, deepPick(node, RECTANGLE_CORNER_KEYS));
	}

	if (hasVectorNetwork(node)) {
		Object.assign(result, deepPick(node, VECTOR_NETWORK_KEYS));
	}

	return result;
};
