import { buildNodeTree } from './node';

export default function () {
	figma.showUI(__html__, { width: 400, height: 500, themeColors: true });

	figma.on('selectionchange', async () => {
		const selectedNode = figma.currentPage.selection[0];
		if (selectedNode) {
			const reactNode = await buildNodeTree(selectedNode);
			figma.ui.postMessage({ type: 'NODE_DATA', data: reactNode });
		} else {
			figma.ui.postMessage({ type: 'NODE_DATA', data: null });
		}
	});
}
