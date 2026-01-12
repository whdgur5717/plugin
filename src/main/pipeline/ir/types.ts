import type { NormalizedStyle, TokenRef } from '../normalize/types';

export type IRInstanceRef = {
	componentId: string;
	componentName: string;
	variantInfo?: Record<string, string>;
};

export type IRTokenRef = {
	variableId: string;
	token: TokenRef;
};

export type IRAssetRef = {
	kind: 'image' | 'vector' | 'mask';
	id: string;
	name?: string;
};

export type IRProps = {
	id: string;
	name: string;
	style: NormalizedStyle;
	componentProperties?: ComponentProperties;
};

export type IRNode = {
	type: SceneNode['type'] | string;
	props: IRProps;
	children?: IRNode[];
	instanceRef?: IRInstanceRef;
	tokensRef?: IRTokenRef[];
	assets?: IRAssetRef[];
};
