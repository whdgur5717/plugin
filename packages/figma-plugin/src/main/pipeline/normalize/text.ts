import { isNumber } from 'es-toolkit/compat';
import { paintNormalizer } from './fills';
import { toTokenizedValue } from './utils';
import type { ExtractedTextProps } from '../extract/text';
import type { ExtractedLeadingTrim, ExtractedTextSegment } from '../extract/value-types';
import type { NormalizedText, NormalizedValue } from './types';

export class TextNormalizer {
	normalizeText(text: ExtractedTextProps, nodeBoundVariables?: SceneNode['boundVariables']): NormalizedText | null {
		const segments = text.characters;
		if (!segments || segments.length === 0) return null;

		const runs = this.buildRuns(segments);
		const characters = runs.map((run) => run.characters).join('');
		const charactersAlias = nodeBoundVariables?.characters;

		return {
			characters: toTokenizedValue(characters, charactersAlias),
			runs,
			textAlignHorizontal: text.textAlignHorizontal?.value ?? 'LEFT',
			textAlignVertical: text.textAlignVertical?.value ?? 'TOP',
			textAutoResize: text.textAutoResize?.value ?? 'NONE',
			textTruncation: text.textTruncation?.value ?? 'DISABLED',
			maxLines: text.maxLines?.value ?? null,
			paragraphIndent: isNumber(text.paragraphIndent?.value) ? text.paragraphIndent.value : 0,
			paragraphSpacing: isNumber(text.paragraphSpacing?.value) ? text.paragraphSpacing.value : 0,
			listSpacing: isNumber(text.listSpacing?.value) ? text.listSpacing.value : 0,
			hangingPunctuation: text.hangingPunctuation?.value ?? false,
			hangingList: text.hangingList?.value ?? false,
			leadingTrim: this.normalizeLeadingTrim(text.leadingTrim),
			textStyleId: this.buildTextStyleId(text, runs),
			hyperlink: this.buildHyperlink(text, runs),
		};
	}

	private buildRuns(segments: ExtractedTextSegment[]): NormalizedText['runs'] {
		return segments.map((segment) => ({
			start: segment.start,
			end: segment.end,
			characters: segment.characters,
			style: this.buildRunStyle(segment),
		}));
	}

	private buildRunStyle(segment: ExtractedTextSegment): NormalizedText['runs'][number]['style'] {
		const boundVariables = segment.boundVariables.value;
		const fontFamilyAlias = boundVariables?.fontFamily;
		const fontStyleAlias = boundVariables?.fontStyle;
		const fontWeightAlias = boundVariables?.fontWeight;
		const fontSizeAlias = boundVariables?.fontSize;
		const letterSpacingAlias = boundVariables?.letterSpacing;
		const lineHeightAlias = boundVariables?.lineHeight;
		const paragraphSpacingAlias = boundVariables?.paragraphSpacing;
		const paragraphIndentAlias = boundVariables?.paragraphIndent;

		const textDecorationColor = segment.textDecorationColor.value ?? { value: 'AUTO' };

		return {
			fontName: toTokenizedValue(segment.fontName.value, fontFamilyAlias),
			fontSize: toTokenizedValue(segment.fontSize.value, fontSizeAlias),
			fontWeight: toTokenizedValue(segment.fontWeight.value, fontWeightAlias),
			fontStyle: toTokenizedValue(segment.fontStyle.value, fontStyleAlias),
			textCase: segment.textCase.value,
			textDecoration: segment.textDecoration.value,
			textDecorationStyle: segment.textDecorationStyle.value ?? null,
			textDecorationOffset: segment.textDecorationOffset.value ?? null,
			textDecorationThickness: segment.textDecorationThickness.value ?? null,
			textDecorationColor: toTokenizedValue(textDecorationColor, null),
			textDecorationSkipInk: segment.textDecorationSkipInk.value ?? null,
			lineHeight: toTokenizedValue(segment.lineHeight.value, lineHeightAlias),
			letterSpacing: toTokenizedValue(segment.letterSpacing.value, letterSpacingAlias),
			fills: paintNormalizer.normalizePaints(segment.fills.value),
			fillStyleId: typeof segment.fillStyleId.value === 'string' ? segment.fillStyleId.value : null,
			textStyleId: typeof segment.textStyleId.value === 'string' ? segment.textStyleId.value : null,
			listOptions: segment.listOptions.value ?? null,
			listSpacing: isNumber(segment.listSpacing.value) ? segment.listSpacing.value : null,
			indentation: isNumber(segment.indentation.value) ? segment.indentation.value : null,
			paragraphIndent: isNumber(segment.paragraphIndent.value)
				? toTokenizedValue(segment.paragraphIndent.value, paragraphIndentAlias)
				: null,
			paragraphSpacing: isNumber(segment.paragraphSpacing.value)
				? toTokenizedValue(segment.paragraphSpacing.value, paragraphSpacingAlias)
				: null,
			hyperlink: segment.hyperlink.value ?? null,
			openTypeFeatures: segment.openTypeFeatures.value ?? {},
		};
	}

	private buildMixedSegments<T>(
		runs: NormalizedText['runs'],
		getValue: (run: NormalizedText['runs'][number]) => T,
	): Array<{ start: number; end: number; value: T }> {
		return runs.map((run) => ({
			start: run.start,
			end: run.end,
			value: getValue(run),
		}));
	}

	private buildTextStyleId(text: ExtractedTextProps, runs: NormalizedText['runs']): NormalizedText['textStyleId'] {
		const textStyleId = text.textStyleId?.value;
		if (typeof textStyleId === 'string') return textStyleId;

		const segments = this.buildMixedSegments<string>(runs, (run) =>
			typeof run.style.textStyleId === 'string' ? run.style.textStyleId : '',
		);

		return { type: 'mixed', segments };
	}

	private buildHyperlink(text: ExtractedTextProps, runs: NormalizedText['runs']): NormalizedText['hyperlink'] {
		const hyperlink = text.hyperlink?.value;

		if (hyperlink && typeof hyperlink === 'object' && 'type' in hyperlink && 'value' in hyperlink) {
			return hyperlink as HyperlinkTarget;
		}

		const segments = this.buildMixedSegments<HyperlinkTarget | null>(runs, (run) => run.style.hyperlink);
		const uniqueHyperlinks = new Set(segments.map((s) => JSON.stringify(s.value)));
		if (uniqueHyperlinks.size === 1) {
			return segments[0]?.value ?? null;
		}

		return { type: 'mixed', segments };
	}

	private normalizeLeadingTrim(extracted: ExtractedLeadingTrim | undefined): NormalizedValue<LeadingTrim> {
		if (!extracted) {
			return { type: 'uniform', value: 'NONE' };
		}
		if (extracted.type === 'mixed') {
			return { type: 'mixed', values: [extracted.value] };
		}
		return { type: 'uniform', value: extracted.value };
	}
}

export const textNormalizer = new TextNormalizer();
