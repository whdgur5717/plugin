import { buildNodeTree } from './node';

export default function () {
	figma.showUI(__html__, { width: 300, height: 260, themeColors: true });

	figma.on('selectionchange', async () => {
		console.log(await buildNodeTree(figma.currentPage.selection[0]));
	});
}
