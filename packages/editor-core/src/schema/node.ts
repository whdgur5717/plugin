import { z } from 'zod';

/**
 * CSS 스타일 스키마 (주요 속성들)
 * 전체 CSSProperties를 검증하진 않고, 자주 사용되는 속성들만 정의
 */
export const styleSchema = z.record(z.string(), z.unknown());

/**
 * NodeData 기본 스키마 (재귀 없음)
 */
const baseNodeDataSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()).optional(),
  style: styleSchema.optional(),
});

/**
 * NodeData 스키마 (재귀 포함)
 */
export const nodeDataSchema: z.ZodType<{
  id: string;
  type: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: unknown[] | string;
}> = baseNodeDataSchema.extend({
  children: z.union([z.lazy(() => z.array(nodeDataSchema)), z.string()]).optional(),
});

/**
 * DocumentNode 스키마
 */
export const documentNodeSchema = baseNodeDataSchema.extend({
  children: z.union([z.lazy(() => z.array(nodeDataSchema)), z.string()]).optional(),
  meta: z
    .object({
      name: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .optional(),
});

/**
 * Position 스키마
 */
export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

/**
 * Size 스키마
 */
export const sizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

/**
 * BoundingBox 스키마
 */
export const boundingBoxSchema = positionSchema.merge(sizeSchema);
