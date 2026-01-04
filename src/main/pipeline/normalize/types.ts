export type TokenRef = {
	id: string;
	name?: string;
	collectionId?: string;
	collectionName?: string;
	modeId?: string;
	modeName?: string;
};

export type TokenizedValue<T> = T | { tokenRef: TokenRef; fallback: T };

export type NormalizedMixedValue<T> =
	| { type: 'uniform'; value: T }
	| { type: 'mixed'; values: T[] }
	| { type: 'range-based'; segments: Array<{ start: number; end: number; value: T }> };

export type NormalizedColor = {
	hex: string;
	rgb: string;
	rgba: string;
	opacity: number;
};

export type NormalizedSolidFill = {
	type: 'solid';
	color: TokenizedValue<NormalizedColor>;
	blendMode?: BlendMode;
	visible?: boolean;
};

export type NormalizedGradientStop = {
	position: number;
	color: TokenizedValue<NormalizedColor>;
};

export type NormalizedGradientFill = {
	type: 'gradient';
	gradientType: 'linear' | 'radial' | 'angular' | 'diamond';
	stops: NormalizedGradientStop[];
	angle: number;
	transform: Transform;
	blendMode?: BlendMode;
	visible?: boolean;
};

export type NormalizedImageFill = {
	type: 'image';
	imageHash: string | null;
	scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
	imageTransform: Transform | null;
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
	blendMode?: BlendMode;
	visible?: boolean;
};

export type NormalizedFill = NormalizedSolidFill | NormalizedGradientFill | NormalizedImageFill;
export type NormalizedFills = NormalizedFill[];

export type NormalizedShadowEffect = {
	type: 'shadow';
	shadowType: 'drop' | 'inner';
	color: TokenizedValue<NormalizedColor>;
	offset: { x: TokenizedValue<number>; y: TokenizedValue<number> };
	radius: TokenizedValue<number>;
	spread: TokenizedValue<number> | null;
	blendMode: BlendMode;
	visible: boolean;
	showShadowBehindNode?: boolean;
};

export type NormalizedBlurEffect = {
	type: 'blur';
	blurType: 'layer' | 'background';
	radius: TokenizedValue<number>;
	visible: boolean;
	progressive?: {
		startRadius: number;
		startOffset: Vector;
		endOffset: Vector;
	} | null;
};

export type NormalizedNoiseEffect = {
	type: 'noise';
	noiseType: 'monotone' | 'duotone' | 'multitone';
	color: NormalizedColor;
	secondaryColor?: NormalizedColor;
	opacity?: number;
	noiseSize: number;
	density: number;
	blendMode: BlendMode;
	visible: boolean;
};

export type NormalizedTextureEffect = {
	type: 'texture';
	noiseSize: number;
	radius: number;
	clipToShape: boolean;
	visible: boolean;
};

export type NormalizedGlassEffect = {
	type: 'glass';
	lightIntensity: number;
	lightAngle: number;
	refraction: number;
	depth: number;
	dispersion: number;
	radius: number;
	visible: boolean;
};

export type NormalizedEffect =
	| NormalizedShadowEffect
	| NormalizedBlurEffect
	| NormalizedNoiseEffect
	| NormalizedTextureEffect
	| NormalizedGlassEffect;

export type NormalizedEffects = NormalizedEffect[];

export type NormalizedCorner = {
	radius: NormalizedMixedValue<TokenizedValue<number>>;
	smoothing: TokenizedValue<number>;
};

export type NormalizedStrokeWeight =
	| { type: 'uniform'; value: TokenizedValue<number> }
	| {
			type: 'individual';
			top: TokenizedValue<number>;
			right: TokenizedValue<number>;
			bottom: TokenizedValue<number>;
			left: TokenizedValue<number>;
	  };

export type NormalizedStroke = {
	paints: NormalizedFill[];
	weight: NormalizedStrokeWeight;
	align: 'CENTER' | 'INSIDE' | 'OUTSIDE';
	cap: StrokeCap | { type: 'mixed'; values: StrokeCap[] };
	join: StrokeJoin | { type: 'mixed'; values: StrokeJoin[] };
	dashPattern: readonly number[];
	miterLimit: number;
	corner?: NormalizedCorner | null;
	vectorNetwork?: VectorNetwork;
};

export type NormalizedLayoutMode = 'AUTO' | 'GRID' | 'ABSOLUTE';

export type NormalizedLayoutPosition = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type NormalizedLayoutPadding = {
	top: number;
	right: number;
	bottom: number;
	left: number;
};

export type NormalizedLayoutGap = {
	row?: number | null;
	column?: number | null;
};

export type NormalizedLayoutContainer = {
	direction?: 'HORIZONTAL' | 'VERTICAL';
	padding?: NormalizedLayoutPadding;
	gap?: NormalizedLayoutGap;
	primaryAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
	counterAxisAlignItems?: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
	counterAxisAlignContent?: 'AUTO' | 'SPACE_BETWEEN';
	primaryAxisSizingMode?: 'FIXED' | 'AUTO';
	counterAxisSizingMode?: 'FIXED' | 'AUTO';
	layoutWrap?: 'NO_WRAP' | 'WRAP';
	strokesIncludedInLayout?: boolean;
	itemReverseZIndex?: boolean;
	grid?: {
		rowCount: number;
		columnCount: number;
		rowGap: number;
		columnGap: number;
		rowSizes: Array<GridTrackSize>;
		columnSizes: Array<GridTrackSize>;
	};
};

export type NormalizedLayoutChild = {
	layoutAlign?: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT';
	layoutGrow?: number;
	layoutPositioning?: 'AUTO' | 'ABSOLUTE';
	layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
	layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
	grid?: {
		row: number;
		column: number;
		rowSpan: number;
		columnSpan: number;
		horizontalAlign: 'MIN' | 'CENTER' | 'MAX' | 'AUTO';
		verticalAlign: 'MIN' | 'CENTER' | 'MAX' | 'AUTO';
	};
};

export type NormalizedLayout = {
	mode: NormalizedLayoutMode;
	position: NormalizedLayoutPosition;
	constraints?: Constraints;
	container?: NormalizedLayoutContainer;
	child?: NormalizedLayoutChild;
};

export type NormalizedTextSegment<T> = {
	start: number;
	end: number;
	value: T;
};

export type NormalizedTextRunStyle = {
	fontName: TokenizedValue<FontName>;
	fontSize: TokenizedValue<number>;
	fontWeight: TokenizedValue<number>;
	fontStyle: TokenizedValue<FontStyle>;
	textCase: TokenizedValue<TextCase>;
	textDecoration: TokenizedValue<TextDecoration>;
	textDecorationStyle: TextDecorationStyle | null;
	textDecorationOffset: TextDecorationOffset | null;
	textDecorationThickness: TextDecorationThickness | null;
	textDecorationColor: TokenizedValue<TextDecorationColor>;
	textDecorationSkipInk: boolean | null;
	lineHeight: TokenizedValue<LineHeight>;
	letterSpacing: TokenizedValue<LetterSpacing>;
	fills: TokenizedValue<NormalizedFill[]>;
	fillStyleId: TokenizedValue<string> | null;
	textStyleId: TokenizedValue<string> | null;
	listOptions: TextListOptions | null;
	listSpacing: TokenizedValue<number> | null;
	indentation: TokenizedValue<number> | null;
	paragraphIndent: TokenizedValue<number> | null;
	paragraphSpacing: TokenizedValue<number> | null;
	hyperlink: HyperlinkTarget | null;
	openTypeFeatures: Record<OpenTypeFeature, boolean>;
};

export type NormalizedTextRun = {
	start: number;
	end: number;
	characters: string;
	style: NormalizedTextRunStyle;
};

export type NormalizedText = {
	characters: string;
	runs: NormalizedTextRun[];
	textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
	textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
	textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
	textTruncation: 'DISABLED' | 'ENDING';
	maxLines: number | null;
	paragraphIndent: number;
	paragraphSpacing: number;
	listSpacing: number;
	hangingPunctuation: boolean;
	hangingList: boolean;
	leadingTrim: LeadingTrim;
	textStyleId: TokenizedValue<string> | { type: 'mixed'; segments: NormalizedTextSegment<string>[] };
	hyperlink: HyperlinkTarget | null | { type: 'mixed'; segments: NormalizedTextSegment<HyperlinkTarget | null>[] };
};

export type NormalizedStyle = {
	fills: NormalizedFills;
	effects: NormalizedEffects;
	layout: NormalizedLayout;
	text: NormalizedText | null;
	stroke: NormalizedStroke | null;
};
