import type { NodeData } from '../types/node';

/**
 * Codegen 출력 옵션
 */
export interface SerializeOptions {
  /** 들여쓰기 문자 */
  indent?: string;
  /** 스타일 출력 형식 */
  styleFormat?: 'inline' | 'tailwind';
}

const DEFAULT_OPTIONS: Required<SerializeOptions> = {
  indent: '  ',
  styleFormat: 'inline',
};

/**
 * CSSProperties를 inline style 문자열로 변환
 */
function serializeStyle(style: Record<string, unknown>): string {
  const entries = Object.entries(style).filter(([, value]) => value !== undefined);
  if (entries.length === 0) return '';

  const styleStr = entries
    .map(([key, value]) => {
      // camelCase를 유지 (JSX 스타일)
      const formattedValue = typeof value === 'number' ? value : JSON.stringify(value);
      return `${key}: ${formattedValue}`;
    })
    .join(', ');

  return `{{ ${styleStr} }}`;
}

/**
 * props를 JSX 속성 문자열로 변환
 */
function serializeProps(props: Record<string, unknown>): string {
  return Object.entries(props)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      return `${key}={${JSON.stringify(value)}}`;
    })
    .join(' ');
}

/**
 * NodeData를 JSX 코드로 serialize
 */
export function serializeNode(node: NodeData, options: SerializeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return serializeNodeInternal(node, opts, 0);
}

function serializeNodeInternal(
  node: NodeData,
  options: Required<SerializeOptions>,
  depth: number
): string {
  const { indent } = options;
  const currentIndent = indent.repeat(depth);
  // const childIndent = indent.repeat(depth + 1);

  const { type, props = {}, style, children } = node;

  // 속성 문자열 생성
  const attrs: string[] = [];

  if (Object.keys(props).length > 0) {
    attrs.push(serializeProps(props));
  }

  if (style && Object.keys(style).length > 0) {
    attrs.push(`style=${serializeStyle(style as Record<string, unknown>)}`);
  }

  const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';

  // 자식이 없는 경우
  if (!children || (Array.isArray(children) && children.length === 0)) {
    return `${currentIndent}<${type}${attrStr} />`;
  }

  // 텍스트 자식인 경우
  if (typeof children === 'string') {
    return `${currentIndent}<${type}${attrStr}>${children}</${type}>`;
  }

  // 배열 자식인 경우
  const childrenStr = children
    .map((child) => serializeNodeInternal(child, options, depth + 1))
    .join('\n');

  return `${currentIndent}<${type}${attrStr}>\n${childrenStr}\n${currentIndent}</${type}>`;
}

/**
 * DocumentNode를 완전한 React 컴포넌트 코드로 serialize
 */
export function serializeDocument(
  node: NodeData,
  componentName: string = 'Component',
  options: SerializeOptions = {}
): string {
  const jsx = serializeNode(node, options);

  return `export function ${componentName}() {
  return (
${jsx
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n')}
  );
}`;
}
