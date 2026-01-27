<context>
# Overview

DOM/React 기반 디자인 에디터. 에디터에서 시각적으로 UI를 편집하면 실시간으로 React 코드가 생성된다. Figma 수준의 편집 기능을 제공하면서, 결과물이 바로 프로덕션에서 사용 가능한 React 컴포넌트 코드가 된다.

**핵심 가치**: "What You See Is What You Code" - 디자인과 코드 사이 변환 레이어 없음.

**대상 사용자**: React 개발자, 디자이너-개발자

# Core Features

## 1. 기본 에디터 기능

Figma와 같은 디자인 툴 수준의 편집 기능.

- 캔버스에서 노드 선택, 이동, 리사이즈
- 레이어 패널로 계층 구조 관리
- 속성 패널로 스타일 편집
- Undo/Redo
- 다중 선택, 복사/붙여넣기

## 2. 실시간 코드 프리뷰

편집하는 동시에 React 코드 확인.

- 선택한 노드의 JSX 실시간 표시
- 스타일 변경 시 즉시 코드 반영
- 코드 복사 기능

## 3. 컴포넌트 시스템

재사용 가능한 컴포넌트 정의 및 인스턴스 생성.

> **NOTE**: 컴포넌트 시스템 부분은 더 고민 필요. 어떤 기능을 지원할 것인지 추가 분석 필요.

### 3.1 Variant

Figma Component Variants와 동일. 하나의 컴포넌트가 여러 변형을 가짐.

- 예: Button의 size(sm/md/lg), state(default/hover/disabled)
- 인스턴스에서 variant 조합 선택
- 선택된 variant에 따라 스타일 변경

### 3.2 Slot 패턴

컴포넌트 내부에 교체 가능한 영역 정의.

- 예: Card 컴포넌트의 header, body, footer 슬롯
- 인스턴스에서 각 슬롯에 다른 내용 삽입
- 필수/선택 슬롯 구분

### 3.3 Compound 패턴

부모-자식 관계로 구성된 컴포넌트 세트.

- 예: Tabs → Tabs.List, Tabs.Tab, Tabs.Panel
- 부모-자식 간 상태 공유
- 하위 컴포넌트는 단독 사용 불가, 부모 컨텍스트 내에서만 동작

## 4. 코드 Export

에디터에서 만든 컴포넌트를 파일로 내보내기.

- 스타일 포맷 선택 (Inline/Tailwind/CSS Module)
- TypeScript 지원
- 수정 없이 프로젝트에서 바로 사용 가능한 코드

# User Experience

**주요 사용 흐름:**

1. 캔버스에서 노드 추가/편집하며 UI 구성
2. 우측 패널에서 실시간 코드 확인
3. 노드를 컴포넌트로 변환
4. Variant, Slot, Compound 설정
5. 인스턴스 생성하여 재사용
6. 최종 코드 Export

**UI 구성:**

- 좌측: 레이어 패널, Assets 패널 (컴포넌트 목록)
- 중앙: 캔버스
- 우측: 속성 패널, 코드 프리뷰 패널
  </context>

<PRD>
# Technical Architecture

## 시스템 구성요소

- **editor-core**: 타입 정의, codegen 로직
- **editor-shell**: 메인 앱 (툴바, 패널, 상태관리)
- **editor-canvas**: 캔버스 렌더링 (iframe으로 분리)
- **editor-components**: 기본 컴포넌트 레지스트리

## 데이터 모델

- **NodeData**: 노드 트리의 기본 단위
- **ComponentDefinition**: 컴포넌트 정의 (variants, slots, compound 정보 포함)
- **InstanceNode**: 컴포넌트 인스턴스 (선택된 variant, 오버라이드 정보)

## Shell-Canvas 통신

iframe 간 메시지 통신. 캔버스의 스타일이 에디터 UI에 영향 주지 않도록 격리.

# Development Roadmap

## Phase 1: 기본 에디터 완성

현재 있는 기본 기능들 안정화.

- 노드 선택/이동/리사이즈 안정화
- 레이어 패널 드래그앤드롭
- Undo/Redo 구현
- 기본 코드 프리뷰 (선택 노드 JSX)

## Phase 2: Variant 시스템

컴포넌트에 Variant 추가.

- ComponentDefinition에 variants 필드 추가
- Variant 편집 UI
- 인스턴스에서 Variant 선택 UI
- Variant에 따른 스타일 렌더링
- codegen에 Variant → props 변환

## Phase 3: Slot 패턴

컴포넌트에 Slot 정의.

- Slot 지정 UI (노드를 슬롯으로 마킹)
- 인스턴스에서 Slot 내용 교체
- codegen에 Slot → props 변환

## Phase 4: Compound 패턴

부모-자식 컴포넌트 세트.

- Compound 컴포넌트 정의 UI
- 하위 컴포넌트 정의
- Context 기반 상태 공유 codegen

## Phase 5: Export 고도화

다양한 포맷 지원.

- Tailwind 변환
- CSS Module 변환
- 프로젝트 구조로 Export (폴더, index 파일)

# Logical Dependency Chain

1. **Undo/Redo** - 모든 편집 기능의 기반
2. **기본 codegen 안정화** - NodeData → JSX 변환 완성
3. **Variant 타입 및 데이터 모델** - 컴포넌트 확장의 기반
4. **Variant UI** - 사용자가 눈으로 확인 가능
5. **Variant codegen** - 코드 출력 확인
6. **Slot 타입 및 데이터 모델**
7. **Slot UI**
8. **Slot codegen**
9. **Compound 타입 및 데이터 모델**
10. **Compound UI**
11. **Compound codegen**
12. **Export 포맷 확장**

각 단계가 이전 단계 위에 쌓이며, 각 단계 완료 시 동작하는 결과물 확인 가능.

# Risks and Mitigations

## Variant 조합 폭발

여러 Variant property가 있으면 조합이 기하급수적으로 증가.

- 대응: 필요한 조합만 오버라이드, 나머지는 기본값 사용

## Compound 패턴 복잡도

Context 기반 상태 공유 codegen이 복잡할 수 있음.

- 대응: 단순한 패턴부터 지원, 점진적 확장

## codegen 코드 품질

생성된 코드가 읽기 어려울 수 있음.

- 대응: Prettier 포맷팅, 의미있는 변수명 사용

# Appendix

## 현재 구현 상태

- NodeData, ComponentDefinition, InstanceNode 타입 정의됨
- 기본 컴포넌트/인스턴스 생성 액션 있음
- serialize.ts로 기본 JSX 생성 가능
- Shell/Canvas 분리 아키텍처 동작 중

## 참고

- Figma Component/Variants 시스템
- React Compound Component 패턴
- Radix UI, Headless UI 등의 Slot 패턴
  </PRD>
