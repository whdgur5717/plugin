import type { TokenizedValue } from './types';

export const toTokenizedValue = <T>(value: T, alias?: VariableAlias | null): TokenizedValue<T> =>
	alias ? { tokenRef: { id: alias.id }, fallback: value } : value;
