// ──────────────────────────────────────────────────────────────────────────────
// AiTop3Section — 기존 Home.jsx의 AiTop3Section을 이 컴포넌트로 교체하세요.
//
// 변경 사항:
//   - 자연어 쿼리 입력창 추가 ("어떤 방을 찾고 계세요?" 입력 → AI 개인화 추천)
//   - 쿼리 없으면 기본 이달의 추천 Top3 표시 (기존 동작 유지)
//   - 쿼리 있으면 /api/ai/rooms/recommend 에 query 파라미터 포함하여 호출
//   - 예시 쿼리 칩 클릭으로 빠른 입력 지원
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyApi } from '../../features/property/api/propertyApi';
import { toApiImageUrl } from '../../features/file/api/fileApi';
import styles from './Home.module.css';
import aiStyles from './AiTop3Section.module.css'; // 아래 CSS 파일도 추가

const ROOM_TYPE_LABEL = {
  one_room: '원룸형',
  two_room: '투룸형',
  three_room: '쓰리룸형',
  loft: '복층',
  share: '쉐어',
};
const RANK_LABEL = ['🥇 1위', '🥈 2위', '🥉 3위'];
const RANK_COLOR = ['#D9AD5B', '#9ca3af', '#cd7c2f'];

// 사용자가 클릭으로 빠르게 입력할 수 있는 예시 쿼리 칩
const EXAMPLE_QUERIES = [
  '조용하고 채광 좋은 원룸',
  '월세 50만원 이하 반려동물 가능',
  '장기거주 할인 있는 넓은 방',
  '에어컨·세탁기 풀옵션 쉐어룸',
  '남향, 보증금 낮은 방',
];

function AiRoomCard({ item, rankIdx }) {
  const navigate = useNavigate();
  return (
    <article
      className={`${styles.aiTop3Card} ${aiStyles.card}`}
      onClick={() => navigate(`/rooms/${item.roomId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/rooms/${item.roomId}`)}
    >
      <div
        className={styles.aiTop3RankBadge}
        style={{ color: RANK_COLOR[rankIdx] ?? '#374151' }}
      >
        {RANK_LABEL[rankIdx] ?? `${item.rankNo}위`}
      </div>

      <div className={styles.aiTop3ImgWrap}>
        {item.thumbnailUrl ? (
          <img
            src={toApiImageUrl(item.thumbnailUrl)}
            alt={item.buildingNm}
            className={styles.aiTop3Img}
          />
        ) : (
          <div className={styles.aiTop3ImgPlaceholder}>
            <span>🏠</span>
          </div>
        )}
      </div>

      <div className={styles.aiTop3Body}>
        <p className={styles.aiTop3Building}>{item.buildingNm}</p>
        <p className={styles.aiTop3Addr}>{item.buildingAddr}</p>

        <div className={styles.aiTop3Tags}>
          <span className={styles.aiTop3Tag}>
            {ROOM_TYPE_LABEL[item.roomType] ?? item.roomType}
          </span>
          <span className={styles.aiTop3Tag}>{item.floor}층</span>
          {item.petAllowedYn === 'Y' && (
            <span className={`${styles.aiTop3Tag} ${aiStyles.petTag}`}>
              🐾 반려동물
            </span>
          )}
        </div>

        <p className={styles.aiTop3Price}>
          월 {Number(item.rentPrice ?? 0).toLocaleString()}원
        </p>

        {/* AI 추천 이유 — 개인화 쿼리가 있으면 더 구체적인 이유가 표시됨 */}
        <div className={`${styles.aiTop3Reason} ${aiStyles.reason}`}>
          <span className={styles.aiTop3ReasonIcon}>🤖</span>
          <span className={styles.aiTop3ReasonText}>{item.aiReason}</span>
        </div>

        <div className={styles.aiTop3Stats}>
          <span>⭐ {Number(item.avgRating ?? 0).toFixed(1)}</span>
          <span>리뷰 {item.reviewCount ?? 0}건</span>
          <span>계약 {item.contractCount ?? 0}건</span>
        </div>
      </div>
    </article>
  );
}

export function AiTop3Section() {
  const navigate = useNavigate();

  // ── 상태 ────────────────────────────────────────────────────────────────────
  const [defaultItems, setDefaultItems] = useState([]); // 기본 추천 (쿼리 없음)
  // sessionStorage에서 결과·쿼리 복원 → 뒤로가기 해도 재검색 없이 즉시 표시
  const [queryItems, setQueryItems] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('aiQueryItems') || '[]');
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState(
    () => sessionStorage.getItem('aiQuery') || ''
  );
  const [activeQuery, setActiveQuery] = useState(
    () => sessionStorage.getItem('aiQuery') || ''
  );

  const [defaultLoading, setDefaultLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [defaultError, setDefaultError] = useState('');
  const [queryError, setQueryError] = useState('');

  const inputRef = useRef(null);
  const isPersonalized = !!activeQuery;

  // ── 기본 추천 로드 (마운트 시 1회) ──────────────────────────────────────────
  useEffect(() => {
    propertyApi
      .getRecommendations() // 기존 API 그대로 사용
      .then((data) => setDefaultItems(Array.isArray(data) ? data : []))
      .catch((e) =>
        setDefaultError(e?.message || '추천 정보를 불러오지 못했습니다.')
      )
      .finally(() => setDefaultLoading(false));

    // sessionStorage에 결과가 있으면 API 재호출 없이 바로 복원 (뒤로가기 최적화)
    // queryItems는 이미 useState 초기값에서 복원됨 → 추가 작업 불필요
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 개인화 추천 검색 ─────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (searchQuery) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setActiveQuery(q);
      sessionStorage.setItem('aiQuery', q);
      setQueryLoading(true);
      setQueryError('');
      setQueryItems([]);

      try {
        // Java → FastAPI로 user_query를 추가 전달
        // propertyApi.getRecommendations에 query 파라미터 추가 필요
        // (Spring: GET /api/ai/rooms/recommend?userQuery=...)
        const data = await propertyApi.getRecommendations({ userQuery: q });
        const items = Array.isArray(data) ? data : [];
        setQueryItems(items);
        sessionStorage.setItem('aiQueryItems', JSON.stringify(items));
      } catch (e) {
        setQueryError(
          e?.message || 'AI 추천에 실패했습니다. 다시 시도해주세요.'
        );
      } finally {
        setQueryLoading(false);
      }
    },
    [query]
  );

  const handleReset = () => {
    setActiveQuery('');
    setQuery('');
    setQueryItems([]);
    setQueryError('');
    sessionStorage.removeItem('aiQuery');
    sessionStorage.removeItem('aiQueryItems');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 표시할 아이템: 개인화 쿼리 있으면 queryItems, 없으면 defaultItems
  const displayItems = isPersonalized ? queryItems : defaultItems;
  const displayError = isPersonalized ? queryError : defaultError;
  const displayLoading = isPersonalized ? queryLoading : defaultLoading;

  return (
    <section className={styles.sectionWhite}>
      <div className={styles.contentWide}>
        {/* 헤더 */}
        <div className={styles.sectionHeadCenter}>
          <p className={styles.sectionEyebrow}>AI PICK · 맞춤 추천</p>
          <h2 className={styles.sectionTitle}>
            {isPersonalized ? (
              <>&ldquo;{activeQuery}&rdquo; 맞춤 추천 Top 3</>
            ) : (
              '이달의 추천 하우스 Top 3'
            )}
          </h2>
          <button
            className={styles.primaryPill}
            type="button"
            onClick={() => navigate('/rooms')}
          >
            전체 보기
          </button>
        </div>

        {/* ── AI 자연어 검색 박스 ─────────────────────────────────────────── */}
        <div className={aiStyles.searchBox}>
          <div className={aiStyles.searchRow}>
            <span className={aiStyles.searchIcon}>✨</span>
            <input
              ref={inputRef}
              type="text"
              className={aiStyles.searchInput}
              placeholder="어떤 방을 찾고 계세요? (예: 조용한 남향 원룸, 50만원 이하)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={100}
            />
            {query && (
              <button
                type="button"
                className={aiStyles.clearBtn}
                onClick={() => setQuery('')}
                aria-label="입력 지우기"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className={aiStyles.searchBtn}
              onClick={() => handleSearch()}
              disabled={!query.trim() || queryLoading}
            >
              {queryLoading ? '분석 중…' : 'AI 추천받기'}
            </button>
          </div>

          {/* 예시 쿼리 칩 */}
          <div className={aiStyles.chipRow}>
            {EXAMPLE_QUERIES.map((eq) => (
              <button
                key={eq}
                type="button"
                className={`${aiStyles.chip} ${activeQuery === eq ? aiStyles.chipActive : ''}`}
                onClick={() => {
                  setQuery(eq);
                  handleSearch(eq);
                }}
              >
                {eq}
              </button>
            ))}
          </div>

          {/* 개인화 모드 표시 & 초기화 */}
          {isPersonalized && !queryLoading && (
            <div className={aiStyles.personalizedBanner}>
              <span>
                🎯 <strong>&ldquo;{activeQuery}&rdquo;</strong> 기준으로 AI가
                맞춤 선정했습니다.
              </span>
              <button
                type="button"
                className={aiStyles.resetBtn}
                onClick={handleReset}
              >
                기본 추천으로 돌아가기
              </button>
            </div>
          )}
        </div>

        {/* ── 추천 카드 목록 ──────────────────────────────────────────────── */}
        {displayLoading && (
          <p className={styles.typeHint}>
            {isPersonalized
              ? '🤖 AI가 맞춤 방을 분석 중입니다…'
              : 'AI 추천 방을 불러오는 중입니다…'}
          </p>
        )}
        {!displayLoading && displayError && (
          <p className={styles.typeHintError}>{displayError}</p>
        )}
        {!displayLoading && !displayError && displayItems.length === 0 && (
          <p className={styles.typeHint}>아직 추천 데이터가 없습니다.</p>
        )}

        {!displayLoading && !displayError && displayItems.length > 0 && (
          <div className={styles.aiTop3Grid}>
            {displayItems.map((item) => {
              const rankIdx = (item.rankNo ?? 1) - 1;
              return (
                <AiRoomCard key={item.roomId} item={item} rankIdx={rankIdx} />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
