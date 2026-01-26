import type { ExtractedBoundVariables } from '../pipeline/extract/types';
import type {
	NormalizedCorner,
	NormalizedEffect,
	NormalizedFill,
	NormalizedLayout,
	NormalizedStroke,
	NormalizedText,
	NormalizedValue,
	TokenRef,
	TokenizedValue,
} from '../pipeline/normalize/types';

/*
 * 참조 타입
 */
export type InstanceRef = {
	componentId: string;
	componentName: string;
	variantInfo?: Record<string, string>;
};

export type TokenRefMapping = {
	variableId: string;
	token: TokenRef;
};

export type AssetRef = {
	kind: 'image' | 'vector' | 'mask';
	id: string;
	name?: string;
};

/*
 * 핵심 타입 필터
 */

export type ExtractNodeType = Extract<SceneNode['type'], 'FRAME' | 'INSTANCE' | 'GROUP' | 'TEXT' | 'RECTANGLE'>;

type RowsColsLayoutGrid = Extract<LayoutGrid, { pattern: 'ROWS' | 'COLUMNS' }>;

export type OutputLayoutGrid = {
	pattern: LayoutGrid['pattern'];
	alignment?: RowsColsLayoutGrid['alignment'];
	gutterSize?: TokenizedValue<number>;
	count?: TokenizedValue<number>;
	sectionSize?: TokenizedValue<number>;
	offset?: TokenizedValue<number>;
	visible?: boolean;
	color?: RGBA;
	tokenRef?: TokenRef;
};

export type OutputNormalizedLayout = NormalizedLayout & {
	layoutGrids?: OutputLayoutGrid[];
};

export type OutputNormalizedStroke = Omit<NormalizedStroke, 'paints'> & {
	paints: NormalizedValue<Array<TokenizedValue<NormalizedFill>>>;
};

export type OutputNormalizedCorner = NormalizedCorner;

export type OutputNormalizedStyle = {
	fills: NormalizedValue<Array<TokenizedValue<NormalizedFill>>>;
	effects: NormalizedValue<Array<TokenizedValue<NormalizedEffect>>>;
	stroke: OutputNormalizedStroke | null;
	corner: OutputNormalizedCorner | null;
	layout: OutputNormalizedLayout;
	text: NormalizedText | null;
	visible?: TokenizedValue<boolean>;
	opacity?: TokenizedValue<number>;
};

export type OutputComponentProperties = {
	[propertyName: string]: Omit<ComponentProperties[string], 'value'> & {
		value: TokenizedValue<ComponentProperties[string]['value']>;
	};
};

/*
 * 모든 React-like 노드가 공유하는 기본 props
 */
export interface BaseNodeProps<TSTyle = OutputNormalizedStyle> {
	id: string;
	name: string;
	style?: TSTyle;
	boundVariables?: ExtractedBoundVariables;
}

/*
 * React-like 노드의 기본 형태
 */
export interface BaseReactNode<
	TType extends SceneNode['type'] | string,
	TProps extends BaseNodeProps,
	TChildren = ReactNode[],
> {
	type: TType;
	props: TProps;
	children?: TChildren;
	instanceRef?: InstanceRef;
	tokensRef?: TokenRefMapping[];
	assets?: AssetRef[];
	svgFallback?: string;
}

/*
 * 노드별 props
 */
export type InstanceNodeProps = BaseNodeProps & {
	componentProperties?: OutputComponentProperties;
};

/*
 * 노드별 React-like 노드
 */
export type InstanceReactNode = BaseReactNode<'INSTANCE', InstanceNodeProps>;

export type FrameNodeProps = BaseNodeProps;

export type FrameReactNode = BaseReactNode<'FRAME', FrameNodeProps>;
export type TextNodeProps = BaseNodeProps;

export type TextReactNode = BaseReactNode<'TEXT', TextNodeProps>;

export type GroupReactNode = BaseReactNode<'GROUP', BaseNodeProps>;

export type RectangleReactNode = BaseReactNode<'RECTANGLE', BaseNodeProps>;

/*
 * 일반 fallback 노드 (Extract 대상 제외 타입)
 */
export type GenericReactNode = BaseReactNode<Exclude<SceneNode['type'], ExtractNodeType>, BaseNodeProps>;

/*
 * React-like 노드 전체 유니온
 */
export type ReactNode =
	| InstanceReactNode
	| FrameReactNode
	| TextReactNode
	| GroupReactNode
	| RectangleReactNode
	| GenericReactNode;
