import type { CSSProperties } from 'react';

/**
 * 노드 데이터 - React 트리의 JSON 표현
 * 에디터의 상태 모델이자 codegen의 source of truth
 */
export interface NodeData {
  /** 고유 식별자 */
  id: string;

  /** 컴포넌트 타입 ('div', 'Flex', 'Button' 등) */
  type: string;

  /** 컴포넌트 props (style 제외) */
  props?: Record<string, unknown>;

  /** CSS 스타일 객체 */
  style?: CSSProperties;

  /** 자식 노드 또는 텍스트 콘텐츠 */
  children?: NodeData[] | string;

  /** 가시성 (기본값: true) */
  visible?: boolean;

  /** 잠금 상태 (기본값: false) */
  locked?: boolean;
}

/**
 * 문서 루트 노드
 */
export interface DocumentNode extends NodeData {
  /** 문서 메타데이터 */
  meta?: {
    name?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * 노드 위치 정보
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 노드 크기 정보
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 노드 바운딩 박스
 */
export interface BoundingBox extends Position, Size { }

/**
 * 컴포넌트 정의 (Master Component)
 * Figma의 Component와 유사 - 재사용 가능한 노드 템플릿
 */
export interface ComponentDefinition {
  /** 컴포넌트 고유 ID */
  id: string;

  /** 컴포넌트 이름 */
  name: string;

  /** 컴포넌트 루트 노드 (템플릿) */
  root: NodeData;

  /** 생성 시간 */
  createdAt: string;
}

/**
 * 인스턴스 노드 - 컴포넌트를 참조하는 노드
 * type이 '__INSTANCE__'인 특수 노드
 */
export interface InstanceNode extends Omit<NodeData, 'type' | 'children'> {
  type: '__INSTANCE__';

  /** 참조하는 컴포넌트 ID */
  componentId: string;

  /** 오버라이드된 속성 (props, style) */
  overrides?: {
    /** 노드 ID → 오버라이드 */
    [nodeId: string]: {
      props?: Record<string, unknown>;
      style?: CSSProperties;
      children?: string; // 텍스트 오버라이드
    };
  };
}
