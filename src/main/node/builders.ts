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

export const buildTextNode = async (node: TextNode): Promise<TextReactNode> => ({
	type: 'TEXT',
	...(await buildNodeData(node)),
});

export const buildFrameNode = async (node: FrameNode): Promise<FrameReactNode> => ({
	type: 'FRAME',
	...(await buildNodeData(node)),
});

export const buildInstanceNode = async (node: InstanceNode): Promise<InstanceReactNode> => ({
	type: 'INSTANCE',
	...(await buildNodeData(node)),
});

export const buildGroupNode = async (node: GroupNode): Promise<GroupReactNode> => ({
	type: 'GROUP',
	...(await buildNodeData(node)),
});

export const buildRectangleNode = async (node: RectangleNode): Promise<RectangleReactNode> => ({
	type: 'RECTANGLE',
	...(await buildNodeData(node)),
});

export const buildGenericNode = async (
	node: Extract<SceneNode, { type: Exclude<SceneNode['type'], ExtractNodeType> }>,
): Promise<GenericReactNode> => ({
	type: node.type,
	...(await buildNodeData(node)),
});
