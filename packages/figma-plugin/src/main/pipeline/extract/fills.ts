import type { Uniform, FigmaFieldType, ExtractedFills, Range } from './value-types';

export type ExtractedFillStyleId =
	| Uniform<FigmaFieldType<MinimalFillsMixin, 'fillStyleId'>>
	| Range<FigmaFieldType<MinimalFillsMixin, 'fillStyleId'>>;

export type ExtractedFillProps = {
	fills?: ExtractedFills;
	fillStyleId?: ExtractedFillStyleId;
	fillGeometry?: Uniform<FigmaFieldType<GeometryMixin, 'fillGeometry'>>;
};

export class FillExtractor {
	extract(node: SceneNode): ExtractedFillProps {
		const result: ExtractedFillProps = {};

		if (this.hasMinimalFillsMixin(node)) {
			if (this.isTextNode(node)) {
				// TextNode: fills와 fillStyleId 모두 mixed 가능 → Range로 처리
				result.fills = this.extractTextFills(node);
				result.fillStyleId = this.extractTextFillStyleId(node);
			} else {
				// 비-TextNode: fills와 fillStyleId는 mixed 불가 (Figma API 스펙)
				result.fills = { type: 'uniform', value: node.fills as readonly Paint[] };
				result.fillStyleId = { type: 'uniform', value: node.fillStyleId as string };
			}
		}

		if (this.hasGeometryFillMixin(node)) {
			result.fillGeometry = { type: 'uniform', value: node.fillGeometry };
		}

		return result;
	}

	private extractTextFills(node: TextNode): ExtractedFills {
		const fills = node.fills;
		if (fills === figma.mixed) {
			const segments = node.getStyledTextSegments(['fills']);
			return {
				type: 'range',
				segments: segments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fills,
				})),
			};
		}
		return { type: 'uniform', value: fills };
	}

	private extractTextFillStyleId(node: TextNode): ExtractedFillStyleId {
		const fillStyleId = node.fillStyleId;
		if (fillStyleId === figma.mixed) {
			const segments = node.getStyledTextSegments(['fillStyleId']);
			return {
				type: 'range',
				segments: segments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fillStyleId,
				})),
			};
		}
		return { type: 'uniform', value: fillStyleId };
	}

	private hasMinimalFillsMixin(node: SceneNode): node is SceneNode & MinimalFillsMixin {
		return 'fills' in node;
	}

	private hasGeometryFillMixin(node: SceneNode): node is SceneNode & GeometryMixin {
		return 'fillGeometry' in node;
	}

	private isTextNode(node: SceneNode): node is TextNode {
		return node.type === 'TEXT';
	}
}

export const fillExtractor = new FillExtractor();
