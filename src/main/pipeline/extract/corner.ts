import type { Uniform, FigmaFieldType, ExtractedCornerRadius } from './value-types';

export type ExtractedCornerProps = {
	cornerRadius?: ExtractedCornerRadius;
	cornerSmoothing?: Uniform<FigmaFieldType<CornerMixin, 'cornerSmoothing'>>;
};

export class CornerExtractor {
	extract(node: SceneNode): ExtractedCornerProps {
		const result: ExtractedCornerProps = {};

		if (!this.hasCornerMixin(node)) {
			return result;
		}

		result.cornerSmoothing = this.uniform(node.cornerSmoothing);
		result.cornerRadius = this.extractCornerRadius(node);

		return result;
	}

	private uniform<T>(value: T): Uniform<T> {
		return { type: 'uniform', value };
	}

	private extractCornerRadius(node: SceneNode & CornerMixin): ExtractedCornerRadius {
		const radius = node.cornerRadius;

		if (radius === figma.mixed) {
			if (this.hasRectangleCornerMixin(node)) {
				return {
					type: 'corner',
					topLeft: node.topLeftRadius,
					topRight: node.topRightRadius,
					bottomRight: node.bottomRightRadius,
					bottomLeft: node.bottomLeftRadius,
				};
			}
			console.error('Unexpected: cornerRadius is mixed but no RectangleCornerMixin');
			return { type: 'uniform', value: 0 };
		}

		return { type: 'uniform', value: radius };
	}

	private hasCornerMixin(node: SceneNode): node is SceneNode & CornerMixin {
		return 'cornerRadius' in node;
	}

	private hasRectangleCornerMixin(node: SceneNode): node is SceneNode & RectangleCornerMixin {
		return 'topLeftRadius' in node;
	}
}

export const cornerExtractor = new CornerExtractor();
