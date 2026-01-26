import type { ComponentType, CSSProperties, ReactNode } from 'react';

/**
 * 컴포넌트 정의
 */
export interface ComponentDefinition {
  /** 컴포넌트 */
  component: ComponentType<ComponentProps>;
  /** 표시 이름 */
  displayName: string;
  /** 기본 props */
  defaultProps?: Record<string, unknown>;
  /** 기본 스타일 */
  defaultStyle?: CSSProperties;
}

/**
 * 렌더링 시 전달되는 기본 props
 */
export interface ComponentProps {
  style?: CSSProperties;
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * 컴포넌트 레지스트리
 */
class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>();

  /**
   * 컴포넌트 등록
   */
  register(type: string, definition: ComponentDefinition): void {
    this.components.set(type, definition);
  }

  /**
   * 컴포넌트 조회
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  /**
   * 컴포넌트 존재 확인
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * 등록된 모든 컴포넌트 타입 조회
   */
  getTypes(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * React 컴포넌트 조회 (렌더링용)
   */
  getComponent(type: string): ComponentType<ComponentProps> | null {
    const definition = this.components.get(type);
    return definition?.component ?? null;
  }
}

/** 글로벌 컴포넌트 레지스트리 */
export const componentRegistry = new ComponentRegistry();

/** 컴포넌트 조회 헬퍼 */
export function getComponent(type: string): ComponentType<ComponentProps> | null {
  return componentRegistry.getComponent(type);
}

/** 컴포넌트 등록 헬퍼 */
export function registerComponent(type: string, definition: ComponentDefinition): void {
  componentRegistry.register(type, definition);
}
