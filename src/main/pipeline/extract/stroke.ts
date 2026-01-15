import type {
	Uniform,
	FigmaFieldType,
	ExtractedCornerRadius,
	ExtractedStrokeWeight,
	ExtractedStrokeCap,
	ExtractedStrokeJoin,
} from './value-types';

export type ExtractedStrokeProps = {
	strokes?: Uniform<FigmaFieldType<MinimalStrokesMixin, 'strokes'>>;
	strokeStyleId?: Uniform<FigmaFieldType<MinimalStrokesMixin, 'strokeStyleId'>>;
	strokeAlign?: Uniform<FigmaFieldType<MinimalStrokesMixin, 'strokeAlign'>>;
	dashPattern?: Uniform<FigmaFieldType<MinimalStrokesMixin, 'dashPattern'>>;
	strokeGeometry?: Uniform<FigmaFieldType<MinimalStrokesMixin, 'strokeGeometry'>>;
	strokeMiterLimit?: Uniform<FigmaFieldType<GeometryMixin, 'strokeMiterLimit'>>;
	cornerSmoothing?: Uniform<FigmaFieldType<CornerMixin, 'cornerSmoothing'>>;
	vectorNetwork?: Uniform<FigmaFieldType<VectorNode, 'vectorNetwork'>>;
	strokeWeight?: ExtractedStrokeWeight;
	cornerRadius?: ExtractedCornerRadius;
	strokeCap?: ExtractedStrokeCap;
	strokeJoin?: ExtractedStrokeJoin;
};

export class StrokeExtractor {
	extract(node: SceneNode): ExtractedStrokeProps {
		const result: ExtractedStrokeProps = {};

		if (this.hasMinimalStrokesMixin(node)) {
			result.strokes = this.uniform(node.strokes);
			result.strokeStyleId = this.uniform(node.strokeStyleId);
			result.strokeAlign = this.uniform(node.strokeAlign);
			result.dashPattern = this.uniform(node.dashPattern);
			result.strokeGeometry = this.uniform(node.strokeGeometry);
		}

		if (this.hasGeometryStrokeMixin(node)) {
			result.strokeMiterLimit = this.uniform(node.strokeMiterLimit);
		}

		if (this.hasCornerMixin(node)) {
			result.cornerSmoothing = this.uniform(node.cornerSmoothing);
		}

		if (this.hasVectorNetwork(node)) {
			result.vectorNetwork = this.uniform(node.vectorNetwork);
		}

		result.strokeWeight = this.extractStrokeWeight(node);
		result.cornerRadius = this.extractCornerRadius(node);
		result.strokeCap = this.extractStrokeCap(node);
		result.strokeJoin = this.extractStrokeJoin(node);
		return result;
	}

	private uniform<T>(value: T): Uniform<T> {
		return { type: 'uniform', value };
	}

	private extractCornerRadius(node: SceneNode): ExtractedCornerRadius | undefined {
		if (!this.hasCornerMixin(node)) return undefined;

		const radius = node.cornerRadius;
		if (radius === figma.mixed) {
			if (this.hasRectangleCornerMixin(node)) {
				console.log({
					topLeft: node.topLeftRadius,
					topRight: node.topRightRadius,
					bottomRight: node.bottomRightRadius,
					bottomLeft: node.bottomLeftRadius,
				});
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

	private extractStrokeWeight(node: SceneNode): ExtractedStrokeWeight | undefined {
		if (!this.hasMinimalStrokesMixin(node)) return undefined;

		const weight = node.strokeWeight;
		if (weight === figma.mixed) {
			if (this.hasIndividualStrokesMixin(node)) {
				return {
					type: 'side',
					top: node.strokeTopWeight,
					right: node.strokeRightWeight,
					bottom: node.strokeBottomWeight,
					left: node.strokeLeftWeight,
				};
			}
			console.error('Unexpected: strokeWeight is mixed but no IndividualStrokesMixin');
			return { type: 'uniform', value: 0 };
		}

		return { type: 'uniform', value: weight };
	}

	private extractStrokeCap(node: SceneNode): ExtractedStrokeCap | undefined {
		if (!this.hasGeometryStrokeMixin(node)) return undefined;

		const cap = node.strokeCap;
		if (cap === figma.mixed) {
			if (this.hasVectorNetwork(node) && node.vectorNetwork) {
				const vertices = node.vectorNetwork.vertices.map((v, index) => ({
					index,
					value: v.strokeCap ?? 'NONE',
				}));
				return { type: 'vertex', vertices };
			}
			console.error('Unexpected: strokeCap is mixed but no vectorNetwork');
			return { type: 'uniform', value: 'NONE' };
		}

		return { type: 'uniform', value: cap };
	}

	private extractStrokeJoin(node: SceneNode): ExtractedStrokeJoin | undefined {
		if (!this.hasMinimalStrokesMixin(node)) return undefined;

		const join = node.strokeJoin;
		if (join === figma.mixed) {
			if (this.hasVectorNetwork(node) && node.vectorNetwork) {
				const vertices = node.vectorNetwork.vertices.map((v, index) => ({
					index,
					value: v.strokeJoin ?? 'MITER',
				}));
				return { type: 'vertex', vertices };
			}
			console.error('Unexpected: strokeJoin is mixed but no vectorNetwork');
			return { type: 'uniform', value: 'MITER' };
		}

		return { type: 'uniform', value: join };
	}

	private hasMinimalStrokesMixin(node: SceneNode): node is SceneNode & MinimalStrokesMixin {
		return 'strokes' in node;
	}

	private hasIndividualStrokesMixin(node: SceneNode): node is SceneNode & IndividualStrokesMixin {
		return 'strokeTopWeight' in node;
	}

	private hasGeometryStrokeMixin(node: SceneNode): node is SceneNode & GeometryMixin {
		return 'strokeCap' in node;
	}

	private hasCornerMixin(node: SceneNode): node is SceneNode & CornerMixin {
		return 'cornerRadius' in node;
	}

	private hasRectangleCornerMixin(node: SceneNode): node is SceneNode & RectangleCornerMixin {
		return 'topLeftRadius' in node;
	}

	private hasVectorNetwork(node: SceneNode): node is SceneNode & VectorNode {
		return 'vectorNetwork' in node;
	}
}

export const strokeExtractor = new StrokeExtractor();
