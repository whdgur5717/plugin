# Design Editor - Task List

## Phase 1: 기반 구조 ✅

- [x] 모노레포 설정 (pnpm workspace)
  - [x] packages/ 디렉토리 구조 생성
  - [x] editor-core, editor-shell, editor-canvas, editor-components 패키지 생성
  - [x] package.json, tsconfig.json 설정

- [x] editor-core 패키지: 타입, 스키마 정의
  - [x] NodeData, DocumentNode 타입 정의
  - [x] EditorState, EditorActions 타입 정의
  - [x] Zod 스키마 작성 (nodeDataSchema, documentNodeSchema)
  - [x] codegen 기본 구조 (serializeNode, serializeDocument)

- [x] 쉘/캔버스 분리 구조 세팅 (iframe)
  - [x] editor-shell Vite 앱 설정
  - [x] editor-canvas Vite 앱 설정
  - [x] Shell에서 Canvas를 iframe으로 임베드
  - [x] react-resizable-panels로 패널 레이아웃 구성

- [x] postMessage 통신 프로토콜 구현
  - [x] Penpal 설정
  - [x] CanvasMethods, ShellMethods 타입 정의
  - [x] Shell → Canvas 상태 동기화
  - [x] Canvas → Shell 이벤트 전달

---

## Phase 2: 기본 에디터 기능 ✅

- [x] 상태 모델 → React 렌더링
  - [x] Zustand 스토어 기본 구조
  - [x] CanvasRenderer 컴포넌트
  - [x] 컴포넌트 레지스트리 연동
  - [x] 초기 상태 동기화

- [x] 노드 선택/호버
  - [x] 선택 상태 관리 (selection)
  - [x] 호버 상태 관리 (hoveredId)
  - [x] 선택된 노드 하이라이트
  - [x] 다중 선택 지원 (Shift+클릭)
  - [x] Layers 패널 ↔ Canvas 선택 동기화

- [x] 드래그로 위치 이동
  - [x] NodeWrapper 드래그 구현
  - [x] 드래그 시 position: absolute 자동 적용
  - [ ] 스냅 기능 (그리드, 가이드라인)
  - [ ] 부모 컨테이너 내 제약

- [x] 리사이즈
  - [x] re-resizable 통합
  - [x] 8방향 리사이즈 핸들
  - [ ] aspect ratio 유지 옵션
  - [ ] 최소/최대 크기 제약

- [x] 속성 패널에서 style 편집
  - [x] Position 편집 (X, Y)
  - [x] Size 편집 (W, H)
  - [x] Fill (backgroundColor) 편집
  - [x] Border 편집 (width, radius, color, style)
  - [x] Padding/Margin 편집
  - [x] Typography 편집 (fontSize, fontWeight, color, textAlign)
  - [x] Layout 편집 (display, flexDirection, gap, alignItems, justifyContent)

- [x] Layers 패널
  - [x] 노드 트리 표시
  - [x] 접기/펼치기
  - [x] 드래그로 순서 변경 (dnd-kit)
  - [x] 가시성 토글
  - [x] 잠금 토글

---

## Phase 3: 컴포넌트/인스턴스 시스템 ✅

- [x] 컴포넌트 정의
  - [x] ComponentDefinition 타입 정의
  - [x] 선택한 노드를 Component로 변환 (createComponent)
  - [x] Toolbar에 컴포넌트 메뉴
  - [ ] Component 라이브러리 패널 (별도 UI)

- [x] 인스턴스 배치
  - [x] InstanceNode 타입 정의 (componentId 참조)
  - [x] Component 메뉴에서 Instance 생성 (createInstance)
  - [x] Instance의 overrides 지원 (setInstanceOverride)
  - [x] Canvas에서 Instance 렌더링 (renderInstance)

- [ ] 컴포넌트 ↔ 인스턴스 연동
  - [x] Component 변경 시 Instance 반영 (updateComponent)
  - [ ] Instance detach 기능
  - [x] overrides 리셋 (resetInstanceOverrides)

---

## Phase 4: Codegen (진행 중)

- [x] 상태 → JSX 코드 serialize
  - [x] serializeNode 구현
  - [x] serializeDocument 구현
  - [ ] props 포맷팅 개선
  - [ ] children 들여쓰기 개선

- [x] 코드 프리뷰 패널
  - [x] Code 탭 UI
  - [x] JSX / Component 토글
  - [x] Copy 버튼
  - [ ] 구문 하이라이팅

- [ ] 코드 내보내기
  - [x] 클립보드 복사
  - [ ] 파일 다운로드
  - [ ] Tailwind 출력 옵션

---

## 추후 작업 (MVP 이후)

- [ ] Cross-site isolation 적용
- [ ] CRDT 기반 실시간 협업
- [ ] Undo/Redo
- [ ] 키보드 단축키
- [ ] 줌/패닝 개선
- [ ] 에셋 관리 (이미지, 아이콘)
- [ ] 반응형 뷰포트
- [ ] 프로토타입 기능

---

## 현재 상태

**완료**: Phase 1, 2, 3

**진행 중**: Phase 4 (Codegen) - 기본 기능 완료, 개선 사항 남음

**미구현 (Phase 2-4 내)**:
- 스냅/가이드라인
- aspect ratio, min/max 크기 제약
- 별도 Component 라이브러리 패널
- Instance detach
- 구문 하이라이팅
- 파일 다운로드
- Tailwind 출력
