import {
	buildFrameNode,
	buildGenericNode,
	buildGroupNode,
	buildInstanceNode,
	buildRectangleNode,
	buildTextNode,
} from './builders';
import type { ReactNode } from './type';

export class NodeTreeBuilder {
	async build(node: SceneNode): Promise<ReactNode> {
		let baseNode: ReactNode;
		switch (node.type) {
			case 'TEXT':
				baseNode = await buildTextNode(node);
				break;
			case 'RECTANGLE':
				baseNode = await buildRectangleNode(node);
				break;
			case 'INSTANCE':
				baseNode = await buildInstanceNode(node);
				break;
			case 'FRAME':
				baseNode = await buildFrameNode(node);
				break;
			case 'GROUP':
				baseNode = await buildGroupNode(node);
				break;
			default:
				baseNode = await buildGenericNode(node);
		}

		const childrenNodes = 'children' in node ? node.children.filter((child) => child.visible !== false) : [];

		if (childrenNodes.length === 0) {
			return baseNode;
		}

		const children = await Promise.all(childrenNodes.map((child) => this.build(child)));
		return { ...baseNode, children };
	}
}

export const nodeTreeBuilder = new NodeTreeBuilder();

export const buildNodeTree = (node: SceneNode): Promise<ReactNode> => nodeTreeBuilder.build(node);

export const figmaNodeToReactNode = buildNodeTree;
