# Figma → LLM → Code 아키텍처 문서

## 목표

- Figma node 데이터 전체를 입력으로 받아 목적에 맞는 코드 생성
- 타깃 프레임워크는 사용자 선택형(플러그형 어댑터)
- 유지보수 가능하고 타입 설계가 완벽한 아키텍처로 구현
- 레이아웃 정확도 + 구조적 일관성 동시 만족
- 1차 우선순위: LLM에 줄 데이터 구조/품질 설계

## 범위 정의

- “Figma 기능” = Figma node 데이터 전체
    - 노드 그래프, 속성, 컴포넌트/인스턴스, 스타일, 텍스트, 벡터, 마스크, 이펙트, 변수/boundVariable 등

## 타입 설계 원칙

1. Figma Plugin API에 정의된 타입을 SSOT로 사용한다.
2. `any`나 불필요한 타입 단언으로 우회하지 않고, 필요하다면 타입 설계 자체를 개선한다.

## LLM 입력 설계 원칙

1. LLM에는 “필요한 최소 정보”만 전달
2. 구조/스타일/자산/토큰을 분리해 혼동 방지
3. Instance는 이미 컴포넌트 참조이므로 그대로 연결
4. boundVariable은 토큰 매핑의 1차 신호
5. 스키마 강제로 일관성과 타입 안정 확보

## LLM에 전달할 데이터 설계 (개념 설계 — 구조 방향)

> 이 섹션은 예시가 아니라 “무엇을 담아야 하는지”에 대한 개념 설계다.
> 실제 전달용 스키마(필드 타입/필수/옵션/제한)는 별도 단계에서 확정한다.

### 1) LLM 입력용 표준 노드 구성 기준 (build 결과)

- nodes[]: id, type, parentId, children
- layout: width, height, x, y, autoLayout, constraints
- style: fills, strokes, effects, typography
- instanceRef: componentId, componentName, variantInfo
- tokensRef: boundVariable → tokenId
- assets: image/vector/mask references

### 2) 전달 금지/제외 원칙

- 기본값/중복 속성 제거
- 렌더링과 무관한 메타데이터 제거
- 동일 정보 중복 전달 금지

### 3) 전달 형태

- Build 요약 + 핵심 노드 리스트
- 스타일/토큰/자산은 분리 블록
- 자산은 reference만 전달 (바이너리는 별도 처리)

## 사전 처리 파이프라인 (LLM 입력 품질 확보)

1. Extract

- Figma node graph 전체 추출
- Instance → Component 참조를 그대로 연결 (componentId, componentName)
- boundVariable 포함 스타일/텍스트/벡터/마스크 확보

2. Normalize

- 좌표/단위 통일
- Auto Layout/Constraints 해석
- 중복 스타일 병합 및 상속 정리
- 기본값 제거

3. Build (단일 노드)

- extract/normalize 결과에 instanceRef/tokensRef/assets 추가
- 노드 단위 스키마 고정 (재귀는 별도 트리 순회에서 처리)

## 컴포넌트 처리 규칙

- Instance는 이미 컴포넌트 참조이므로 “매핑 단계” 없음
- componentName → 실제 코드 컴포넌트/임포트 매핑은 타깃 프레임워크 어댑터에서만 처리

## 토큰 처리 규칙

- boundVariable은 토큰 매핑의 절대 기준
- 색/타이포/스페이싱/효과 모두 토큰화
- 토큰 매핑 결과는 build 결과에 고정

## LLM 입력 패키지 구성 (권장)

1. Build Summary: 노드 수, 주요 컴포넌트 수, 토큰 수, 레이아웃 방식 요약
2. Core Nodes: 화면 영향 큰 노드 위주
3. Component References: instanceRef 표준 리스트
4. Token Map: boundVariable 기반 토큰 정의 + 사용처
5. Assets Manifest: 이미지/벡터 식별자와 사용 위치

## LLM 입력 품질 검증 기준

- 스키마 준수 여부
- 노드 그래프 완결성
- Instance ↔ Component 연결 보존
- boundVariable ↔ Token 연결 보존

## 리스크와 대응 (LLM 입력 관점)

- 큰 파일: 요약/Chunking + 캐시
- 복잡한 스타일: 토큰 우선, 비토큰 최소화
- LLM 혼동: 구조/스타일/자산 분리 강화

## 다음 단계

- 실제 전달용 JSON 스키마 확정(필드 타입, 필수/옵션, 제약)
- 타깃 프레임워크 어댑터 인터페이스 정의
- LLM 입력 샘플과 검증 테스트 작성
