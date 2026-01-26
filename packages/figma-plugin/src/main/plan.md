# 구현 계획 (체크포인트)

## 전제

- boundVariable 처리는 Extract → Normalize 흐름 안에서만 수행한다.
- build 단계는 단일 노드 기준으로 처리하고 재귀는 node/index.ts에서 유지한다.

## 진행 가이드라인(절대 수정하지 말것)

- 각 체크포인트는 순서대로만 진행한다.
- 체크포인트 1개 구현이 끝날 때마다 타입 체크와 구조 검토를 진행한다.
- 결과를 공유하고 내 동의를 받은 뒤에만 다음 체크포인트로 이동한다.

## 체크포인트

- [x]   1. 정규화 타입 스키마 확정 (`NormalizedStyle`, `NormalizedLayout`, `NormalizedFills`, `NormalizedEffects`, `NormalizedStroke`, `NormalizedText`)
- [x]   2. boundVariable 참조 수집 경로 확정 및 추출 단계 보강
    - fills/effects/stroke/text에서 boundVariables를 누락 없이 포함
    - 텍스트는 `getStyledTextSegments()` 결과의 boundVariables 포함
- [x]   3. 변수 레지스트리/해결기 설계
    - 수집된 variable id → 이름/컬렉션/모드 매핑
    - 캐시 전략 정의
- [x]   4. layout 정규화 함수 구현
    - Auto Layout/Grid/Absolute를 단일 스키마로 통일
    - padding/spacing/align/constraints 정규화
- [x]   5. fills 정규화 함수 구현
    - solid/gradient/image 통합 모델
    - boundVariable 존재 시 tokenRef로 치환 + fallback 값 유지
- [x]   6. effects 정규화 함수 구현
    - shadow/blur 통합 모델
    - boundVariable 존재 시 tokenRef로 치환 + fallback 값 유지
- [x]   7. stroke 정규화 함수 구현
    - strokeWeight/individual weights 통합
    - corner/rectangleCorner/vectorNetwork 표준화
- [x]   8. text 정규화 함수 구현
    - characters → runs[] 구조로 변환
    - boundVariable 유지/치환 규칙 적용
- [x]   9. normalizeStyle 합성 함수 구현
    - ExtractedStyle → NormalizedStyle
- [x]   10. Extract와 Normalize 연결
    - LLM/IR은 정규화 결과만 사용하도록 고정
- [x]   11. IR 타입 정의
    - NormalizedStyle 기반 IR 스키마 확정
- [x]   12. 단일 노드 build 구현 (extract → normalize → refs)
    - instanceRef/tokenRef/assets를 단일 노드에서 생성
    - Instance의 componentProperties 보존
- [ ]   13. Build 결과 기반 LLM 입력 패키지 생성기 구현
    - 요약 + 핵심 노드 + 토큰/자산/컴포넌트 참조 구성
- [ ]   14. 검증/테스트
    - normalize 함수별 단위 테스트
    - Extract → Normalize → IR → Payload 통합 테스트
