import { z } from 'zod';

export const variableAliasSchema = z.object({
	type: z.literal('VARIABLE_ALIAS'),
	id: z.string(),
});

export const tokenRefSchema = z.object({
	id: z.string(),
	name: z.string().optional(),
	collectionId: z.string().optional(),
	collectionName: z.string().optional(),
	modeId: z.string().optional(),
	modeName: z.string().optional(),
});

export const tokenizedValueSchema = z.object({
	tokenRef: tokenRefSchema,
	fallback: z.unknown(),
});
