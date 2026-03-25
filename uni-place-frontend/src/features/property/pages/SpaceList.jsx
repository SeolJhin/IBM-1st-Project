// features/property/pages/SpaceList.jsx
import { useState, useEffect, useCallback, useReducer } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import styles from './SpaceList.module.css';
import { toApiImageUrl } from '../../file/api/fileApi';
import { formatBuildingDisplay } from '../../../shared/utils/branchLabel';

const INIT_QUERY = {
  page: 1,
  size: 12,
  buildingId: undefined,
  buildingNm: undefined,
};

function queryReducer(state, action) {
  switch (action.type) {
    case 'SET_BUILDING':
      return {
        ...state,
        buildingId: action.payload.buildingId,
        buildingNm: action.payload.buildingNm,
        page: 1,
      };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'RESET':
      return { ...INIT_QUERY };
    default:
      return state;
  }
}

function SpaceCard({ space, onClick }) {
  const options = space.spaceOptions
    ? space.spaceOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  return (
    <article
      className={styles.card}
      onClick={() => onClick(space.spaceId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(space.spaceId)}
    >
      <div className={styles.cardImg}>
        {space.thumbnailUrl ? (
          <img src={toApiImageUrl(space.thumbnailUrl)} alt={space.spaceNm} />
        ) : (
          <div className={styles.cardImgPh}>🛋️</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.buildingName}>{formatBuildingDisplay(space)}</p>
        <h3 className={styles.spaceNm}>{space.spaceNm}</h3>
        <div className={styles.spaceMeta}>
          <span>📍 {space.spaceFloor}층</span>
          <span>👥 최대 {space.spaceCapacity}명</span>
        </div>
        {options.length > 0 && (
          <div className={styles.spaceTags}>
            {options.slice(0, 4).map((o) => (
              <span key={o} className={styles.spaceTag}>
                {o}
              </span>
            ))}
            {options.length > 4 && (
              <span className={styles.spaceTag}>+{options.length - 4}</span>
            )}
          </div>
        )}
        <p className={styles.addr}>{space.buildingAddr}</p>
      </div>
    </article>
  );
}

export default function SpaceList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, dispatch] = useReducer(queryReducer, {
    ...INIT_QUERY,
    // URL 파라미터로 초기값 설정 (BuildingDetail에서 넘어올 때)
    buildingId: searchParams.get('buildingId')
      ? Number(searchParams.get('buildingId'))
      : undefined,
    buildingNm: searchParams.get('buildingNm') || undefined,
  });

  const [spaces, setSpaces] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 건물 목록 (드롭다운용)
  const [buildings, setBuildings] = useState([]);
  const [buildingLoading, setBuildingLoading] = useState(false);

  useEffect(() => {
    setBuildingLoading(true);
    propertyApi
      .getBuildings({ page: 1, size: 50 })
      .then((data) => setBuildings(data?.content ?? []))
      .catch(() => setBuildings([]))
      .finally(() => setBuildingLoading(false));
  }, []);

  const fetchSpaces = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (q.buildingId) {
        // 특정 건물의 공용공간만
        data = await propertyApi.getSpaces(q.buildingId, {
          page: q.page,
          size: q.size,
        });
      } else {
        // 전체 공용공간
        data = await propertyApi.getSpacesAll({ page: q.page, size: q.size });
      }
      setSpaces(data?.content ?? []);
      setPagination({
        page: data?.page ?? 1,
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
      });
    } catch (err) {
      setError(err?.message || '공용공간 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces(query);
  }, [fetchSpaces, query]);

  const handleBuildingSelect = (e) => {
    const val = e.target.value;
    if (!val) {
      dispatch({
        type: 'SET_BUILDING',
        payload: { buildingId: undefined, buildingNm: undefined },
      });
    } else {
      const found = buildings.find((b) => String(b.buildingId) === String(val));
      dispatch({
        type: 'SET_BUILDING',
        payload: { buildingId: Number(val), buildingNm: found?.buildingNm },
      });
    }
  };

  const pages = (() => {
    const cur = query.page;
    const total = pagination.totalPages;
    const from = Math.max(1, cur - 2);
    const to = Math.min(total, cur + 2);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  })();

  return (
    <div className={styles.page}>
      <Header />

      {/* ── 페이지 헤더 ── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <p className={styles.pageKicker}>COMMON SPACE</p>
          <h1 className={styles.pageTitle}>공용공간</h1>
          <p className={styles.pageSub}>
            {query.buildingNm ? (
              <>
                <strong style={{ color: '#d9ad5b' }}>{query.buildingNm}</strong>
                의 공용공간 <strong>{pagination.totalElements}</strong>개
              </>
            ) : (
              <>
                총 <strong>{pagination.totalElements}</strong>개의 공용공간이
                있습니다
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── 건물 선택 바 ── */}
      <div className={styles.buildingBar}>
        <div className={styles.buildingBarInner}>
          <span className={styles.buildingBarLabel}>🏢 건물 선택</span>
          <div className={styles.buildingSelectWrap}>
            {buildingLoading ? (
              <span className={styles.buildingLoading}>
                건물 목록 로딩 중...
              </span>
            ) : (
              <select
                className={styles.buildingSelect}
                value={query.buildingId ?? ''}
                onChange={handleBuildingSelect}
              >
                <option value="">전체 건물</option>
                {buildings.map((b) => (
                  <option key={b.buildingId} value={b.buildingId}>
                    {formatBuildingDisplay(b)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 건물 선택 시 해당 건물 상세 보기 버튼 */}
          {query.buildingId && (
            <button
              className={styles.buildingDetailBtn}
              onClick={() => navigate(`/buildings/${query.buildingId}`)}
              type="button"
            >
              🏢 건물 상세 보기 →
            </button>
          )}

          {query.buildingId && (
            <button
              className={styles.resetBuildingBtn}
              onClick={() => dispatch({ type: 'RESET' })}
              type="button"
            >
              전체 보기
            </button>
          )}
        </div>
      </div>

      {/* ── 그리드 ── */}
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>공용공간 목록을 불러오는 중...</p>
          </div>
        )}
        {error && !loading && (
          <div className={styles.errorBox}>
            <p>⚠️ {error}</p>
            <button onClick={() => fetchSpaces(query)}>다시 시도</button>
          </div>
        )}
        {!loading && !error && spaces.length === 0 && (
          <div className={styles.emptyBox}>
            <p className={styles.emptyIcon}>🛋️</p>
            <p className={styles.emptyText}>
              {query.buildingId
                ? '이 건물에 등록된 공용공간이 없습니다.'
                : '등록된 공용공간이 없습니다.'}
            </p>
            {query.buildingId && (
              <button
                className={styles.emptyResetBtn}
                onClick={() => dispatch({ type: 'RESET' })}
              >
                전체 보기
              </button>
            )}
          </div>
        )}
        {!loading && spaces.length > 0 && (
          <div className={styles.grid}>
            {spaces.map((space) => (
              <SpaceCard
                key={space.spaceId}
                space={space}
                onClick={(id) => navigate(`/spaces/${id}`)}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={query.page === 1}
              onClick={() =>
                dispatch({ type: 'SET_PAGE', payload: query.page - 1 })
              }
            >
              ‹
            </button>
            {pages.map((p) => (
              <button
                key={p}
                className={`${styles.pageBtn} ${p === query.page ? styles.pageBtnActive : ''}`}
                onClick={() => dispatch({ type: 'SET_PAGE', payload: p })}
              >
                {p}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              disabled={query.page === pagination.totalPages}
              onClick={() =>
                dispatch({ type: 'SET_PAGE', payload: query.page + 1 })
              }
            >
              ›
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
