# Transplant Audit

기준 경로:
- 소스 A: `src2222222222222`
- 소스 B: `Skote_React_Laravel_v3.0.0`
- 대상: `src` (현재 프로젝트)

조사 시점 요약:
- `src2222222222222` 파일 수: 96
- `Skote_React_Laravel_v3.0.0` 파일 수: 2485
- 현재 `src` 파일 수: 189
- `src2222222222222` 기준 현재 `src`에 없는 파일: 83

---

## 1) 즉시 이식 가능 (우선순위 A)

아래는 의존성/구조 충돌이 낮아서 바로 가져오기 쉬운 항목.

### A-1. 공통 유틸/라우팅 보강
- `src2222222222222/ScrolltoTop.jsx`
  - 추천 이식 위치: `src/shared/components/ScrollToTop.jsx` 또는 `src/app/router` 하위
  - 상태: 거의 무수정 이식 가능

- `src2222222222222/pages/site/realtime/useRealtimeAnimations.js`
  - 추천 이식 위치: `src/features/realtime/hooks/useRealtimeAnimations.js`
  - 상태: 무수정 또는 네이밍만 조정
  - 비고: 카운트업/스태거/프로그레스/자동갱신 훅 모음으로 재사용 가치 높음

- `src2222222222222/pages/site/components/PageHeader.jsx`
  - 추천 이식 위치: `src/shared/components/PageHeader/PageHeader.jsx`
  - 상태: 스타일 인라인 -> CSS 모듈로 분리 권장

- `src2222222222222/data/mock.js`
  - 추천 이식 위치: `src/shared/mocks/eventProgramMock.js`
  - 상태: 개발 더미데이터로 이식 가능

### A-2. 이미 현재 src에 반영된/중복
- `src2222222222222/shared/utils/buildFormData.js`
- `src2222222222222/shared/constants/routes.js`
- `src2222222222222/shared/constants/roles.js`
- `src2222222222222/app/router/guards/RequireAuth.jsx`
- `src2222222222222/app/router/guards/RequireRole.jsx`
- `src2222222222222/app/http/*` 일부는 현재 프로젝트에 이미 동일/상위 버전 존재

---

## 2) 부분 이식 권장 (우선순위 B)

기능 단위로는 유용하지만, 현재 도메인/백엔드 스펙에 맞춘 매핑이 필요한 항목.

### B-1. Event 번들
- `src2222222222222/pages/site/event/*`
- `src2222222222222/pages/site/event/_components/EventList.jsx`

이식 권장 대상 위치:
- `src/features/event/pages/*`
- `src/features/event/components/*`

주의:
- 원본은 `/api/events` 전제. 현재 백엔드에 해당 엔드포인트 없음.
- 현재 프로젝트 도메인(건물/룸/예약/공지)에 맞게 API 어댑터 교체 필요.

### B-2. Program/Contest 번들
- `src2222222222222/pages/site/program/*`
- `src2222222222222/pages/site/program/contest/*`
- `src2222222222222/pages/site/program/_components/ProgramList.jsx`
- `src2222222222222/pages/site/constants/programConstants.js`

이식 권장 대상 위치:
- `src/features/program/pages/*`
- `src/features/program/components/*`

주의:
- 원본은 `/api/programs`, `/api/program-applies` 전제.
- 현재 백엔드 스펙과 경로 불일치.

### B-3. Realtime 화면 번들
- `src2222222222222/pages/site/realtime/CheckinStatus.jsx`
- `src2222222222222/pages/site/realtime/Dashboard.jsx`
- `src2222222222222/pages/site/realtime/RealtimeEventSelector.jsx`
- `src2222222222222/pages/site/realtime/VoteStatus.jsx`
- `src2222222222222/pages/site/realtime/WaitingStatus.jsx`

이식 권장 대상 위치:
- `src/features/realtime/pages/*`
- `src/features/realtime/components/*`

주의:
- 데이터 소스/폴링 정책을 현재 API 스펙으로 교체 필요.

### B-4. 사이트 정보성 페이지 묶음
- `src2222222222222/pages/site/info/*`
- `src2222222222222/pages/site/policy/*`
- `src2222222222222/pages/site/about/*`
- `src2222222222222/pages/site/guide/*`

이식 권장 대상 위치:
- `src/features/siteinfo/pages/*` 또는 `src/shared/pages/*`

주의:
- 텍스트 인코딩 깨짐(모지바케) 다수 발견 -> 문자열 전면 정리 필요.

---

## 3) Skote에서 가져올 가치가 있는 항목 (우선순위 B/C)

Skote는 라라벨+Vite+Reactstrap+Redux-Saga 템플릿이라 전체 이식은 비권장.
다만 일부 조각은 이식 가치 있음.

### C-1. 비교적 경량 유틸
- `Skote_React_Laravel_v3.0.0/Admin/resources/js/components/Common/withRouter.jsx`
  - React Router v6 호환 HOC
  - 현재 함수형 훅 중심이면 필요성 낮음

- `Skote_React_Laravel_v3.0.0/Admin/resources/js/components/Common/searchFile.jsx`
  - 객체 배열 문자열 필드 검색 유틸
  - 현재 `shared/utils`로 이동해 재사용 가능

- `Skote_React_Laravel_v3.0.0/Admin/resources/js/helpers/jwt-token-access/auth-token-header.js`
  - 로컬스토리지 토큰 헤더 헬퍼
  - 현재 `tokenStore` 기반이라 참고만 권장

### C-2. 구조 참고용 (직접 이식 비권장)
- `components/Common/TableContainer.jsx`
- `components/Common/Pagination.jsx`
- `components/Common/DeleteModal.jsx`
- `components/VerticalLayout/*`
- `routes/allRoutes.jsx`, `routes/AuthProtected.jsx`

비권장 이유:
- `reactstrap`, `@tanstack/react-table`, `redux-saga` 등 의존성 다수 필요
- 현 프로젝트(CRA + CSS Modules + feature 기반 구조)와 아키텍처 차이 큼

### C-3. 데이터/샘플 소스
- `common/data/*`
  - 대시보드 샘플 데이터셋으로는 활용 가능
  - 도메인 직접 연관도 낮음

---

## 4) 이식 비권장 (우선순위 D)

### D-1. Skote 전체 store/saga 체계
- `Skote.../resources/js/store/**`
  - 현재 프로젝트는 이미 feature별 API/hook 구조가 있고, 전체 상태관리 전환 비용이 큼

### D-2. Skote 인증/가짜백엔드 체계
- `helpers/fakebackend_helper.js`
- `helpers/AuthType/fakeBackend.js`
- `helpers/firebase_helper.js`
- `helpers/api_helper.js`, `helpers/url_helper.js`
  - 현재 실제 백엔드 연동 구조와 충돌

### D-3. src222의 문자열 인코딩 깨짐 파일들
- 특히 `pages/site/components/SiteHeader.jsx`, `pages/site/constants/programConstants.js` 등
  - 로직보다 문자열 정리 비용이 큼

---

## 5) 실제 이식 추천 순서

1. `src222`에서 공통 훅/유틸 먼저 이식
   - `ScrolltoTop.jsx`, `useRealtimeAnimations.js`, `PageHeader.jsx`, `mock.js`
2. `src222`의 Realtime 화면 이식 (UI 중심)
3. Event/Program 화면은 현재 백엔드 스펙에 맞게 API 어댑터 작성 후 이식
4. Skote는 `searchFile.jsx` 같은 단일 유틸만 선별 이식

---

## 6) 참고: 현재 프로젝트 구조와의 매핑

추천 매핑:
- `src222/pages/site/*` -> `src/features/*/pages`
- `src222/pages/site/*/_components/*` -> `src/features/*/components`
- `src222/pages/site/constants/*` -> `src/features/*/constants`
- `src222/pages/site/realtime/useRealtimeAnimations.js` -> `src/features/realtime/hooks`
- `Skote/components/Common/*` -> `src/shared/components` (의존성 검증 후)

