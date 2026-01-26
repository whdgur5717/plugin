export const exportSvg = async (node: SceneNode): Promise<string | null> => {
	try {
		const bytes = await node.exportAsync({ format: 'SVG' });
		return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
	} catch (error) {
		console.error(`SVG export failed for node ${node.id}:`, error);
		return null;
	}
};    