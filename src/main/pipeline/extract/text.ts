import { deepPick } from '../../utils';

type TextSegmentProperty = Parameters<TextNode['getStyledTextSegments']>[0][number];

export const TEXT_DEFAULT_KEYS = [
	'fontName',
	'fontSize',
	'fontWeight',
	'textCase',
	'textDecoration',
	'textDecorationStyle',
	'textDecorationOffset',
	'textDecorationThickness',
	'textDecorationColor',
	'textDecorationSkipInk',
	'lineHeight',
	'letterSpacing',
	'fills',
	'fillStyleId',
	'textStyleId',
	'paragraphIndent',
	'paragraphSpacing',
	'listSpacing',
	'hangingPunctuation',
	'hangingList',
	'leadingTrim',
	'textAlignHorizontal',
	'textAlignVertical',
	'textAutoResize',
	'textTruncation',
	'maxLines',
	'hyperlink',
	'boundVariables',
	'openTypeFeatures',
] satisfies ReadonlyArray<keyof TextNode>;

export const TEXT_SEGMENT_PROPERTIES: ReadonlyArray<TextSegmentProperty> = [
	'fontName',
	'fontSize',
	'fontWeight',
	'fontStyle',
	'textDecoration',
	'textDecorationStyle',
	'textDecorationOffset',
	'textDecorationThickness',
	'textDecorationColor',
	'textDecorationSkipInk',
	'textCase',
	'lineHeight',
	'letterSpacing',
	'fills',
	'fillStyleId',
	'textStyleId',
	'listOptions',
	'listSpacing',
	'indentation',
	'paragraphIndent',
	'paragraphSpacing',
	'hyperlink',
	'openTypeFeatures',
	'boundVariables',
];

export type ExtractedTextProps = Partial<ReturnType<typeof extractTextSegments>>;
export const extractTextSegments = (node: TextNode) => {
	const origin = deepPick(node, TEXT_DEFAULT_KEYS);
	const characters = node.getStyledTextSegments([...TEXT_SEGMENT_PROPERTIES]);
	return { ...origin, characters };
};

export const extractTextProps = (node: SceneNode): ExtractedTextProps => {
	if (node.type !== 'TEXT') {
		return {};
	}
	return extractTextSegments(node);
};
