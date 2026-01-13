# 아키텍처 플로우 도식화

현재 buildNodeTree() (src/main/node/index.ts)부터 시작하여, 전체 아키텍처가 어떻게 진행되는지 도식화한 문서입니다.

## 전체 아키텍처 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. ENTRY POINT: buildNodeTree() (src/main/node/index.ts:11)        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
         ┌─────────────────────────────────────────────────┐
         │ 노드 타입별 Builder 함수 선택 (switch-case)      │
         │ • TEXT → buildTextNode()                        │
         │ • FRAME → buildFrameNode()                      │
         │ • INSTANCE → buildInstanceNode()                │
         │ • RECTANGLE → buildRectangleNode()              │
         │ • GROUP → buildGroupNode()                      │
         │ • default → buildGenericNode()                  │
         └─────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. NODE DATA BUILDING: buildNodeData() (src/main/node/props.ts:535)│
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │ Extract Stage│ │ Normalize    │ │ Token        │
         │              │ │ Stage        │ │ Resolution   │
         └──────────────┘ └──────────────┘ └──────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ 3. EXTRACT STAGE: extractStyle() (pipeline/extract/style.ts:219)   │
│ 목적: Figma Plugin API에서 raw 데이터 안전하게 추출                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌────────────┐          ┌────────────┐          ┌────────────┐
   │ extractFill│          │ extractText│          │ extractAuto│
   │ Props()    │          │ Props()    │          │ Layout()   │
   └────────────┘          └────────────┘          └────────────┘
          │                        │                        │
          ▼                        ▼                        ▼
   ┌────────────┐          ┌────────────┐          ┌────────────┐
   │ extractEffe│          │ extractStro│          │ collect    │
   │ ctProps()  │          │ keProps()  │          │ BoundVari  │
   └────────────┘          └────────────┘          │ ables()    │
                                                    └────────────┘
          │
          └────────────────► ExtractedStyle
                             • fills: ExtractedFillProps
                             • effects: ExtractedEffectProps
                             • layout: ExtractedLayoutProps
                             • text: ExtractedTextProps
                             • stroke: ExtractedStrokeProps
                             • boundVariables: VariableAlias[] (재귀 수집)
                             • nodeBoundVariables: raw boundVariables


┌─────────────────────────────────────────────────────────────────────┐
│ 4. NORMALIZE STAGE: normalizeStyle() (pipeline/normalize/style.ts:9)│
│ 목적: Raw 데이터를 LLM 친화적 구조로 변환                            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌────────────┐          ┌────────────┐          ┌────────────┐
   │ normalizeFi│          │ normalizeEf│          │ normalizeL │
   │ lls()      │          │ fects()    │          │ ayout()    │
   │ • mixed 처리│          │ • mixed 처리│          │ • container│
   │ • RGB→hex  │          │ • blur     │          │ • child    │
   └────────────┘          │ • shadow   │          └────────────┘
          │                └────────────┘                 │
          ▼                        │                      ▼
   ┌────────────┐                 ▼               ┌────────────┐
   │ normalizeTe│          ┌────────────┐         │ normalizeS │
   │ xt()       │          │            │         │ troke()    │
   │ • runs 분할 │          │            │         └────────────┘
   └────────────┘          └────────────┘
          │
          └────────────────► NormalizedStyle
                             • fills: NormalizedValue<NormalizedFill[]>
                             • effects: NormalizedValue<NormalizedEffect[]>
                             • layout: NormalizedLayout
                             • text: NormalizedText | null
                             • stroke: NormalizedStroke | null


┌─────────────────────────────────────────────────────────────────────┐
│ 5. TOKEN RESOLUTION & ENRICHMENT (src/main/node/props.ts)          │
│ 목적: VariableAlias → TokenRef 변환 및 TokenizedValue 래핑          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
   │buildTokenRef│        │buildTokenRef│        │enrichStyle()│
   │s()          │───────►│Map()        │───────►│             │
   │VariableRegi │        │Map<id,Token │        │ • apply     │
   │stry로 해석   │        │Ref>         │        │   TokenRef  │
   └─────────────┘        └─────────────┘        │ • wrap as   │
          │                                       │   Tokenized │
          │                                       │   Value<T>  │
          │                                       └─────────────┘
          └────────────────► TokenRefMapping[]
                             { variableId, token: TokenRef }

   enrichStyle() 내부에서 각 속성별로 token 적용:
   ┌────────────────────────────────────────────────────────┐
   │ • resolveFillTokens()   : fill.color에 tokenRef 적용    │
   │ • resolveEffectTokens() : effect 속성에 tokenRef 적용   │
   │ • resolveStrokeTokens() : stroke.paints에 tokenRef 적용│
   │ • resolveLayoutTokens() : layout 속성에 tokenRef 적용   │
   │ • resolveTextTokens()   : text run 속성에 tokenRef 적용│
   │ • buildLayoutGrids()    : grid 속성에 tokenRef 적용    │
   └────────────────────────────────────────────────────────┘
                             │
                             ▼
                    OutputNormalizedStyle
                    • fills: NormalizedValue<TokenizedValue<NormalizedFill>[]>
                    • effects: NormalizedValue<TokenizedValue<NormalizedEffect>[]>
                    • stroke: OutputNormalizedStroke | null
                    • layout: OutputNormalizedLayout
                    • text: NormalizedText (runs 안에 TokenizedValue)
                    • visible?: TokenizedValue<boolean>
                    • opacity?: TokenizedValue<number>


┌─────────────────────────────────────────────────────────────────────┐
│ 6. REFERENCE & ASSET COLLECTION                                     │
└─────────────────────────────────────────────────────────────────────┘
          │                        │                        │
          ▼                        ▼                        ▼
   ┌────────────┐          ┌────────────┐          ┌────────────┐
   │buildInstanc│          │buildAssetRe│          │            │
   │eRef()      │          │fs()        │          │            │
   │ • componen │          │ • image    │          │            │
   │   tId      │          │ • vector   │          │            │
   │ • variant  │          │ • mask     │          │            │
   └────────────┘          └────────────┘          └────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│ 7. FINAL OUTPUT: ReactNode                                          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ BaseReactNode<T>         │
                    │ {                        │
                    │   type: NodeType         │
                    │   props: {               │
                    │     id                   │
                    │     name                 │
                    │     style                │
                    │     boundVariables       │
                    │   }                      │
                    │   children?: ReactNode[] │
                    │   instanceRef?           │
                    │   tokensRef?             │
                    │   assets?                │
                    │ }                        │
                    └──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ 재귀: 자식 노드 처리       │
                    │ buildNodeTree(child)     │
                    │ visible=false는 필터링    │
                    └──────────────────────────┘
```

## 핵심 데이터 변환 과정

```
SceneNode (Figma API)
    ↓
ExtractedStyle
    • fills: Paint[] | figma.mixed
    • effects: Effect[] | figma.mixed
    • text: { characters, fills, ... }
    • boundVariables: { ids: string[] }
    ↓
NormalizedStyle
    • fills: NormalizedValue<NormalizedFill[]>
        - solid: { color: { hex, rgb, rgba } }
        - gradient: { stops: ColorStop[] }
    • effects: NormalizedValue<NormalizedEffect[]>
    • layout: { position, container, child }
    • text: { runs: NormalizedTextRun[] }
    ↓
TokenRefMapping[]
    { variableId, token: TokenRef }
    (VariableRegistry를 통해 VariableAlias 해석)
    ↓
OutputNormalizedStyle (enrichStyle)
    • fills: NormalizedValue<TokenizedValue<NormalizedFill>[]>
        - TokenizedValue<T> = T | { tokenRef, fallback: T }
    • visible: TokenizedValue<boolean>
    • opacity: TokenizedValue<number>
    ↓
ReactNode
    • type, props, children
    • instanceRef (컴포넌트 참조)
    • tokensRef (디자인 토큰 참조)
    • assets (이미지/벡터 자산)
```

## 주요 특징

1. **2-Stage Pipeline**: Extract(추출) → Normalize(정규화)가 명확히 분리됨
2. **Token Preservation**: VariableAlias를 TokenizedValue로 보존하여 LLM이 토큰 시스템을 이해 가능
3. **Recursive Processing**: buildNodeTree가 재귀적으로 전체 트리 순회
4. **Type Safety**: 각 단계마다 타입이 명확히 정의됨
5. **Asset & Reference Collection**: 이미지, 컴포넌트 참조 등 부가 정보 수집

## 각 단계별 파일 위치

| 단계 | 파일 경로 | 주요 함수 |
|------|----------|----------|
| Entry Point | `src/main/node/index.ts` | `buildNodeTree()` |
| Type Builders | `src/main/node/builders.ts` | `buildTextNode()`, `buildFrameNode()`, etc. |
| Node Data Building | `src/main/node/props.ts` | `buildNodeData()`, `enrichStyle()` |
| Extract | `src/main/pipeline/extract/style.ts` | `extractStyle()` |
| Extract - Fills | `src/main/pipeline/extract/fills.ts` | `extractFillProps()` |
| Extract - Effects | `src/main/pipeline/extract/effects.ts` | `extractEffectProps()` |
| Extract - Layout | `src/main/pipeline/extract/layout.ts` | `extractAutoLayout()` |
| Extract - Text | `src/main/pipeline/extract/text.ts` | `extractTextProps()` |
| Extract - Stroke | `src/main/pipeline/extract/stroke.ts` | `extractStrokeProps()` |
| Normalize | `src/main/pipeline/normalize/style.ts` | `normalizeStyle()` |
| Normalize - Fills | `src/main/pipeline/normalize/fills.ts` | `normalizeFills()` |
| Normalize - Effects | `src/main/pipeline/normalize/effects.ts` | `normalizeEffects()` |
| Normalize - Layout | `src/main/pipeline/normalize/layout.ts` | `normalizeLayout()` |
| Normalize - Text | `src/main/pipeline/normalize/text.ts` | `normalizeText()` |
| Normalize - Stroke | `src/main/pipeline/normalize/stroke.ts` | `normalizeStroke()` |
| Variable Resolution | `src/main/pipeline/variables/registry.ts` | `VariableRegistry.resolveAlias()` |
| Schema Validation | `src/main/pipeline/shared/schemas.ts` | Zod 스키마 정의 |

## 타입 정의 위치

| 타입 | 파일 경로 |
|------|----------|
| ReactNode 관련 | `src/main/node/type.ts` |
| ExtractedStyle 관련 | `src/main/pipeline/extract/types.ts` |
| NormalizedStyle 관련 | `src/main/pipeline/normalize/types.ts` |
| TokenizedValue, TokenRef | `src/main/pipeline/normalize/types.ts` |
| InstanceRef, AssetRef | `src/main/node/type.ts` |
