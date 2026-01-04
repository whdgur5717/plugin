import type { TokenRef } from '../normalize/types';

export type VariableModeInfo = {
	id: string;
	name: string;
};

export type VariableCollectionInfo = {
	id: string;
	name: string;
	defaultModeId: string;
	modes: VariableModeInfo[];
};

export type VariableInfo = {
	id: string;
	name: string;
	collectionId: string;
	resolvedType: VariableResolvedDataType;
	remote: boolean;
	key: string;
};

export class VariableRegistry {
	private variableCache = new Map<string, Variable | null>();
	private collectionCache = new Map<string, VariableCollection | null>();

	clear(): void {
		this.variableCache.clear();
		this.collectionCache.clear();
	}

	async getVariable(variableId: string): Promise<Variable | null> {
		if (this.variableCache.has(variableId)) {
			return this.variableCache.get(variableId) ?? null;
		}
		const variable = await figma.variables.getVariableByIdAsync(variableId);
		this.variableCache.set(variableId, variable);
		return variable;
	}

	async getCollection(collectionId: string): Promise<VariableCollection | null> {
		if (this.collectionCache.has(collectionId)) {
			return this.collectionCache.get(collectionId) ?? null;
		}
		const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
		this.collectionCache.set(collectionId, collection);
		return collection;
	}

	async getVariableInfo(variableId: string): Promise<VariableInfo | null> {
		const variable = await this.getVariable(variableId);
		if (!variable) return null;
		return {
			id: variable.id,
			name: variable.name,
			collectionId: variable.variableCollectionId,
			resolvedType: variable.resolvedType,
			remote: variable.remote,
			key: variable.key,
		};
	}

	async getCollectionInfo(collectionId: string): Promise<VariableCollectionInfo | null> {
		const collection = await this.getCollection(collectionId);
		if (!collection) return null;
		return {
			id: collection.id,
			name: collection.name,
			defaultModeId: collection.defaultModeId,
			modes: collection.modes.map((mode) => ({
				id: mode.modeId,
				name: mode.name,
			})),
		};
	}

	async resolveAlias(alias: VariableAlias, resolvedModes?: Record<string, string>): Promise<TokenRef | null> {
		if (alias.type !== 'VARIABLE_ALIAS') return null;
		const variable = await this.getVariable(alias.id);
		if (!variable) return null;

		const collection = await this.getCollection(variable.variableCollectionId);
		const modeId = resolvedModes?.[variable.variableCollectionId] ?? collection?.defaultModeId ?? undefined;
		const modeName = collection?.modes.find((mode) => mode.modeId === modeId)?.name;

		return {
			id: variable.id,
			name: variable.name,
			collectionId: variable.variableCollectionId,
			collectionName: collection?.name,
			modeId,
			modeName,
		};
	}
}
