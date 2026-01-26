/**
 * Extracted Value Types
 *
 */

// ============================================================================
// Figma 타입 추출 유틸리티
// ============================================================================

/**
 * Figma 타입에서 실제 값 타입만 추출 (figma.mixed 제외)
 * figma.mixed는 symbol 타입이므로 Exclude<T, symbol>로 제거
 */
export type ExtractFigmaValue<T> = Exclude<T, symbol>;

/**
 * Figma Mixin에서 특정 필드의 값 타입 추출
 */
export type FigmaFieldType<M, K extends keyof M> = ExtractFigmaValue<M[K]>;

// ============================================================================
// 기본 래퍼 타입
// ============================================================================

/**
 * 단일 값 (mixed 아님)
 */
export type Uniform<T> = {
	type: 'uniform';
	value: T;
};

/**
 * 4방향 개별값 (strokeWeight 등)
 */
export type Side<T> = {
	type: 'side';
	top: T;
	right: T;
	bottom: T;
	left: T;
};

/**
 * 4코너 개별값 (cornerRadius 등)
 */
export type Corner<T> = {
	type: 'corner';
	topLeft: T;
	topRight: T;
	bottomRight: T;
	bottomLeft: T;
};

/**
 * 텍스트 범위 기반 값 (fontSize, fontName 등 TextNode 속성)
 */
export type Range<T> = {
	type: 'range';
	segments: Array<{
		start: number;
		end: number;
		value: T;
	}>;
};

/**
 * 벡터 정점 기반 값 (strokeCap, strokeJoin 등)
 */
export type Vertex<T> = {
	type: 'vertex';
	vertices: Array<{
		index: number;
		value: T;
	}>;
};

// ============================================================================
// Stroke 관련 타입
// ============================================================================

/**
 * strokeWeight - uniform 또는 4방향 개별값
 */
export type ExtractedStrokeWeight =
	| Uniform<FigmaFieldType<MinimalStrokesMixin, 'strokeWeight'>>
	| Side<FigmaFieldType<IndividualStrokesMixin, 'strokeTopWeight'>>;

/**
 * cornerRadius - uniform 또는 4코너 개별값
 */
export type ExtractedCornerRadius =
	| Uniform<FigmaFieldType<CornerMixin, 'cornerRadius'>>
	| Corner<FigmaFieldType<RectangleCornerMixin, 'topLeftRadius'>>;

/**
 * strokeCap - uniform 또는 정점별 값
 */
export type ExtractedStrokeCap = Uniform<FigmaFieldType<GeometryMixin, 'strokeCap'>> | Vertex<StrokeCap>;

/**
 * strokeJoin - uniform 또는 정점별 값
 */
export type ExtractedStrokeJoin = Uniform<FigmaFieldType<MinimalStrokesMixin, 'strokeJoin'>> | Vertex<StrokeJoin>;

// ============================================================================
// Fill 관련 타입
// ============================================================================

/**
 * fills - uniform 또는 텍스트 범위 기반 값
 */
export type ExtractedFills =
	| Uniform<FigmaFieldType<MinimalFillsMixin, 'fills'>>
	| Range<FigmaFieldType<MinimalFillsMixin, 'fills'>>;

// ============================================================================
// Text 관련 타입
// ============================================================================

/**
 * ExtractedTextSegment - characters 배열의 각 요소 타입
 * 모든 속성이 Uniform<T> 구조로 감싸짐
 */
export type ExtractedTextSegment = {
	start: number;
	end: number;
	characters: string;
	fontSize: Uniform<FigmaFieldType<StyledTextSegment, 'fontSize'>>;
	fontName: Uniform<FigmaFieldType<StyledTextSegment, 'fontName'>>;
	fontWeight: Uniform<FigmaFieldType<StyledTextSegment, 'fontWeight'>>;
	fontStyle: Uniform<FigmaFieldType<StyledTextSegment, 'fontStyle'>>;
	textDecoration: Uniform<FigmaFieldType<StyledTextSegment, 'textDecoration'>>;
	textDecorationStyle: Uniform<FigmaFieldType<StyledTextSegment, 'textDecorationStyle'>>;
	textDecorationOffset: Uniform<FigmaFieldType<StyledTextSegment, 'textDecorationOffset'>>;
	textDecorationThickness: Uniform<FigmaFieldType<StyledTextSegment, 'textDecorationThickness'>>;
	textDecorationColor: Uniform<FigmaFieldType<StyledTextSegment, 'textDecorationColor'>>;
	textDecorationSkipInk: Uniform<FigmaFieldType<StyledTextSegment, 'textDecorationSkipInk'>>;
	textCase: Uniform<FigmaFieldType<StyledTextSegment, 'textCase'>>;
	lineHeight: Uniform<FigmaFieldType<StyledTextSegment, 'lineHeight'>>;
	letterSpacing: Uniform<FigmaFieldType<StyledTextSegment, 'letterSpacing'>>;
	fills: Uniform<FigmaFieldType<StyledTextSegment, 'fills'>>;
	fillStyleId: Uniform<FigmaFieldType<StyledTextSegment, 'fillStyleId'>>;
	textStyleId: Uniform<FigmaFieldType<StyledTextSegment, 'textStyleId'>>;
	hyperlink: Uniform<FigmaFieldType<StyledTextSegment, 'hyperlink'>>;
	openTypeFeatures: Uniform<FigmaFieldType<StyledTextSegment, 'openTypeFeatures'>>;
	listOptions: Uniform<FigmaFieldType<StyledTextSegment, 'listOptions'>>;
	listSpacing: Uniform<FigmaFieldType<StyledTextSegment, 'listSpacing'>>;
	indentation: Uniform<FigmaFieldType<StyledTextSegment, 'indentation'>>;
	paragraphIndent: Uniform<FigmaFieldType<StyledTextSegment, 'paragraphIndent'>>;
	paragraphSpacing: Uniform<FigmaFieldType<StyledTextSegment, 'paragraphSpacing'>>;
	boundVariables: Uniform<FigmaFieldType<StyledTextSegment, 'boundVariables'>>;
};

/**
 * leadingTrim - uniform 또는 mixed (API에서 개별값 접근 불가)
 */
export type ExtractedLeadingTrim =
	| Uniform<FigmaFieldType<TextNode, 'leadingTrim'>>
	| { type: 'mixed'; value: LeadingTrim };
