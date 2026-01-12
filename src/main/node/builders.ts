import { buildNodeData } from './props';
import type {
	ExtractNodeType,
	FrameReactNode,
	GenericReactNode,
	GroupReactNode,
	InstanceReactNode,
	RectangleReactNode,
	TextReactNode,
} from './type';

export const buildTextNode = (node: TextNode): TextReactNode => ({
	type: 'TEXT',
	...buildNodeData(node),
});

export const buildFrameNode = (node: FrameNode): FrameReactNode => ({
	type: 'FRAME',
	...buildNodeData(node),
});

export const buildInstanceNode = (node: InstanceNode): InstanceReactNode => {
	const data = buildNodeData(node);
	return {
		type: 'INSTANCE',
		...data,
		props: {
			...data.props,
			componentProperties: node.componentProperties,
		},
	};
};

export const buildGroupNode = (node: GroupNode): GroupReactNode => ({
	type: 'GROUP',
	...buildNodeData(node),
});

export const buildRectangleNode = (node: RectangleNode): RectangleReactNode => ({
	type: 'RECTANGLE',
	...buildNodeData(node),
});

export const buildGenericNode = (
	node: Extract<SceneNode, { type: Exclude<SceneNode['type'], ExtractNodeType> }>,
): GenericReactNode => ({
	type: node.type,
	...buildNodeData(node),
});
