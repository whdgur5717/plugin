import { isUndefined } from 'es-toolkit';

export const deepPick = <T extends object, K extends keyof T>(target: T, keys: ReadonlyArray<K>): Pick<T, K> => {
	const result = {} as Pick<T, K>;

	keys.forEach((key) => {
		if (!isUndefined(target[key])) {
			result[key] = target[key];
		}
	});

	return result;
};
