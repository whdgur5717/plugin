// ============================================
// NORMALIZED OUTPUT TYPES
// ============================================

//해당 코드는 extract 후 normalize과정에 진행될 코드 예시입니다

type NormalizedMixedValue<T> =
	| { type: 'uniform'; value: T }
	| { type: 'mixed'; values: T[] }
	| { type: 'range-based'; segments: Array<{ start: number; end: number; value: T }> };

type NormalizedSolidColor = {
	type: 'solid';
	hex: string;
	rgb: string;
	rgba: string;
	opacity: number;
};

type NormalizedGradient = {
	type: 'gradient';
	gradientType: 'linear' | 'radial' | 'angular' | 'diamond';
	stops: Array<{
		position: number;
		color: string;
		opacity: number;
	}>;
	angle: number;
	transform: readonly [readonly [number, number, number], readonly [number, number, number]];
};

type NormalizedImageFill = {
	type: 'image';
	imageHash: string | null;
	scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
	imageTransform: readonly [readonly [number, number, number], readonly [number, number, number]] | null;
	scalingFactor: number | null;
	rotation: number | null;
	filters: {
		exposure: number | null;
		contrast: number | null;
		saturation: number | null;
		temperature: number | null;
		tint: number | null;
		highlights: number | null;
		shadows: number | null;
	};
};

type NormalizedFill = NormalizedSolidColor | NormalizedGradient | NormalizedImageFill;

type NormalizedCorner = {
	radius: NormalizedMixedValue<number>;
	smoothing: number;
};

type NormalizedStrokeWeight =
	| { type: 'uniform'; value: number }
	| { type: 'individual'; top: number; right: number; bottom: number; left: number };

type NormalizedStroke = {
	paints: NormalizedFill[];
	weight: NormalizedStrokeWeight;
	align: 'CENTER' | 'INSIDE' | 'OUTSIDE';
	cap: StrokeCap | { type: 'mixed'; values: StrokeCap[] };
	join: StrokeJoin | { type: 'mixed'; values: StrokeJoin[] };
	dashPattern: readonly number[];
	miterLimit: number;
};

type NormalizedTextSegment<T> = {
	start: number;
	end: number;
	value: T;
};

type NormalizedTextStyle = {
	fontSize: NormalizedMixedValue<number>;
	fontName: NormalizedMixedValue<FontName>;
	fontWeight: NormalizedMixedValue<number>;
	letterSpacing: NormalizedMixedValue<LetterSpacing>;
	lineHeight: NormalizedMixedValue<LineHeight>;
	textCase: NormalizedMixedValue<TextCase>;
	textDecoration: NormalizedMixedValue<TextDecoration>;
	fills: NormalizedMixedValue<NormalizedFill[]>;
	segments: {
		fontSize: NormalizedTextSegment<number>[];
		fontName: NormalizedTextSegment<FontName>[];
		fontWeight: NormalizedTextSegment<number>[];
	} | null;
};

type NormalizedTextData = {
	characters: string;
	style: NormalizedTextStyle;
	textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
	textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
	textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
	paragraphIndent: number;
	paragraphSpacing: number;
	textStyleId: string | { type: 'mixed'; segments: NormalizedTextSegment<string>[] };
	hyperlink: HyperlinkTarget | null | { type: 'mixed'; segments: NormalizedTextSegment<HyperlinkTarget | null>[] };
};

// ============================================
// NORMALIZERS
// ============================================

class PaintNormalizer {
	normalize(paints: readonly Paint[] | PluginAPI['mixed']): NormalizedFill[] {
		if (paints === figma.mixed) {
			return [];
		}

		return paints.filter((paint) => paint.visible !== false).map((paint) => this.normalizeSingle(paint));
	}

	private normalizeSingle(paint: Paint): NormalizedFill {
		if (paint.type === 'SOLID') {
			const opacity = paint.opacity !== undefined ? paint.opacity : 1;
			return {
				type: 'solid',
				hex: this.rgbToHex(paint.color.r, paint.color.g, paint.color.b),
				rgb: `rgb(${Math.round(paint.color.r * 255)}, ${Math.round(paint.color.g * 255)}, ${Math.round(paint.color.b * 255)})`,
				rgba: `rgba(${Math.round(paint.color.r * 255)}, ${Math.round(paint.color.g * 255)}, ${Math.round(paint.color.b * 255)}, ${opacity})`,
				opacity,
			};
		}

		if (paint.type === 'GRADIENT_LINEAR') {
			return this.normalizeGradient(paint, 'linear');
		}

		if (paint.type === 'GRADIENT_RADIAL') {
			return this.normalizeGradient(paint, 'radial');
		}

		if (paint.type === 'GRADIENT_ANGULAR') {
			return this.normalizeGradient(paint, 'angular');
		}

		if (paint.type === 'GRADIENT_DIAMOND') {
			return this.normalizeGradient(paint, 'diamond');
		}

		if (paint.type === 'IMAGE') {
			return {
				type: 'image',
				imageHash: paint.imageHash !== undefined ? paint.imageHash : null,
				scaleMode: paint.scaleMode,
				imageTransform: paint.imageTransform !== undefined ? paint.imageTransform : null,
				scalingFactor: paint.scalingFactor !== undefined ? paint.scalingFactor : null,
				rotation: paint.rotation !== undefined ? paint.rotation : null,
				filters: {
					exposure: paint.filters?.exposure !== undefined ? paint.filters.exposure : null,
					contrast: paint.filters?.contrast !== undefined ? paint.filters.contrast : null,
					saturation: paint.filters?.saturation !== undefined ? paint.filters.saturation : null,
					temperature: paint.filters?.temperature !== undefined ? paint.filters.temperature : null,
					tint: paint.filters?.tint !== undefined ? paint.filters.tint : null,
					highlights: paint.filters?.highlights !== undefined ? paint.filters.highlights : null,
					shadows: paint.filters?.shadows !== undefined ? paint.filters.shadows : null,
				},
			};
		}

		// paint.type === 'VIDEO'
		if (paint.type === 'VIDEO') {
			return {
				type: 'image',
				imageHash: paint.videoHash !== undefined ? paint.videoHash : null,
				scaleMode: paint.scaleMode,
				imageTransform: null,
				scalingFactor: null,
				rotation: null,
				filters: {
					exposure: null,
					contrast: null,
					saturation: null,
					temperature: null,
					tint: null,
					highlights: null,
					shadows: null,
				},
			};
		}

		// Fallback for unknown paint types
		throw new Error(`Unknown paint type`);
	}

	private normalizeGradient(
		paint: GradientPaint,
		gradientType: 'linear' | 'radial' | 'angular' | 'diamond',
	): NormalizedGradient {
		return {
			type: 'gradient',
			gradientType,
			stops: paint.gradientStops.map((stop) => ({
				position: stop.position,
				color: this.rgbToHex(stop.color.r, stop.color.g, stop.color.b),
				opacity: stop.color.a,
			})),
			angle: this.calculateGradientAngle(paint.gradientTransform),
			transform: paint.gradientTransform,
		};
	}

	private rgbToHex(r: number, g: number, b: number): string {
		const toHex = (n: number) =>
			Math.round(n * 255)
				.toString(16)
				.padStart(2, '0');
		return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
	}

	private calculateGradientAngle(transform: Transform): number {
		const [[a, ,], [c, ,]] = transform;
		return Math.atan2(c, a) * (180 / Math.PI);
	}
}

class CornerNormalizer {
	normalize(node: CornerMixin & RectangleCornerMixin): NormalizedCorner {
		if (node.cornerRadius === figma.mixed) {
			return {
				radius: {
					type: 'mixed',
					values: [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius],
				},
				smoothing: node.cornerSmoothing,
			};
		}

		return {
			radius: {
				type: 'uniform',
				value: node.cornerRadius,
			},
			smoothing: node.cornerSmoothing,
		};
	}
}

class StrokeNormalizer {
	private paintNormalizer = new PaintNormalizer();

	normalize(node: MinimalStrokesMixin & GeometryMixin): NormalizedStroke | null {
		if (node.strokes.length === 0) {
			return null;
		}

		return {
			paints: this.paintNormalizer.normalize(node.strokes),
			weight: this.normalizeStrokeWeight(node),
			align: node.strokeAlign,
			cap: this.normalizeStrokeCap(node.strokeCap),
			join: this.normalizeStrokeJoin(node.strokeJoin),
			dashPattern: node.dashPattern,
			miterLimit: node.strokeMiterLimit,
		};
	}

	private normalizeStrokeWeight(node: MinimalStrokesMixin): NormalizedStrokeWeight {
		if (node.strokeWeight === figma.mixed && 'strokeTopWeight' in node) {
			const individualNode = node as MinimalStrokesMixin & IndividualStrokesMixin;
			return {
				type: 'individual',
				top: individualNode.strokeTopWeight,
				right: individualNode.strokeRightWeight,
				bottom: individualNode.strokeBottomWeight,
				left: individualNode.strokeLeftWeight,
			};
		}

		if (node.strokeWeight === figma.mixed) {
			return {
				type: 'uniform',
				value: 0,
			};
		}

		return {
			type: 'uniform',
			value: node.strokeWeight,
		};
	}

	private normalizeStrokeCap(
		cap: StrokeCap | PluginAPI['mixed'],
	): StrokeCap | { type: 'mixed'; values: StrokeCap[] } {
		if (cap === figma.mixed) {
			return { type: 'mixed', values: ['NONE', 'ROUND', 'SQUARE', 'ARROW_LINES', 'ARROW_EQUILATERAL'] };
		}
		return cap;
	}

	private normalizeStrokeJoin(
		join: StrokeJoin | PluginAPI['mixed'],
	): StrokeJoin | { type: 'mixed'; values: StrokeJoin[] } {
		if (join === figma.mixed) {
			return { type: 'mixed', values: ['MITER', 'BEVEL', 'ROUND'] };
		}
		return join;
	}
}

class TextNormalizer {
	private paintNormalizer = new PaintNormalizer();

	normalize(node: TextNode): NormalizedTextData {
		return {
			characters: node.characters,
			style: this.normalizeTextStyle(node),
			textAlignHorizontal: node.textAlignHorizontal,
			textAlignVertical: node.textAlignVertical,
			textAutoResize: node.textAutoResize,
			paragraphIndent: node.paragraphIndent,
			paragraphSpacing: node.paragraphSpacing,
			textStyleId: this.normalizeTextStyleId(node),
			hyperlink: this.normalizeHyperlink(node),
		};
	}

	private normalizeTextStyle(node: TextNode): NormalizedTextStyle {
		if (
			node.fontSize === figma.mixed ||
			node.fontName === figma.mixed ||
			node.fontWeight === figma.mixed ||
			node.letterSpacing === figma.mixed ||
			node.lineHeight === figma.mixed
		) {
			return this.extractStyledSegments(node);
		}

		const textCase = node.textCase === figma.mixed ? 'ORIGINAL' : node.textCase;
		const textDecoration = node.textDecoration === figma.mixed ? 'NONE' : node.textDecoration;

		return {
			fontSize: { type: 'uniform', value: node.fontSize },
			fontName: { type: 'uniform', value: node.fontName },
			fontWeight: { type: 'uniform', value: node.fontWeight },
			letterSpacing: { type: 'uniform', value: node.letterSpacing },
			lineHeight: { type: 'uniform', value: node.lineHeight },
			textCase: { type: 'uniform', value: textCase },
			textDecoration: { type: 'uniform', value: textDecoration },
			fills: { type: 'uniform', value: this.paintNormalizer.normalize(node.fills) },
			segments: null,
		};
	}

	private extractStyledSegments(node: TextNode): NormalizedTextStyle {
		const fontSizeSegments = node.getStyledTextSegments(['fontSize']);
		const fontNameSegments = node.getStyledTextSegments(['fontName']);
		const fontWeightSegments = node.getStyledTextSegments(['fontWeight']);
		const letterSpacingSegments = node.getStyledTextSegments(['letterSpacing']);
		const lineHeightSegments = node.getStyledTextSegments(['lineHeight']);

		return {
			fontSize: {
				type: 'range-based',
				segments: fontSizeSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fontSize,
				})),
			},
			fontName: {
				type: 'range-based',
				segments: fontNameSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fontName,
				})),
			},
			fontWeight: {
				type: 'range-based',
				segments: fontWeightSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fontWeight,
				})),
			},
			letterSpacing: {
				type: 'range-based',
				segments: letterSpacingSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.letterSpacing,
				})),
			},
			lineHeight: {
				type: 'range-based',
				segments: lineHeightSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.lineHeight,
				})),
			},
			textCase: { type: 'uniform', value: 'ORIGINAL' },
			textDecoration: { type: 'uniform', value: 'NONE' },
			fills: { type: 'uniform', value: this.paintNormalizer.normalize(node.fills) },
			segments: {
				fontSize: fontSizeSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fontSize,
				})),
				fontName: fontNameSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fontName,
				})),
				fontWeight: fontWeightSegments.map((seg) => ({
					start: seg.start,
					end: seg.end,
					value: seg.fontWeight,
				})),
			},
		};
	}

	private normalizeTextStyleId(
		node: TextNode,
	): string | { type: 'mixed'; segments: NormalizedTextSegment<string>[] } {
		if (node.textStyleId !== figma.mixed) {
			return node.textStyleId;
		}

		const segments: NormalizedTextSegment<string>[] = [];
		let currentStart = 0;

		while (currentStart < node.characters.length) {
			const styleId = node.getRangeTextStyleId(currentStart, currentStart + 1);
			let currentEnd = currentStart + 1;

			while (currentEnd < node.characters.length) {
				const nextStyleId = node.getRangeTextStyleId(currentEnd, currentEnd + 1);
				if (nextStyleId === styleId) {
					currentEnd++;
				} else {
					break;
				}
			}

			segments.push({
				start: currentStart,
				end: currentEnd,
				value: typeof styleId === 'string' ? styleId : '',
			});

			currentStart = currentEnd;
		}

		return { type: 'mixed', segments };
	}

	private normalizeHyperlink(
		node: TextNode,
	): HyperlinkTarget | null | { type: 'mixed'; segments: NormalizedTextSegment<HyperlinkTarget | null>[] } {
		if (node.hyperlink !== figma.mixed) {
			return node.hyperlink;
		}

		const segments: NormalizedTextSegment<HyperlinkTarget | null>[] = [];
		let currentStart = 0;

		while (currentStart < node.characters.length) {
			const hyperlink = node.getRangeHyperlink(currentStart, currentStart + 1);
			let currentEnd = currentStart + 1;

			if (hyperlink !== figma.mixed) {
				while (currentEnd < node.characters.length) {
					const nextHyperlink = node.getRangeHyperlink(currentEnd, currentEnd + 1);
					if (nextHyperlink !== figma.mixed && this.areHyperlinksEqual(hyperlink, nextHyperlink)) {
						currentEnd++;
					} else {
						break;
					}
				}

				segments.push({
					start: currentStart,
					end: currentEnd,
					value: hyperlink,
				});
			} else {
				segments.push({
					start: currentStart,
					end: currentStart + 1,
					value: null,
				});
			}

			currentStart = currentEnd;
		}

		return { type: 'mixed', segments };
	}

	private areHyperlinksEqual(a: HyperlinkTarget | null, b: HyperlinkTarget | null): boolean {
		if (a === null && b === null) return true;
		if (a === null || b === null) return false;
		if (a.type !== b.type) return false;

		if (a.type === 'URL' && b.type === 'URL') {
			return a.value === b.value;
		}

		if (a.type === 'NODE' && b.type === 'NODE') {
			return a.value === b.value;
		}

		return false;
	}
}

// ============================================
// MAIN NORMALIZER
// ============================================
