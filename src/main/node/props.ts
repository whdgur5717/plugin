import type { ExtractedBoundVariables } from '../pipeline/extract/types';
import { extractStyle } from '../pipeline/extract/style';
import type { IRAssetRef, IRInstanceRef, IRTokenRef } from '../pipeline/ir/types';
import { normalizeStyle } from '../pipeline/normalize/style';
import type { NormalizedFill, NormalizedStyle, TokenRef, TokenizedValue } from '../pipeline/normalize/types';
import type { BaseNodeProps } from './type';

type BuiltNodeData = {
	props: BaseNodeProps;
	instanceRef?: IRInstanceRef;
	tokensRef?: IRTokenRef[];
	assets?: IRAssetRef[];
};

const isTokenizedValue = <T>(value: TokenizedValue<T>): value is { tokenRef: TokenRef; fallback: T } =>
	!!value && typeof value === 'object' && 'tokenRef' in value && 'fallback' in value;

const unwrapTokenized = <T>(value: TokenizedValue<T>): T => (isTokenizedValue(value) ? value.fallback : value);

const buildTokenRefs = (boundVariables?: ExtractedBoundVariables): IRTokenRef[] | undefined => {
	if (!boundVariables || boundVariables.ids.length === 0) return undefined;
	return boundVariables.ids.map((id) => ({
		variableId: id,
		token: { id },
	}));
};

const buildInstanceRef = (node: SceneNode): IRInstanceRef | undefined => {
	if (node.type !== 'INSTANCE') return undefined;
	const mainComponent = node.mainComponent;
	if (!mainComponent) return undefined;
	const variantProperties =
		'variantProperties' in node
			? (node as { variantProperties?: Record<string, string> }).variantProperties
			: undefined;
	const variantInfo = variantProperties && Object.keys(variantProperties).length > 0 ? variantProperties : undefined;

	return {
		componentId: mainComponent.id,
		componentName: mainComponent.name,
		variantInfo,
	};
};

const collectImageAssets = (fills: NormalizedFill[], assets: Map<string, IRAssetRef>) => {
	for (let index = 0; index < fills.length; index += 1) {
		const fill = fills[index];
		if (fill.type !== 'image') continue;
		if (!fill.imageHash) continue;
		assets.set(fill.imageHash, { kind: 'image', id: fill.imageHash });
	}
};

const buildAssetRefs = (style: NormalizedStyle): IRAssetRef[] | undefined => {
	const assets = new Map<string, IRAssetRef>();
	collectImageAssets(style.fills, assets);
	if (style.stroke) {
		collectImageAssets(style.stroke.paints, assets);
	}
	if (style.text) {
		for (let index = 0; index < style.text.runs.length; index += 1) {
			const run = style.text.runs[index];
			const fills = unwrapTokenized(run.style.fills);
			collectImageAssets(fills, assets);
		}
	}
	return assets.size > 0 ? Array.from(assets.values()) : undefined;
};

export const buildNodeData = (node: SceneNode): BuiltNodeData => {
	const extractedStyle = extractStyle(node);
	const normalizedStyle = normalizeStyle(extractedStyle);
	const props: BaseNodeProps = {
		id: node.id,
		name: node.name,
		style: normalizedStyle,
		boundVariables: extractedStyle.boundVariables,
	};

	return {
		props,
		instanceRef: buildInstanceRef(node),
		tokensRef: buildTokenRefs(extractedStyle.boundVariables),
		assets: buildAssetRefs(normalizedStyle),
	};
};
