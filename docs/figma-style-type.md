# Figma 스타일 타입 해석 규칙 (Plugin API 기준)

## 목적

Figma Plugin API의 **스타일 관련 타입**을 정확하게 해석하기 위한 규칙을 정리한다.
아래 내용은 `/Users/jh/plugin/node_modules/@figma/plugin-typings/plugin-api.d.ts`에 명시된 타입/주석을 근거로 한다.

## 범위

- Paint/Effect/Stroke/Text/Layout 관련 타입과 해석 규칙

## 공통 해석 원칙

- **Discriminated union**: `type` 필드로 분기해서 해석한다.
- **mixed 처리**: `figma.mixed`는 “동일 속성이 여러 값으로 섞여 있음”을 의미한다.
- **styleId**: `fillStyleId` / `strokeStyleId` / `effectStyleId` / `textStyleId` / `gridStyleId`는 스타일 링크 정보이며, 실제 값과 별도로 보존한다.
- **boundVariables**: 변수 바인딩이 존재하면 필드별로 보존한다. (Paint/Effect/LayoutGrid/TextSegment/Style 등)

````ts
/**
 * This a constant value that some node properties return when they are a mix of multiple values. An example might be font size: a single text node can use multiple different font sizes for different character ranges. For those properties, you should always compare against `figma.mixed`.
 *
 * @remarks
 *
 * Example:
 *
 * ```ts title="Check if property is a mix of multiple values"
 * if (node.type === 'RECTANGLE') {
 *   if (node.cornerRadius !== figma.mixed) {
 *     console.log(`Single corner radius: ${node.cornerRadius}`)
 *   } else {
 *     console.log(`Mixed corner radius: ${node.topLeftRadius}, ${node.topRightRadius}, ${node.bottomLeftRadius}, ${node.bottomRightRadius}`)
 *   }
 * }
 * ```
 *
 * Note: Your plugin never needs to know what the actual value of `figma.mixed` is, only that it is a unique, constant value that can be compared against.
 */
readonly mixed: unique symbol
````

---

## Paint (fills/strokes)

### 타입 근거

```ts
interface SolidPaint {
	/**
	 * The string literal "SOLID" representing the type of paint this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'SOLID';
	/**
	 * The color of the paint. This does not have a alpha property, use `opacity` instead.
	 */
	readonly color: RGB;
	/**
	 * Whether the paint is visible. Defaults to true.
	 */
	readonly visible?: boolean;
	/**
	 * The opacity of the paint. Must be a value between 0 and 1. Defaults to 1.
	 */
	readonly opacity?: number;
	/**
	 * Determines how the color of this paint blends with the colors underneath it. Defaults to "NORMAL".
	 */
	readonly blendMode?: BlendMode;
	/**
	 * The variables bound to a particular field on this paint.
	 */
	readonly boundVariables?: {
		[field in VariableBindablePaintField]?: VariableAlias;
	};
}

interface GradientPaint {
	/**
	 * The string literal representing the type of paint this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
	/**
	 * The positioning of the gradient within the layer.
	 */
	readonly gradientTransform: Transform;
	/**
	 * Array of colors and their position within the gradient.
	 */
	readonly gradientStops: ReadonlyArray<ColorStop>;
	readonly visible?: boolean;
	readonly opacity?: number;
	readonly blendMode?: BlendMode;
}

interface ImagePaint {
	/**
	 * The string literal "IMAGE" representing the type of paint this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'IMAGE';
	/**
	 * How the image is positioned and scaled within the layer. Same as in the properties panel.
	 */
	readonly scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
	/**
	 * The hash (id) of the image used for this paint, if any. Use {@link PluginAPI.getImageByHash} to get the corresponding image object.
	 */
	readonly imageHash: string | null;
	/**
	 * Applicable only for `scaleMode == "CROP"`.
	 */
	readonly imageTransform?: Transform;
	/**
	 * Applicable only for `scaleMode == "TILE"` (automatic for other modes).
	 */
	readonly scalingFactor?: number;
	/**
	 * Applicable only for `scaleMode == "TILE" | "FILL" | "FIT"` (automatic for `scaleMode == "CROP"`). Must be in increments of +90.
	 */
	readonly rotation?: number;
	/**
	 * The values for the image filter sliders, equivalent to those in the paint picker.
	 */
	readonly filters?: ImageFilters;
	readonly visible?: boolean;
	readonly opacity?: number;
	readonly blendMode?: BlendMode;
}

interface VideoPaint {
	/**
	 * The string literal "VIDEO" representing the type of paint this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'VIDEO';
	/**
	 * How the video is positioned and scaled within the layer. Same as in the properties panel.
	 */
	readonly scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
	/**
	 * The hash (id) of the video used for this paint, if any.
	 */
	readonly videoHash: string | null;
	/**
	 * Applicable only for `scaleMode == "CROP"`.
	 */
	readonly videoTransform?: Transform;
	/**
	 * Applicable only for `scaleMode == "TILE"` (automatic for other modes).
	 */
	readonly scalingFactor?: number;
	/**
	 * Applicable only for `scaleMode == "TILE" | "FILL" | "FIT"` (automatic for `scaleMode == "CROP"`). Must be in increments of +90.
	 */
	readonly rotation?: number;
	/**
	 * The values for the video filter sliders, equivalent to those in the paint picker.
	 */
	readonly filters?: ImageFilters;
	readonly visible?: boolean;
	readonly opacity?: number;
	readonly blendMode?: BlendMode;
}

interface PatternPaint {
	/**
	 * The string literal representing the type of paint this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'PATTERN';
	/**
	 * The node id of the source node for the pattern.
	 */
	readonly sourceNodeId: string;
	/**
	 * The way the pattern is tiled.
	 */
	readonly tileType: 'RECTANGULAR' | 'HORIZONTAL_HEXAGONAL' | 'VERTICAL_HEXAGONAL';
	/**
	 * The scaling factor of the pattern.
	 */
	readonly scalingFactor: number;
	/**
	 * The spacing of the pattern.
	 */
	readonly spacing: Vector;
	/**
	 * The horizontal alignment of the pattern.
	 */
	readonly horizontalAlignment: 'START' | 'CENTER' | 'END';
	readonly visible?: boolean;
	readonly opacity?: number;
	readonly blendMode?: BlendMode;
}

interface ColorStop {
	/**
	 * The position of the stop along the gradient between 0 and 1.
	 */
	readonly position: number;
	/**
	 * The color value of the gradient stop.
	 */
	readonly color: RGBA;
	/**
	 * The variable bound to a gradient stop.
	 */
	readonly boundVariables?: {
		[field in VariableBindableColorStopField]?: VariableAlias;
	};
}

interface ImageFilters {
	readonly exposure?: number;
	readonly contrast?: number;
	readonly saturation?: number;
	readonly temperature?: number;
	readonly tint?: number;
	readonly highlights?: number;
	readonly shadows?: number;
}

type Paint = SolidPaint | GradientPaint | ImagePaint | VideoPaint | PatternPaint;
```

### 해석 규칙

- `Paint.type`으로 반드시 분기한다. (`SOLID`, `GRADIENT_*`, `IMAGE`, `VIDEO`, `PATTERN`)
- `SolidPaint.color`는 RGB이며 **알파는 `opacity`**로 분리되어 있다. `visible`이 없으면 기본 true로 해석한다.
- `GradientPaint.gradientStops`는 `ColorStop[]`이며 `position`은 0~1 구간이다. `gradientTransform`으로 위치/방향을 해석한다.
- `ImagePaint`/`VideoPaint`는 `scaleMode`에 따라 `imageTransform`/`videoTransform`, `scalingFactor`, `rotation` 해석 범위가 달라진다.
- `ImageFilters` 값은 -1.0~1.0 범위이며 필드별로 보존한다.
- `PatternPaint`는 `sourceNodeId`와 `tileType`, `spacing`, `scalingFactor`를 함께 보존한다.
- `fills`는 `Paint[]` 또는 `figma.mixed`일 수 있다. mixed면 세그먼트/선택 분리 처리 필요.
- `boundVariables`가 있으면 필드별 변수 바인딩을 유지한다.

### 현재 구현 상태

⚠️ **구현 완료**:
- ✅ `SolidPaint` → `NormalizedSolidFill`
- ✅ `GradientPaint` (LINEAR, RADIAL, ANGULAR, DIAMOND) → `NormalizedGradientFill`
- ✅ `ImagePaint` → `NormalizedImageFill`
- ✅ `VideoPaint` → `NormalizedImageFill` (ImagePaint와 동일한 구조로 처리)

⚠️ **미구현** (향후 추가 예정):
- ❌ `PatternPaint` - 패턴 fill은 현재 처리되지 않음 (normalizePaint()에서 null 반환)

미구현된 Paint 타입(PatternPaint)을 가진 노드는 Extract 단계에서는 수집되지만, Normalize 단계에서 null을 반환하여 배열에서 제외됩니다.

---

## Stroke / Geometry / Corner

### 타입 근거

```ts
interface MinimalStrokesMixin {
	/**
	 * The paints used to fill the area of the shape's strokes.
	 */
	strokes: ReadonlyArray<Paint>;
	/**
	 * The id of the PaintStyle object that `strokes` is linked to.
	 */
	strokeStyleId: string;
	/**
	 * The thickness of the stroke, in pixels.
	 *
	 * Caution: For rectangle nodes or frame-like nodes using different individual stroke weights, this property will return {@link PluginAPI.mixed}.
	 */
	strokeWeight: number | PluginAPI['mixed'];
	/**
	 * The decoration applied to vertices which have two or more connected segments.
	 */
	strokeJoin: StrokeJoin | PluginAPI['mixed'];
	/**
	 * The alignment of the stroke with respect to the boundaries of the shape.
	 */
	strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE';
	/**
	 * A list of numbers specifying alternating dash and gap lengths, in pixels.
	 */
	dashPattern: ReadonlyArray<number>;
	/**
	 * An array of paths representing the object strokes relative to the node.
	 */
	readonly strokeGeometry: VectorPaths;
}

interface IndividualStrokesMixin {
	strokeTopWeight: number;
	strokeBottomWeight: number;
	strokeLeftWeight: number;
	strokeRightWeight: number;
}

interface MinimalFillsMixin {
	/**
	 * The paints used to fill the area of the shape.
	 */
	fills: ReadonlyArray<Paint> | PluginAPI['mixed'];
	/**
	 * The id of the PaintStyle object that `fills` is linked to.
	 */
	fillStyleId: string | PluginAPI['mixed'];
}

interface GeometryMixin extends MinimalStrokesMixin, MinimalFillsMixin {
	/**
	 * The decoration applied to vertices which have only one connected segment.
	 */
	strokeCap: StrokeCap | PluginAPI['mixed'];
	/**
	 * The miter limit on the stroke.
	 */
	strokeMiterLimit: number;
	/**
	 * An array of paths representing the object fills relative to the node.
	 */
	readonly fillGeometry: VectorPaths;
}

interface CornerMixin {
	/**
	 * The number of pixels to round the corners of the object by.
	 *
	 * This property can return {@link PluginAPI.mixed} if different vertices have different values.properties.
	 */
	cornerRadius: number | PluginAPI['mixed'];
	/**
	 * A value that lets you control how "smooth" the corners are. Ranges from 0 to 1.
	 */
	cornerSmoothing: number;
}

interface RectangleCornerMixin {
	topLeftRadius: number;
	topRightRadius: number;
	bottomLeftRadius: number;
	bottomRightRadius: number;
}
```

### 해석 규칙

- `strokeWeight`는 **혼합 가능**하므로, 사각형/프레임에서 개별 가중치(`IndividualStrokesMixin`)를 우선적으로 본다.
- `strokes`는 `Paint[]`이며 `strokeStyleId`는 링크로 별도 보존한다.
- `fills`/`fillStyleId`는 `figma.mixed`일 수 있다.
- `dashPattern`은 `[dash, gap, dash, gap]` 순서의 길이 배열이다.
- `strokeGeometry`는 `strokeAlign`과 무관하게 **항상 CENTER 기준** 경로다.
- `cornerRadius`가 `figma.mixed`이면 `RectangleCornerMixin`의 네 값으로 분해해야 한다.
- `fillGeometry`/`strokeGeometry`는 **벡터 경로**이므로, 기본적인 스타일 변환과 분리해서 처리한다.

---

## Effects / Blend

### 타입 근거

```ts
interface MinimalBlendMixin {
	/**
	 * Opacity of the node, as shown in the Layer panel. Must be between 0 and 1.
	 */
	opacity: number;
	/**
	 * Blend mode of this node, as shown in the Layer panel.
	 */
	blendMode: BlendMode;
}

interface BlendMixin extends MinimalBlendMixin {
	/**
	 * Whether this node is a mask. A mask node masks its subsequent siblings.
	 */
	isMask: boolean;
	/**
	 * Type of masking to use if this node is a mask.
	 */
	maskType: MaskType;
	/**
	 * Array of effects. See {@link Effect} type.
	 */
	effects: ReadonlyArray<Effect>;
	/**
	 * The id of the {@link EffectStyle} object that the properties of this node are linked to.
	 */
	effectStyleId: string;
}

interface DropShadowEffect {
	/**
	 * The string literal representing the type of effect this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'DROP_SHADOW';
	/**
	 * The color of the shadow, including its opacity.
	 */
	readonly color: RGBA;
	/**
	 * The offset of the shadow relative to its object.
	 */
	readonly offset: Vector;
	/**
	 * The blur radius of the shadow.
	 */
	readonly radius: number;
	/**
	 * The distance by which to expand (or contract) the shadow.
	 */
	readonly spread?: number;
	/**
	 * Whether this shadow is visible.
	 */
	readonly visible: boolean;
	/**
	 * Determines how the color of this shadow blends with the colors underneath it.
	 */
	readonly blendMode: BlendMode;
	/**
	 * Whether the drop shadow should show behind translucent or transparent pixels.
	 */
	readonly showShadowBehindNode?: boolean;
	/**
	 * The variables bound to a particular field on this shadow effect.
	 */
	readonly boundVariables?: {
		[field in VariableBindableEffectField]?: VariableAlias;
	};
}

interface InnerShadowEffect {
	/**
	 * The string literal representing the type of effect this is. Always check the `type` before reading other properties.
	 */
	readonly type: 'INNER_SHADOW';
	/**
	 * The color of the shadow, including its opacity.
	 */
	readonly color: RGBA;
	/**
	 * The offset of the shadow relative to its object.
	 */
	readonly offset: Vector;
	/**
	 * The blur radius of the shadow.
	 */
	readonly radius: number;
	/**
	 * The distance by which to expand (or contract) the shadow.
	 */
	readonly spread?: number;
	/**
	 * Whether this shadow is visible.
	 */
	readonly visible: boolean;
	/**
	 * Determines how the color of this shadow blends with the colors underneath it.
	 */
	readonly blendMode: BlendMode;
	/**
	 * The variables bound to a particular field on this shadow effect.
	 */
	readonly boundVariables?: {
		[field in VariableBindableEffectField]?: VariableAlias;
	};
}

interface BlurEffectBase {
	/**
	 * The string literal representing the type of effect this is.
	 */
	readonly type: 'LAYER_BLUR' | 'BACKGROUND_BLUR';
	/**
	 * The radius of the blur.
	 */
	readonly radius: number;
	/**
	 * Whether this blur is visible.
	 */
	readonly visible: boolean;
	/**
	 * The variable bound to the radius field.
	 */
	readonly boundVariables?: {
		['radius']?: VariableAlias;
	};
}

interface BlurEffectNormal extends BlurEffectBase {
	/**
	 * The string literal representing the blur type.
	 */
	readonly blurType: 'NORMAL';
}

interface BlurEffectProgressive extends BlurEffectBase {
	/**
	 * The string literal representing the blur type.
	 */
	readonly blurType: 'PROGRESSIVE';
	/**
	 * Radius of the starting point of the progressive blur.
	 */
	readonly startRadius: number;
	/**
	 * Position of the starting point of the progressive blur.
	 */
	readonly startOffset: Vector;
	/**
	 * Position of the ending point of the progressive blur.
	 */
	readonly endOffset: Vector;
}

type BlurEffect = BlurEffectNormal | BlurEffectProgressive;

interface NoiseEffectBase {
	/**
	 * The string literal representing the type of effect this is.
	 */
	readonly type: 'NOISE';
	/**
	 * The color of the noise effect.
	 */
	readonly color: RGBA;
	/**
	 * Whether the noise effect is visible.
	 */
	readonly visible: boolean;
	/**
	 * The blend mode of the noise.
	 */
	readonly blendMode: BlendMode;
	/**
	 * The size of the noise effect.
	 */
	readonly noiseSize: number;
	/**
	 * The density of the noise effect.
	 */
	readonly density: number;
	/**
	 * Noise effects currently do not support binding variables.
	 */
	readonly boundVariables?: {};
}

interface NoiseEffectMonotone extends NoiseEffectBase {
	/**
	 * The string literal representing the type of noise this is.
	 */
	readonly noiseType: 'MONOTONE';
}

interface NoiseEffectDuotone extends NoiseEffectBase {
	/**
	 * The string literal representing the type of noise this is.
	 */
	readonly noiseType: 'DUOTONE';
	/**
	 * The secondary color of the noise effect.
	 */
	readonly secondaryColor: RGBA;
}

interface NoiseEffectMultitone extends NoiseEffectBase {
	/**
	 * The string literal representing the type of noise this is.
	 */
	readonly noiseType: 'MULTITONE';
	/**
	 * The opacity of the noise effect.
	 */
	readonly opacity: number;
}

type NoiseEffect = NoiseEffectMonotone | NoiseEffectDuotone | NoiseEffectMultitone;

interface TextureEffect {
	/**
	 * The string literal representing the type of effect this is.
	 */
	readonly type: 'TEXTURE';
	/**
	 * Whether the texture effect is visible.
	 */
	readonly visible: boolean;
	/**
	 * The size of the texture effect.
	 */
	readonly noiseSize: number;
	/**
	 * The radius of the texture effect.
	 */
	readonly radius: number;
	/**
	 * Whether the texture is clipped to the shape.
	 */
	readonly clipToShape: boolean;
	/**
	 * Texture effects currently do not support binding variables.
	 */
	readonly boundVariables?: {};
}

interface GlassEffect {
	/**
	 * The string literal representing the type of effect this is.
	 */
	readonly type: 'GLASS';
	/**
	 * Whether this glass effect is visible.
	 */
	readonly visible: boolean;
	/**
	 * The intensity of specular highlights.
	 */
	readonly lightIntensity: number;
	/**
	 * The angle of the specular light in degrees.
	 */
	readonly lightAngle: number;
	/**
	 * The intensity of the refraction distortion.
	 */
	readonly refraction: number;
	/**
	 * The depth of the refraction effect.
	 */
	readonly depth: number;
	/**
	 * The amount of chromatic aberration (color separation).
	 */
	readonly dispersion: number;
	/**
	 * The radius of frost on the glass effect.
	 */
	readonly radius: number;
	/**
	 * Glass effects currently do not support binding variables.
	 */
	readonly boundVariables?: {};
}

type Effect = DropShadowEffect | InnerShadowEffect | BlurEffect | NoiseEffect | TextureEffect | GlassEffect;
```

### 해석 규칙

- `effects`는 **Effect union**이므로 반드시 `type`으로 분기한다. `BlurEffect`는 `blurType`, `NoiseEffect`는 `noiseType`으로 추가 분기한다.
- Drop/Inner shadow는 `offset`, `spread`, `blendMode`를 포함해 해석한다. Drop shadow는 `showShadowBehindNode`가 추가된다.
- Blur는 `type`으로 `LAYER_BLUR` vs `BACKGROUND_BLUR`를 구분하고, `PROGRESSIVE`일 경우 `startRadius`/`startOffset`/`endOffset`을 해석한다.
- Noise는 `noiseSize`/`density`/`blendMode`를 보존하고, `DUOTONE`은 `secondaryColor`, `MULTITONE`은 `opacity`를 추가로 보존한다.
- Texture/Glass는 변수 바인딩을 지원하지 않으므로 (`boundVariables`는 `{}`), 필드값만 보존한다.
- `BlendMixin.isMask`가 true이면 `maskType`을 함께 보존해야 한다.
- `opacity`/`blendMode`는 **노드 레벨** 속성으로 Paint와 별도로 적용된다.

---

## Style Nodes (Paint/Effect/Grid)

### 타입 근거

```ts
interface PaintStyle extends BaseStyleMixin {
	/**
	 * The string literal "PAINT" representing the style type. Always check the `type` before reading other properties.
	 */
	type: 'PAINT';
	/**
	 * List of {@link Paint} to replace the `fills`, `strokes`, or `backgrounds` property with.
	 */
	paints: ReadonlyArray<Paint>;
	/**
	 * The variables bound to a particular field on this paint style.
	 */
	readonly boundVariables?: {
		readonly [field in VariableBindablePaintStyleField]?: VariableAlias[];
	};
}

interface EffectStyle extends BaseStyleMixin {
	/**
	 * The string literal "EFFECT" representing the style type. Always check the `type` before reading other properties.
	 */
	type: 'EFFECT';
	/**
	 * List of {@link Effect} to replace the `effects` property with.
	 */
	effects: ReadonlyArray<Effect>;
	/**
	 * The variables bound to a particular field on this effect style.
	 */
	readonly boundVariables?: {
		readonly [field in VariableBindableEffectStyleField]?: VariableAlias[];
	};
}

interface GridStyle extends BaseStyleMixin {
	/**
	 * The string literal "GRID" representing the style type. Always check the `type` before reading other properties.
	 */
	type: 'GRID';
	/**
	 * List of {@link LayoutGrid} to replace the `layoutGrids` property with.
	 */
	layoutGrids: ReadonlyArray<LayoutGrid>;
	/**
	 * The variables bound to a particular field on this grid style.
	 */
	readonly boundVariables?: {
		readonly [field in VariableBindableGridStyleField]?: VariableAlias[];
	};
}

type BaseStyle = PaintStyle | TextStyle | EffectStyle | GridStyle;
```

### 해석 규칙

- `*Style` 객체는 노드의 `fillStyleId`/`strokeStyleId`/`effectStyleId`/`gridStyleId`가 참조하는 스타일이다.
- 스타일을 직접 조회할 때만 `paints`/`effects`/`layoutGrids`를 해석하고, 기본 추출에서는 링크 id를 유지한다.
- `boundVariables`는 필드별 배열로 유지한다. (style의 변수 바인딩은 단일 alias가 아님)

---

## Layout (Constraints / Auto Layout / Grid)

### 타입 근거

```ts
type ConstraintType = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
interface Constraints {
	readonly horizontal: ConstraintType;
	readonly vertical: ConstraintType;
}

interface ConstraintMixin {
	/**
	 * Constraints of this node relative to its containing {@link FrameNode}, if any.
	 */
	constraints: Constraints;
}

interface LayoutMixin extends DimensionAndPositionMixin, AutoLayoutChildrenMixin, GridChildrenMixin {
	/**
	 * Shorthand for auto-layout sizing. Maps to layoutGrow/layoutAlign/axis sizing modes.
	 */
	layoutSizingHorizontal: 'FIXED' | 'HUG' | 'FILL';
	layoutSizingVertical: 'FIXED' | 'HUG' | 'FILL';
}

interface AutoLayoutMixin {
	/**
	 * Determines whether this layer uses auto-layout to position its children.
	 */
	layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
	/**
	 * Applicable only on auto-layout frames. Determines the padding between the border of the frame and its children.
	 */
	paddingLeft: number;
	paddingRight: number;
	paddingTop: number;
	paddingBottom: number;
	/**
	 * @deprecated Use `paddingLeft`/`paddingRight`/`paddingTop`/`paddingBottom`.
	 */
	horizontalPadding: number;
	verticalPadding: number;
	/**
	 * Primary/counter axis sizing mode.
	 */
	primaryAxisSizingMode: 'FIXED' | 'AUTO';
	counterAxisSizingMode: 'FIXED' | 'AUTO';
	/**
	 * Whether strokes are included in layout calculations.
	 */
	strokesIncludedInLayout: boolean;
	/**
	 * Determines whether this layer should use wrapping auto-layout.
	 */
	layoutWrap: 'NO_WRAP' | 'WRAP';
	/**
	 * Alignment and spacing.
	 */
	primaryAxisAlignItems: 'MIN' | 'MAX' | 'CENTER' | 'SPACE_BETWEEN';
	counterAxisAlignItems: 'MIN' | 'MAX' | 'CENTER' | 'BASELINE';
	counterAxisAlignContent: 'AUTO' | 'SPACE_BETWEEN';
	itemSpacing: number;
	counterAxisSpacing: number | null;
	itemReverseZIndex: boolean;
}

interface AutoLayoutChildrenMixin {
	/**
	 * Applicable only on direct children of auto-layout frames.
	 */
	layoutAlign: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT';
	/**
	 * Determines whether a layer should stretch along the parent’s primary axis.
	 */
	layoutGrow: number;
	/**
	 * Determines whether a layer's size and position should be dermined by auto-layout settings or manually adjustable.
	 */
	layoutPositioning: 'AUTO' | 'ABSOLUTE';
}

interface GridTrackSize {
	value?: number;
	type: 'FLEX' | 'FIXED' | 'HUG';
}

interface GridLayoutMixin {
	/**
	 * Applicable only on auto-layout frames with `layoutMode` set to "GRID".
	 */
	gridRowCount: number;
	gridColumnCount: number;
	gridRowGap: number;
	gridColumnGap: number;
	gridRowSizes: Array<GridTrackSize>;
	gridColumnSizes: Array<GridTrackSize>;
	appendChildAt(node: SceneNode, rowIndex: number, columnIndex: number): void;
}

interface GridChildrenMixin {
	setGridChildPosition(rowIndex: number, columnIndex: number): void;
	readonly gridRowAnchorIndex: number;
	readonly gridColumnAnchorIndex: number;
	gridRowSpan: number;
	gridColumnSpan: number;
	gridChildHorizontalAlign: 'MIN' | 'CENTER' | 'MAX' | 'AUTO';
	gridChildVerticalAlign: 'MIN' | 'CENTER' | 'MAX' | 'AUTO';
}

interface RowsColsLayoutGrid {
	readonly pattern: 'ROWS' | 'COLUMNS';
	readonly alignment: 'MIN' | 'MAX' | 'STRETCH' | 'CENTER';
	readonly gutterSize: number;
	readonly count: number;
	readonly sectionSize?: number;
	readonly offset?: number;
	readonly visible?: boolean;
	readonly color?: RGBA;
	readonly boundVariables?: {
		[field in VariableBindableLayoutGridField]?: VariableAlias;
	};
}

interface GridLayoutGrid {
	readonly pattern: 'GRID';
	readonly sectionSize: number;
	readonly visible?: boolean;
	readonly color?: RGBA;
	readonly boundVariables?: {
		['sectionSize']?: VariableAlias;
	};
}

type LayoutGrid = RowsColsLayoutGrid | GridLayoutGrid;
```

### 해석 규칙

- `layoutMode === 'NONE'`이면 auto-layout 해석을 하지 않는다.
- `layoutSizingHorizontal`/`layoutSizingVertical`는 auto-layout 프레임/자식/텍스트에서만 유효하며, `HUG`는 프레임/텍스트, `FILL`은 자식에만 유효하다.
- `primaryAxisSizingMode`/`counterAxisSizingMode`는 auto-layout 프레임의 축 크기 결정 방식이다.
- `layoutPositioning === 'ABSOLUTE'`면 해당 노드는 **auto-layout 흐름에서 제외**되고, `x/y/constraints`로 위치를 해석한다.
- `layoutWrap === 'WRAP'`일 때만 `counterAxisSpacing`/`counterAxisAlignContent`를 해석한다.
- Grid는 `layoutMode === 'GRID'`일 때만 유효하며, `gridRowSizes`/`gridColumnSizes`의 `GridTrackSize`를 기준으로 **그리드 트랙 기반 해석**을 수행한다.
- `GridChildrenMixin`의 span/anchor/alignment는 그리드 셀 내 위치/크기를 결정한다.

---

## Text

### 타입 근거

```ts
interface FontName {
	readonly family: string;
	readonly style: string;
}

type FontStyle = 'REGULAR' | 'ITALIC';

type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';

type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';

type TextDecorationStyle = 'SOLID' | 'WAVY' | 'DOTTED';

type TextDecorationOffset =
	| {
			readonly value: number;
			readonly unit: 'PIXELS' | 'PERCENT';
	  }
	| {
			readonly unit: 'AUTO';
	  };

type TextDecorationThickness =
	| {
			readonly value: number;
			readonly unit: 'PIXELS' | 'PERCENT';
	  }
	| {
			readonly unit: 'AUTO';
	  };

type TextDecorationColor =
	| {
			readonly value: SolidPaint;
	  }
	| {
			readonly value: 'AUTO';
	  };

interface LetterSpacing {
	readonly value: number;
	readonly unit: 'PIXELS' | 'PERCENT';
}

type LineHeight =
	| {
			readonly value: number;
			readonly unit: 'PIXELS' | 'PERCENT';
	  }
	| {
			readonly unit: 'AUTO';
	  };

type LeadingTrim = 'CAP_HEIGHT' | 'NONE';

type TextListOptions = {
	type: 'ORDERED' | 'UNORDERED' | 'NONE';
};

type HyperlinkTarget = {
	type: 'URL' | 'NODE';
	value: string;
};

type TextStyleOverrideType = {
	type: 'SEMANTIC_ITALIC' | 'SEMANTIC_WEIGHT' | 'HYPERLINK' | 'TEXT_DECORATION';
};

interface StyledTextSegment {
	/**
	 * The characters in the range of text with the same styles.
	 */
	characters: string;
	/**
	 * Start index (inclusive) of the range of characters.
	 */
	start: number;
	/**
	 * End index (exclusive) of the range of characters.
	 */
	end: number;
	/**
	 * The size of the font. Has minimum value of 1.
	 */
	fontSize: number;
	/**
	 * The font family (e.g. "Inter"), and font style (e.g. "Regular").
	 */
	fontName: FontName;
	/**
	 * The weight of the font (e.g. 400 for "Regular", 700 for "Bold").
	 */
	fontWeight: number;
	/**
	 * The style of the font (i.e. "REGULAR", "ITALIC").
	 */
	fontStyle: FontStyle;
	/**
	 * Whether the text is underlined or has a strikethrough.
	 */
	textDecoration: TextDecoration;
	/**
	 * The text decoration style. If not underlined, this is null.
	 */
	textDecorationStyle: TextDecorationStyle | null;
	/**
	 * The text decoration offset. If not underlined, this is null.
	 */
	textDecorationOffset: TextDecorationOffset | null;
	/**
	 * The text decoration thickness. If not underlined, this is null.
	 */
	textDecorationThickness: TextDecorationThickness | null;
	/**
	 * The text decoration color. If not underlined, this is null.
	 */
	textDecorationColor: TextDecorationColor | null;
	/**
	 * Whether the text decoration skips descenders. If not underlined, this is null.
	 */
	textDecorationSkipInk: boolean | null;
	/**
	 * Overrides the case of the raw characters in the text node.
	 */
	textCase: TextCase;
	/**
	 * The spacing between the lines in a paragraph of text.
	 */
	lineHeight: LineHeight;
	/**
	 * The spacing between the individual characters.
	 */
	letterSpacing: LetterSpacing;
	/**
	 * The paints used to fill the area of the shape.
	 */
	fills: Paint[];
	/**
	 * The id of the TextStyle object that the text properties of this node are linked to.
	 */
	textStyleId: string;
	/**
	 * The id of the PaintStyle object that the fills property of this node is linked to.
	 */
	fillStyleId: string;
	/**
	 * The list settings.
	 */
	listOptions: TextListOptions;
	/**
	 * The spacing between list items.
	 */
	listSpacing: number;
	/**
	 * The indentation.
	 */
	indentation: number;
	/**
	 * The paragraph indent.
	 */
	paragraphIndent: number;
	/**
	 * The paragraph spacing.
	 */
	paragraphSpacing: number;
	/**
	 * A HyperlinkTarget if the text node has exactly one hyperlink, or null if the node has none.
	 */
	hyperlink: HyperlinkTarget | null;
	/**
	 * OpenType features that have been explicitly enabled or disabled.
	 */
	openTypeFeatures: {
		readonly [feature in OpenTypeFeature]: boolean;
	};
	/**
	 * The variables bound to a particular field.
	 */
	boundVariables?: {
		[field in VariableBindableTextField]?: VariableAlias;
	};
	/**
	 * Overrides applied over a text style.
	 */
	textStyleOverrides: TextStyleOverrideType[];
}

interface BaseNonResizableTextMixin {
	/**
	 * Returns whether the text uses a font currently not available to the document.
	 */
	readonly hasMissingFont: boolean;
	/**
	 * The size of the font. Has minimum value of 1.
	 */
	fontSize: number | PluginAPI['mixed'];
	/**
	 * The font family and style.
	 */
	fontName: FontName | PluginAPI['mixed'];
	/**
	 * The weight of the font.
	 */
	readonly fontWeight: number | PluginAPI['mixed'];
	/**
	 * Overrides the case of the raw characters in the text node.
	 */
	textCase: TextCase | PluginAPI['mixed'];
	/**
	 * OpenType features that have been explicitly enabled or disabled.
	 */
	readonly openTypeFeatures:
		| {
				readonly [feature in OpenTypeFeature]: boolean;
		  }
		| PluginAPI['mixed'];
	/**
	 * The spacing between the individual characters.
	 */
	letterSpacing: LetterSpacing | PluginAPI['mixed'];
	/**
	 * A HyperlinkTarget if the text node has exactly one hyperlink, or null if the node has none.
	 */
	hyperlink: HyperlinkTarget | null | PluginAPI['mixed'];
	/**
	 * The raw characters in the text node.
	 */
	characters: string;
}

interface NonResizableTextMixin extends BaseNonResizableTextMixin {
	paragraphIndent: number;
	paragraphSpacing: number;
	listSpacing: number;
	hangingPunctuation: boolean;
	hangingList: boolean;
	textDecoration: TextDecoration | PluginAPI['mixed'];
	textDecorationStyle: TextDecorationStyle | PluginAPI['mixed'] | null;
	textDecorationOffset: TextDecorationOffset | PluginAPI['mixed'] | null;
	textDecorationThickness: TextDecorationThickness | PluginAPI['mixed'] | null;
	textDecorationColor: TextDecorationColor | PluginAPI['mixed'] | null;
	textDecorationSkipInk: boolean | PluginAPI['mixed'] | null;
	lineHeight: LineHeight | PluginAPI['mixed'];
	leadingTrim: LeadingTrim | PluginAPI['mixed'];
}

interface TextStyle extends BaseStyleMixin {
	/**
	 * The string literal "TEXT" representing the style type.
	 */
	type: 'TEXT';
	fontSize: number;
	textDecoration: TextDecoration;
	fontName: FontName;
	letterSpacing: LetterSpacing;
	lineHeight: LineHeight;
	leadingTrim: LeadingTrim;
	paragraphIndent: number;
	paragraphSpacing: number;
	listSpacing: number;
	hangingPunctuation: boolean;
	hangingList: boolean;
	textCase: TextCase;
	boundVariables?: {
		[field in VariableBindableTextField]?: VariableAlias;
	};
}

interface TextNode
	extends DefaultShapeMixin, ConstraintMixin, NonResizableTextMixin, AnnotationsMixin, AspectRatioLockMixin {
	/**
	 * The type of this node, represented by the string literal "TEXT"
	 */
	readonly type: 'TEXT';
	/**
	 * The behavior of how the size of the text box adjusts to fit the characters.
	 */
	textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
	/**
	 * Whether this text node will truncate with an ellipsis when the text node size is smaller than the text inside.
	 */
	textTruncation: 'DISABLED' | 'ENDING';
	/**
	 * The maximum number of lines a text node can reach before it truncates.
	 */
	maxLines: number | null;
	/**
	 * The id of the {@link TextStyle} object that the text properties of this node are linked to.
	 */
	textStyleId: string | PluginAPI['mixed'];
}
```

### 해석 규칙

- 텍스트는 **세그먼트 기반 해석이 기본**이다. (`getStyledTextSegments`나 range API가 있으면 우선 적용)
- `FontName`은 `family/style`로 분리되어 있으므로 하나의 문자열로 합치지 않는다.
- `LineHeight`/`LetterSpacing`/`TextDecorationOffset`/`TextDecorationThickness`는 **단위가 포함된 구조 타입**이므로 값+단위로 보존한다.
- `textDecoration*` 계열은 밑줄이 없으면 `null`일 수 있다. `TextDecorationColor`는 `SolidPaint` 또는 `AUTO`다.
- `textAutoResize`의 `TRUNCATE`는 deprecated이므로 truncation 판정은 `textTruncation`/`maxLines` 기준으로 본다.
- `textStyleId`/`fillStyleId`가 `figma.mixed`면 세그먼트 단위 스타일 링크를 확인해야 한다.
- `openTypeFeatures`는 **기본값과 다른 항목만** 포함되는 map이므로 누락을 false로 해석하지 않는다.

---
