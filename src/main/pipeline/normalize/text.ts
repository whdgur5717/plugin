import { normalizePaints } from './fills';
import { isNumber } from 'es-toolkit/compat';

type ExtractedTextProps = import('../extract/text').ExtractedTextProps;
type NormalizedText = import('./types').NormalizedText;

const isVariableAlias = (value: unknown): value is VariableAlias =>
	!!value &&
	typeof value === 'object' &&
	'type' in value &&
	'id' in value &&
	(value as { type?: unknown }).type === 'VARIABLE_ALIAS' &&
	typeof (value as { id?: unknown }).id === 'string';

const toTokenizedValue = <T>(value: T, alias?: VariableAlias | null) =>
	alias ? { tokenRef: { id: alias.id }, fallback: value } : value;

const getAlias = (boundVariables: Record<string, unknown> | undefined, key: string) => {
	const value = boundVariables?.[key];
	return isVariableAlias(value) ? value : null;
};

type TextSegment = NonNullable<ExtractedTextProps['characters']>[number];

const buildRunStyle = (segment: TextSegment): NormalizedText['runs'][number]['style'] => {
	const boundVariables = segment.boundVariables as Record<string, unknown> | undefined;
	const fontFamilyAlias = getAlias(boundVariables, 'fontFamily');
	const fontStyleAlias = getAlias(boundVariables, 'fontStyle');
	const fontWeightAlias = getAlias(boundVariables, 'fontWeight');
	const fontSizeAlias = getAlias(boundVariables, 'fontSize');
	const letterSpacingAlias = getAlias(boundVariables, 'letterSpacing');
	const lineHeightAlias = getAlias(boundVariables, 'lineHeight');
	const paragraphSpacingAlias = getAlias(boundVariables, 'paragraphSpacing');
	const paragraphIndentAlias = getAlias(boundVariables, 'paragraphIndent');

	const textDecorationColor = segment.textDecorationColor ?? { value: 'AUTO' };

	return {
		fontName: toTokenizedValue(segment.fontName, fontFamilyAlias),
		fontSize: toTokenizedValue(segment.fontSize, fontSizeAlias),
		fontWeight: toTokenizedValue(segment.fontWeight, fontWeightAlias),
		fontStyle: toTokenizedValue(segment.fontStyle, fontStyleAlias),
		textCase: segment.textCase,
		textDecoration: segment.textDecoration,
		textDecorationStyle: segment.textDecorationStyle ?? null,
		textDecorationOffset: segment.textDecorationOffset ?? null,
		textDecorationThickness: segment.textDecorationThickness ?? null,
		textDecorationColor: toTokenizedValue(textDecorationColor, null),
		textDecorationSkipInk: segment.textDecorationSkipInk ?? null,
		lineHeight: toTokenizedValue(segment.lineHeight, lineHeightAlias),
		letterSpacing: toTokenizedValue(segment.letterSpacing, letterSpacingAlias),
		fills: normalizePaints(segment.fills),
		fillStyleId: typeof segment.fillStyleId === 'string' ? segment.fillStyleId : null,
		textStyleId: typeof segment.textStyleId === 'string' ? segment.textStyleId : null,
		listOptions: segment.listOptions ?? null,
		listSpacing: isNumber(segment.listSpacing) ? segment.listSpacing : null,
		indentation: isNumber(segment.indentation) ? segment.indentation : null,
		paragraphIndent: isNumber(segment.paragraphIndent)
			? toTokenizedValue(segment.paragraphIndent, paragraphIndentAlias)
			: null,
		paragraphSpacing: isNumber(segment.paragraphSpacing)
			? toTokenizedValue(segment.paragraphSpacing, paragraphSpacingAlias)
			: null,
		hyperlink: segment.hyperlink ?? null,
		openTypeFeatures: segment.openTypeFeatures ?? {},
	};
};

const buildRuns = (segments: TextSegment[]): NormalizedText['runs'] =>
	segments.map((segment) => ({
		start: segment.start,
		end: segment.end,
		characters: segment.characters,
		style: buildRunStyle(segment),
	}));

const buildMixedSegments = <T>(runs: NormalizedText['runs'], getValue: (run: NormalizedText['runs'][number]) => T) =>
	runs.map((run) => ({
		start: run.start,
		end: run.end,
		value: getValue(run),
	}));

const buildTextStyleId = (text: ExtractedTextProps, runs: NormalizedText['runs']): NormalizedText['textStyleId'] => {
	const textStyleId = text.textStyleId;
	if (typeof textStyleId === 'string') return textStyleId;

	const segments = buildMixedSegments<string>(runs, (run) =>
		typeof run.style.textStyleId === 'string' ? run.style.textStyleId : '',
	);

	return { type: 'mixed', segments };
};

const buildHyperlink = (text: ExtractedTextProps, runs: NormalizedText['runs']): NormalizedText['hyperlink'] => {
	const hyperlink = text.hyperlink;
	if (hyperlink !== figma.mixed) return hyperlink ?? null;

	const segments = buildMixedSegments<HyperlinkTarget | null>(runs, (run) => run.style.hyperlink);
	return { type: 'mixed', segments };
};

export const normalizeText = (
	text: ExtractedTextProps,
	nodeBoundVariables?: Record<string, unknown>,
): NormalizedText | null => {
	const segments = text.characters as TextSegment[] | undefined;
	if (!segments || segments.length === 0) return null;

	const runs = buildRuns(segments);
	const characters = runs.map((run) => run.characters).join('');
	const charactersAlias = getAlias(nodeBoundVariables, 'characters');

	return {
		characters: toTokenizedValue(characters, charactersAlias),
		runs,
		textAlignHorizontal: text.textAlignHorizontal ?? 'LEFT',
		textAlignVertical: text.textAlignVertical ?? 'TOP',
		textAutoResize: text.textAutoResize ?? 'NONE',
		textTruncation: text.textTruncation ?? 'DISABLED',
		maxLines: text.maxLines ?? null,
		paragraphIndent: isNumber(text.paragraphIndent) ? text.paragraphIndent : 0,
		paragraphSpacing: isNumber(text.paragraphSpacing) ? text.paragraphSpacing : 0,
		listSpacing: isNumber(text.listSpacing) ? text.listSpacing : 0,
		hangingPunctuation: text.hangingPunctuation ?? false,
		hangingList: text.hangingList ?? false,
		leadingTrim: text.leadingTrim === figma.mixed ? 'NONE' : (text.leadingTrim ?? 'NONE'),
		textStyleId: buildTextStyleId(text, runs),
		hyperlink: buildHyperlink(text, runs),
	};
};
