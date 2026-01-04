import type { NormalizedStyle } from '../pipeline/normalize/types';

/*
 * 핵심 타입 필터
 */
export type ExtractNodeType = Extract<SceneNode['type'], 'FRAME' | 'INSTANCE' | 'GROUP' | 'TEXT' | 'RECTANGLE'>;

/*
 * 모든 React-like 노드가 공유하는 기본 props
 */
export interface BaseNodeProps<TSTyle = NormalizedStyle> {
	id: string;
	name: string;
	style?: TSTyle;
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
}

/*
 * 노드별 props
 */
export type InstanceNodeProps = BaseNodeProps & {
	componentProperties?: ComponentProperties;
};

/*
 * 노드별 React-like 노드
 */
export type InstanceReactNode = BaseReactNode<'INSTANCE', InstanceNodeProps>;

export type FrameNodeProps = BaseNodeProps;

export type FrameReactNode = BaseReactNode<'FRAME', FrameNodeProps>;
export type TextNodeProps = BaseNodeProps;

export type TextReactNode = BaseReactNode<'TEXT', TextNodeProps, []>;

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
