import { deepPick } from '../../utils';

export const FILL_KEYS = ['fills', 'fillStyleId'] satisfies ReadonlyArray<keyof MinimalFillsMixin>;

export const GEOMETRY_FILL_KEYS = ['fillGeometry'] satisfies ReadonlyArray<keyof GeometryMixin>;

type FillKeys = (typeof FILL_KEYS)[number] | (typeof GEOMETRY_FILL_KEYS)[number];

export type ExtractedFillProps = Partial<Pick<MinimalFillsMixin & GeometryMixin, FillKeys>>;

const hasMinimalFillsMixin = (node: SceneNode): node is SceneNode & MinimalFillsMixin => 'fills' in node;

const hasGeometryFillMixin = (node: SceneNode): node is SceneNode & GeometryMixin => 'fillGeometry' in node;

export const extractFillProps = (node: SceneNode): ExtractedFillProps => {
	const result: ExtractedFillProps = {};

	if (hasMinimalFillsMixin(node)) {
		Object.assign(result, deepPick(node, FILL_KEYS));
	}

	if (hasGeometryFillMixin(node)) {
		Object.assign(result, deepPick(node, GEOMETRY_FILL_KEYS));
	}

	return result;
};
