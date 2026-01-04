import { extractStyle } from '../pipeline/extract/style';
import { normalizeStyle } from '../pipeline/normalize/style';
import type { BaseNodeProps } from './type';

export const extractBaseProps = (node: SceneNode): BaseNodeProps => ({
	id: node.id,
	name: node.name,
	style: normalizeStyle(extractStyle(node)),
});
