import type {
	Uniform,
	FigmaFieldType,
	ExtractedLeadingTrim,
	ExtractedTextSegment,
} from './value-types';

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

export type ExtractedTextProps = {
	// TextNode properties
	fontName?: Uniform<FigmaFieldType<TextNode, 'fontName'>>;
	fontSize?: Uniform<FigmaFieldType<TextNode, 'fontSize'>>;
	fontWeight?: Uniform<FigmaFieldType<TextNode, 'fontWeight'>>;
	textCase?: Uniform<FigmaFieldType<TextNode, 'textCase'>>;
	textDecoration?: Uniform<FigmaFieldType<TextNode, 'textDecoration'>>;
	textDecorationStyle?: Uniform<FigmaFieldType<TextNode, 'textDecorationStyle'>>;
	textDecorationOffset?: Uniform<FigmaFieldType<TextNode, 'textDecorationOffset'>>;
	textDecorationThickness?: Uniform<FigmaFieldType<TextNode, 'textDecorationThickness'>>;
	textDecorationColor?: Uniform<FigmaFieldType<TextNode, 'textDecorationColor'>>;
	textDecorationSkipInk?: Uniform<FigmaFieldType<TextNode, 'textDecorationSkipInk'>>;
	lineHeight?: Uniform<FigmaFieldType<TextNode, 'lineHeight'>>;
	letterSpacing?: Uniform<FigmaFieldType<TextNode, 'letterSpacing'>>;
	fills?: Uniform<FigmaFieldType<TextNode, 'fills'>>;
	fillStyleId?: Uniform<FigmaFieldType<TextNode, 'fillStyleId'>>;
	textStyleId?: Uniform<FigmaFieldType<TextNode, 'textStyleId'>>;
	paragraphIndent?: Uniform<FigmaFieldType<TextNode, 'paragraphIndent'>>;
	paragraphSpacing?: Uniform<FigmaFieldType<TextNode, 'paragraphSpacing'>>;
	listSpacing?: Uniform<FigmaFieldType<TextNode, 'listSpacing'>>;
	hangingPunctuation?: Uniform<FigmaFieldType<TextNode, 'hangingPunctuation'>>;
	hangingList?: Uniform<FigmaFieldType<TextNode, 'hangingList'>>;
	textAlignHorizontal?: Uniform<FigmaFieldType<TextNode, 'textAlignHorizontal'>>;
	textAlignVertical?: Uniform<FigmaFieldType<TextNode, 'textAlignVertical'>>;
	textAutoResize?: Uniform<FigmaFieldType<TextNode, 'textAutoResize'>>;
	textTruncation?: Uniform<FigmaFieldType<TextNode, 'textTruncation'>>;
	maxLines?: Uniform<FigmaFieldType<TextNode, 'maxLines'>>;
	hyperlink?: Uniform<FigmaFieldType<TextNode, 'hyperlink'>>;
	boundVariables?: Uniform<FigmaFieldType<TextNode, 'boundVariables'>>;
	openTypeFeatures?: Uniform<FigmaFieldType<TextNode, 'openTypeFeatures'>>;
	leadingTrim?: ExtractedLeadingTrim;
	// Characters from getStyledTextSegments
	characters?: ExtractedTextSegment[];
};

export class TextExtractor {
	extract(node: SceneNode): ExtractedTextProps {
		if (node.type !== 'TEXT') {
			return {};
		}
		return this.extractTextNode(node);
	}

	private uniform<T>(value: T): Uniform<T> {
		return { type: 'uniform', value };
	}

	private extractTextNode(node: TextNode): ExtractedTextProps {
		const result: ExtractedTextProps = {};

		// Node-level properties (may be mixed, but we extract if uniform)
		this.extractNodeProperties(result, node);

		// Segments from getStyledTextSegments
		const rawSegments = node.getStyledTextSegments([...TEXT_SEGMENT_PROPERTIES]);
		result.characters = rawSegments.map((seg) => this.extractSegment(seg));

		// Leading trim
		result.leadingTrim = this.extractLeadingTrim(node);

		return result;
	}

	private extractNodeProperties(result: ExtractedTextProps, node: TextNode) {
		// These properties can be mixed at node level, but we extract uniform values
		if (node.fontName !== figma.mixed) result.fontName = this.uniform(node.fontName);
		if (node.fontSize !== figma.mixed) result.fontSize = this.uniform(node.fontSize);
		if (node.fontWeight !== figma.mixed) result.fontWeight = this.uniform(node.fontWeight);
		if (node.textCase !== figma.mixed) result.textCase = this.uniform(node.textCase);
		if (node.textDecoration !== figma.mixed) result.textDecoration = this.uniform(node.textDecoration);
		if (node.textDecorationStyle !== figma.mixed) result.textDecorationStyle = this.uniform(node.textDecorationStyle);
		if (node.textDecorationOffset !== figma.mixed) result.textDecorationOffset = this.uniform(node.textDecorationOffset);
		if (node.textDecorationThickness !== figma.mixed)
			result.textDecorationThickness = this.uniform(node.textDecorationThickness);
		if (node.textDecorationColor !== figma.mixed) result.textDecorationColor = this.uniform(node.textDecorationColor);
		if (node.textDecorationSkipInk !== figma.mixed)
			result.textDecorationSkipInk = this.uniform(node.textDecorationSkipInk);
		if (node.lineHeight !== figma.mixed) result.lineHeight = this.uniform(node.lineHeight);
		if (node.letterSpacing !== figma.mixed) result.letterSpacing = this.uniform(node.letterSpacing);
		if (node.fills !== figma.mixed) result.fills = this.uniform(node.fills);
		if (node.fillStyleId !== figma.mixed) result.fillStyleId = this.uniform(node.fillStyleId);
		if (node.textStyleId !== figma.mixed) result.textStyleId = this.uniform(node.textStyleId);
		if (node.hyperlink !== figma.mixed) result.hyperlink = this.uniform(node.hyperlink);
		if (node.openTypeFeatures !== figma.mixed) result.openTypeFeatures = this.uniform(node.openTypeFeatures);

		// These are never mixed - always uniform
		result.paragraphIndent = this.uniform(node.paragraphIndent);
		result.paragraphSpacing = this.uniform(node.paragraphSpacing);
		result.listSpacing = this.uniform(node.listSpacing);
		result.hangingPunctuation = this.uniform(node.hangingPunctuation);
		result.hangingList = this.uniform(node.hangingList);
		result.textAlignHorizontal = this.uniform(node.textAlignHorizontal);
		result.textAlignVertical = this.uniform(node.textAlignVertical);
		result.textAutoResize = this.uniform(node.textAutoResize);
		result.textTruncation = this.uniform(node.textTruncation);
		result.maxLines = this.uniform(node.maxLines);
		if (node.boundVariables) result.boundVariables = this.uniform(node.boundVariables);
	}

	private extractSegment(seg: StyledTextSegment): ExtractedTextSegment {
		return {
			start: seg.start,
			end: seg.end,
			characters: seg.characters,
			fontSize: this.uniform(seg.fontSize),
			fontName: this.uniform(seg.fontName),
			fontWeight: this.uniform(seg.fontWeight),
			fontStyle: this.uniform(seg.fontStyle),
			textDecoration: this.uniform(seg.textDecoration),
			textDecorationStyle: this.uniform(seg.textDecorationStyle),
			textDecorationOffset: this.uniform(seg.textDecorationOffset),
			textDecorationThickness: this.uniform(seg.textDecorationThickness),
			textDecorationColor: this.uniform(seg.textDecorationColor),
			textDecorationSkipInk: this.uniform(seg.textDecorationSkipInk),
			textCase: this.uniform(seg.textCase),
			lineHeight: this.uniform(seg.lineHeight),
			letterSpacing: this.uniform(seg.letterSpacing),
			fills: this.uniform(seg.fills),
			fillStyleId: this.uniform(seg.fillStyleId),
			textStyleId: this.uniform(seg.textStyleId),
			hyperlink: this.uniform(seg.hyperlink),
			openTypeFeatures: this.uniform(seg.openTypeFeatures),
			listOptions: this.uniform(seg.listOptions),
			listSpacing: this.uniform(seg.listSpacing),
			indentation: this.uniform(seg.indentation),
			paragraphIndent: this.uniform(seg.paragraphIndent),
			paragraphSpacing: this.uniform(seg.paragraphSpacing),
			boundVariables: this.uniform(seg.boundVariables),
		};
	}

	private extractLeadingTrim(node: TextNode): ExtractedLeadingTrim {
		const leadingTrim = node.leadingTrim;
		if (leadingTrim === figma.mixed) {
			return { type: 'mixed', value: 'NONE' };
		}
		return { type: 'uniform', value: leadingTrim };
	}
}

export const textExtractor = new TextExtractor();
