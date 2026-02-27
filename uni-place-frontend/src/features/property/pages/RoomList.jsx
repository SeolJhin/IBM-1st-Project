// features/property/pages/RoomList.jsx
import { useState, useEffect, useCallback, useReducer } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import styles from './RoomList.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationList from '../../reservation/pages/TourReservationList';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';

// ─── 방 쿼리 ──────────────────────────────────────────────────
const INIT_QUERY = {
  page: 1,
  size: 12,
  sort: 'roomId',
  direct: 'DESC',
  rentType: undefined,
  roomSt: undefined,
  sunDirection: undefined,
  minRentPrice: undefined,
  maxRentPrice: undefined,
  minDeposit: undefined,
  maxDeposit: undefined,
  minRoomCapacity: undefined,
  maxRoomCapacity: undefined,
  buildingNm: undefined,
};
function queryReducer(state, action) {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, ...action.payload, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload, page: 1 };
    case 'RESET':
      return { ...INIT_QUERY };
    default:
      return state;
  }
}

// ─── 공용공간 쿼리 ────────────────────────────────────────────
const SPACE_INIT = {
  page: 1,
  size: 12,
  buildingId: undefined,
  buildingNm: undefined,
};
function spaceReducer(state, action) {
  switch (action.type) {
    case 'SET_BUILDING':
      return { ...state, ...action.payload, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'RESET':
      return { ...SPACE_INIT };
    default:
      return state;
  }
}

// ─── 별점 ────────────────────────────────────────────────────
function StarRating({ value = 0, count = 0 }) {
  return (
    <div className={styles.starRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={
            s <= Math.round(value) ? styles.starFilled : styles.starEmpty
          }
        >
          ★
        </span>
      ))}
      <span className={styles.starValue}>
        {value > 0 ? value.toFixed(1) : '-'}
      </span>
      {count > 0 && <span className={styles.starCount}>({count})</span>}
    </div>
  );
}

// ─── 방 카드 ─────────────────────────────────────────────────
function RoomCard({ room, onClick }) {
  const rentLabel = { monthly_rent: '월세', stay: '단기' };
  const stLabel = {
    available: '입주가능',
    reserved: '예약중',
    contracted: '계약중',
    repair: '수리중',
    cleaning: '청소중',
  };
  const stClass = {
    available: styles.statusAvailable,
    reserved: styles.statusOccupied,
    contracted: styles.statusOccupied,
    repair: styles.statusMaintenance,
    cleaning: styles.statusMaintenance,
  };
  const dirLabel = { s: '남향', n: '북향', e: '동향', w: '서향' };
  return (
    <article
      className={styles.card}
      onClick={() => onClick(room.roomId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(room.roomId)}
    >
      <div className={styles.cardImg}>
        {room.thumbnailUrl ? (
          <img
            src={room.thumbnailUrl}
            alt={`${room.buildingNm} ${room.roomNo}호`}
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <span>🏠</span>
          </div>
        )}
        <span className={`${styles.statusBadge} ${stClass[room.roomSt] || ''}`}>
          {stLabel[room.roomSt] || room.roomSt}
        </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <p className={styles.buildingName}>{room.buildingNm}</p>
          <span className={styles.roomNo}>
            {room.roomNo}호 · {room.floor}층
          </span>
        </div>
        <h3 className={styles.cardTitle}>
          {rentLabel[room.rentType] || room.rentType} ·{' '}
          {room.roomSize ? `${room.roomSize}㎡` : '면적 미정'}
        </h3>
        <div className={styles.priceRow}>
          <span className={styles.priceDeposit}>
            보증금 {room.deposit ? Number(room.deposit).toLocaleString() : '-'}
            원
          </span>
          <span className={styles.priceSep}>/</span>
          <span className={styles.priceRent}>
            월 {room.rentPrice ? Number(room.rentPrice).toLocaleString() : '-'}
            원
          </span>
        </div>
        <div className={styles.cardMeta}>
          <span>👥 {room.roomCapacity}인</span>
          <span>📅 최소 {room.rentMin}개월</span>
          {room.sunDirection && (
            <span>🌤 {dirLabel[room.sunDirection] || room.sunDirection}</span>
          )}
        </div>
        <div className={styles.cardRating}>
          {room._rating !== undefined ? (
            <StarRating value={room._rating} count={room._reviewCount} />
          ) : (
            <span className={styles.ratingLoading}>별점 불러오는 중…</span>
          )}
        </div>
        <p className={styles.addr}>{room.buildingAddr}</p>
      </div>
    </article>
  );
}

// ─── 공용공간 카드 ────────────────────────────────────────────
function SpaceCard({ space, onClick }) {
  const opts = space.spaceOptions
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
          <img src={space.thumbnailUrl} alt={space.spaceNm} />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <span>🛋️</span>
          </div>
        )}
      </div>
      <div className={styles.cardBody}>
        <p className={styles.buildingName}>{space.buildingNm}</p>
        <h3 className={styles.cardTitle}>{space.spaceNm}</h3>
        <div className={styles.cardMeta}>
          <span>📍 {space.spaceFloor}층</span>
          <span>👥 최대 {space.spaceCapacity}명</span>
        </div>
        {opts.length > 0 && (
          <div className={styles.spaceTags}>
            {opts.slice(0, 4).map((o) => (
              <span key={o} className={styles.spaceTag}>
                {o}
              </span>
            ))}
            {opts.length > 4 && (
              <span className={styles.spaceTag}>+{opts.length - 4}</span>
            )}
          </div>
        )}
        <p className={styles.addr}>{space.buildingAddr}</p>
      </div>
    </article>
  );
}

// ─── 방 필터 패널 ─────────────────────────────────────────────
function FilterPanel({ query, dispatch, buildings, buildingLoading }) {
  const [local, setLocal] = useState({
    minRentPrice: '',
    maxRentPrice: '',
    minDeposit: '',
    maxDeposit: '',
    minRoomCapacity: '',
    maxRoomCapacity: '',
  });
  useEffect(() => {
    setLocal({
      minRentPrice: query.minRentPrice ?? '',
      maxRentPrice: query.maxRentPrice ?? '',
      minDeposit: query.minDeposit ?? '',
      maxDeposit: query.maxDeposit ?? '',
      minRoomCapacity: query.minRoomCapacity ?? '',
      maxRoomCapacity: query.maxRoomCapacity ?? '',
    });
  }, [
    query.minRentPrice,
    query.maxRentPrice,
    query.minDeposit,
    query.maxDeposit,
    query.minRoomCapacity,
    query.maxRoomCapacity,
  ]);

  const sel = (key) => (e) =>
    dispatch({
      type: 'SET_FILTER',
      payload: { [key]: e.target.value || undefined },
    });
  const setL = (key) => (e) =>
    setLocal((p) => ({ ...p, [key]: e.target.value }));
  const cNum = (key) => () => {
    const v = local[key];
    dispatch({
      type: 'SET_FILTER',
      payload: { [key]: v === '' ? undefined : Number(v) },
    });
  };
  const kNum = (key) => (e) => {
    if (e.key === 'Enter') cNum(key)();
  };

  return (
    <aside className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <h2 className={styles.filterTitle}>필터</h2>
        <button
          className={styles.resetBtn}
          onClick={() => dispatch({ type: 'RESET' })}
          type="button"
        >
          초기화
        </button>
      </div>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>임대 유형</h3>
        <select
          className={styles.filterSelect}
          value={query.rentType || ''}
          onChange={sel('rentType')}
        >
          <option value="">전체</option>
          <option value="monthly_rent">월세</option>
          <option value="stay">단기</option>
        </select>
      </section>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>입주 상태</h3>
        <select
          className={styles.filterSelect}
          value={query.roomSt || ''}
          onChange={sel('roomSt')}
        >
          <option value="">전체</option>
          <option value="available">입주가능</option>
          <option value="reserved">예약중</option>
          <option value="contracted">계약중</option>
          <option value="repair">수리중</option>
          <option value="cleaning">청소중</option>
        </select>
      </section>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>월세 범위 (원)</h3>
        <p className={styles.filterHint}>
          입력 후 Enter 또는 다른 곳 클릭 시 적용
        </p>
        <div className={styles.rangeRow}>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="최소"
            value={local.minRentPrice}
            onChange={setL('minRentPrice')}
            onBlur={cNum('minRentPrice')}
            onKeyDown={kNum('minRentPrice')}
          />
          <span className={styles.rangeSep}>~</span>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="최대"
            value={local.maxRentPrice}
            onChange={setL('maxRentPrice')}
            onBlur={cNum('maxRentPrice')}
            onKeyDown={kNum('maxRentPrice')}
          />
        </div>
      </section>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>보증금 범위 (원)</h3>
        <p className={styles.filterHint}>
          입력 후 Enter 또는 다른 곳 클릭 시 적용
        </p>
        <div className={styles.rangeRow}>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="최소"
            value={local.minDeposit}
            onChange={setL('minDeposit')}
            onBlur={cNum('minDeposit')}
            onKeyDown={kNum('minDeposit')}
          />
          <span className={styles.rangeSep}>~</span>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="최대"
            value={local.maxDeposit}
            onChange={setL('maxDeposit')}
            onBlur={cNum('maxDeposit')}
            onKeyDown={kNum('maxDeposit')}
          />
        </div>
      </section>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>수용 인원</h3>
        <div className={styles.rangeRow}>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="최소"
            min={1}
            value={local.minRoomCapacity}
            onChange={setL('minRoomCapacity')}
            onBlur={cNum('minRoomCapacity')}
            onKeyDown={kNum('minRoomCapacity')}
          />
          <span className={styles.rangeSep}>~</span>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="최대"
            min={1}
            value={local.maxRoomCapacity}
            onChange={setL('maxRoomCapacity')}
            onBlur={cNum('maxRoomCapacity')}
            onKeyDown={kNum('maxRoomCapacity')}
          />
        </div>
      </section>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>채광</h3>
        <select
          className={styles.filterSelect}
          value={query.sunDirection || ''}
          onChange={sel('sunDirection')}
        >
          <option value="">전체</option>
          <option value="s">남향</option>
          <option value="n">북향</option>
          <option value="e">동향</option>
          <option value="w">서향</option>
        </select>
      </section>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>건물명</h3>
        {buildingLoading ? (
          <p style={{ fontSize: 12, color: '#9a8c70', margin: 0 }}>
            건물 목록 로딩 중...
          </p>
        ) : (
          <select
            className={styles.filterSelect}
            value={query.buildingNm || ''}
            onChange={(e) => {
              dispatch({
                type: 'SET_FILTER',
                payload: { buildingNm: e.target.value || undefined },
              });
            }}
          >
            <option value="">전체 건물</option>
            {buildings.map((b) => (
              <option key={b.buildingId} value={b.buildingNm}>
                {b.buildingNm}
              </option>
            ))}
          </select>
        )}
      </section>
    </aside>
  );
}

// ─── 공용공간 필터 패널 ────────────────────────────────────────
function SpaceFilterPanel({ query, dispatch, buildings, buildingLoading }) {
  return (
    <aside className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <h2 className={styles.filterTitle}>필터</h2>
        {query.buildingId && (
          <button
            className={styles.resetBtn}
            onClick={() => dispatch({ type: 'RESET' })}
            type="button"
          >
            초기화
          </button>
        )}
      </div>
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>건물 선택</h3>
        {buildingLoading ? (
          <p style={{ fontSize: 12, color: '#9a8c70', margin: 0 }}>
            건물 목록 로딩 중...
          </p>
        ) : (
          <select
            className={styles.filterSelect}
            value={query.buildingId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val)
                return dispatch({
                  type: 'SET_BUILDING',
                  payload: { buildingId: undefined, buildingNm: undefined },
                });
              const found = buildings.find(
                (b) => String(b.buildingId) === String(val)
              );
              dispatch({
                type: 'SET_BUILDING',
                payload: {
                  buildingId: Number(val),
                  buildingNm: found?.buildingNm,
                },
              });
            }}
          >
            <option value="">전체 건물</option>
            {buildings.map((b) => (
              <option key={b.buildingId} value={b.buildingId}>
                {b.buildingNm}
              </option>
            ))}
          </select>
        )}
      </section>
    </aside>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function RoomList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tourListOpen, setTourListOpen] = useState(false);
  const [tourCreateOpen, setTourCreateOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.tab || 'rooms';
  });

  // 건물 목록 상태
  const [buildingsList, setBuildingsList] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [buildingsPage, setBuildingsPage] = useState(1);
  const [buildingsTotalPages, setBuildingsTotalPages] = useState(1);
  const [buildingsTotalElements, setBuildingsTotalElements] = useState(0);

  /* ── 방 상태 ── */
  const [query, dispatch] = useReducer(queryReducer, INIT_QUERY);
  const [rooms, setRooms] = useState([]);
  const [roomPag, setRP] = useState({
    page: 1,
    totalPages: 1,
    totalElements: 0,
  });
  const [roomLoading, setRL] = useState(false);
  const [roomError, setRE] = useState(null);

  /* ── 공용공간 상태 ── */
  const [spaceQ, spaceD] = useReducer(spaceReducer, SPACE_INIT);
  const [spaces, setSpaces] = useState([]);
  const [spacePag, setSP] = useState({
    page: 1,
    totalPages: 1,
    totalElements: 0,
  });
  const [spaceLoading, setSL] = useState(false);
  const [spaceError, setSE] = useState(null);
  const [buildings, setBldgs] = useState([]);
  const [bldgLoading, setBL] = useState(false);
  const [bldgLoaded, setBldgLoaded] = useState(false);

  /* ── 방 fetch ── */
  const fetchRooms = useCallback(async (q) => {
    setRL(true);
    setRE(null);
    try {
      const data = await propertyApi.getRoomsAll(q);
      const content = data?.content ?? [];
      const enriched = await Promise.all(
        content.map(async (room) => {
          try {
            const res = await fetch(`/reviews/rooms/${room.roomId}/summary`);
            const json = await res.json();
            return {
              ...room,
              _rating: json.data?.avgRating ?? 0,
              _reviewCount: json.data?.reviewCount ?? 0,
            };
          } catch {
            return { ...room, _rating: 0, _reviewCount: 0 };
          }
        })
      );
      setRooms(enriched);
      setRP({
        page: data?.page ?? 1,
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
      });
    } catch (err) {
      setRE(err?.message || '방 목록을 불러올 수 없습니다.');
    } finally {
      setRL(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms(query);
  }, [fetchRooms, query]);

  /* ── 공용공간 fetch ── */
  const fetchSpaces = useCallback(async (q) => {
    setSL(true);
    setSE(null);
    try {
      const data = q.buildingId
        ? await propertyApi.getSpaces(q.buildingId, {
            page: q.page,
            size: q.size,
          })
        : await propertyApi.getSpacesAll({ page: q.page, size: q.size });
      setSpaces(data?.content ?? []);
      setSP({
        page: data?.page ?? 1,
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? 0,
      });
    } catch (err) {
      setSE(err?.message || '공용공간 목록을 불러올 수 없습니다.');
    } finally {
      setSL(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'spaces') fetchSpaces(spaceQ);
  }, [fetchSpaces, spaceQ, activeTab]);

  /* 건물 목록 – 건물 탭 첫 진입 시 */
  useEffect(() => {
    if (activeTab === 'buildings') {
      setBuildingsLoading(true);
      propertyApi
        .getBuildings({ page: buildingsPage, size: 12 })
        .then((d) => {
          setBuildingsList(d?.content ?? []);
          setBuildingsTotalPages(d?.totalPages ?? 1);
          setBuildingsTotalElements(d?.totalElements ?? 0);
        })
        .catch((e) =>
          setBuildingsError(e?.message || '건물 목록을 불러올 수 없습니다.')
        )
        .finally(() => setBuildingsLoading(false));
    }
  }, [activeTab, buildingsPage]);

  /* 건물 목록 – 공용공간 탭 또는 방 탭 첫 진입 시 1회 */
  useEffect(() => {
    if ((activeTab === 'spaces' || activeTab === 'rooms') && !bldgLoaded) {
      setBL(true);
      propertyApi
        .getBuildings({ page: 1, size: 50 })
        .then((d) => {
          setBldgs(d?.content ?? []);
          setBldgLoaded(true);
        })
        .catch(() => {})
        .finally(() => setBL(false));
    }
  }, [activeTab, bldgLoaded]);

  const roomPages = Array.from({ length: roomPag.totalPages }, (_, i) => i + 1);
  const spacePages = Array.from(
    { length: spacePag.totalPages },
    (_, i) => i + 1
  );

  return (
    <div className={styles.page}>
      <Header />

      {/* 페이지 헤더 */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <p className={styles.pageKicker}>FIND YOUR ROOM</p>
          <h1 className={styles.pageTitle}>방 찾기</h1>
          <p className={styles.pageSub}>
            총{' '}
            <strong>
              {activeTab === 'rooms'
                ? roomPag.totalElements
                : activeTab === 'spaces'
                  ? spacePag.totalElements
                  : buildingsTotalElements}
            </strong>
            개의{' '}
            {activeTab === 'rooms'
              ? '방이'
              : activeTab === 'spaces'
                ? '공용공간이'
                : '건물이'}{' '}
            있습니다
          </p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* 필터 패널 */}
        {activeTab === 'rooms' ? (
          <FilterPanel
            query={query}
            dispatch={dispatch}
            buildings={buildings}
            buildingLoading={bldgLoading}
          />
        ) : activeTab === 'spaces' ? (
          <SpaceFilterPanel
            query={spaceQ}
            dispatch={spaceD}
            buildings={buildings}
            buildingLoading={bldgLoading}
          />
        ) : (
          <aside className={styles.filterPanel}>
            <div className={styles.filterHeader}>
              <h2 className={styles.filterTitle}>건물 목록</h2>
            </div>
            <p
              style={{
                fontSize: 13,
                color: '#9a8c70',
                margin: 0,
                padding: '0 4px',
              }}
            >
              건물을 클릭하면 상세 정보를 확인할 수 있습니다.
            </p>
          </aside>
        )}

        <main className={styles.main}>
          {/* ════ 탭 바 ════ */}
          <div className={styles.tabBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'rooms' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              <span className={styles.tabIcon}>🏠</span>
              <span className={styles.tabLabel}>방 목록</span>
              <span className={styles.tabCount}>{roomPag.totalElements}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'spaces' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('spaces')}
            >
              <span className={styles.tabIcon}>🛋️</span>
              <span className={styles.tabLabel}>공용공간</span>
              <span className={styles.tabCount}>{spacePag.totalElements}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'buildings' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('buildings')}
            >
              <span className={styles.tabIcon}>🏢</span>
              <span className={styles.tabLabel}>건물 목록</span>
              <span className={styles.tabCount}>{buildingsTotalElements}</span>
            </button>
          </div>

          {/* ════ 방 목록 ════ */}
          {activeTab === 'rooms' && (
            <>
              <div className={styles.sortRow}>
                <span className={styles.resultCount}>
                  {roomPag.totalElements}개 결과
                </span>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <button
                    type="button"
                    style={{
                      background: '#ba8037',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onClick={() => setTourListOpen(true)}
                  >
                    📋 방문예약 조회
                  </button>
                  <select
                    className={styles.sortSelect}
                    value={query.sort}
                    onChange={(e) =>
                      dispatch({ type: 'SET_SORT', payload: e.target.value })
                    }
                  >
                    <option value="roomId">최신순</option>
                    <option value="rentPrice">월세 낮은순</option>
                    <option value="deposit">보증금 낮은순</option>
                    <option value="roomSize">면적순</option>
                  </select>
                </div>
              </div>
              {roomLoading && (
                <div className={styles.loadingWrap}>
                  <div className={styles.spinner} />
                  <p>방 목록을 불러오는 중...</p>
                </div>
              )}
              {roomError && !roomLoading && (
                <div className={styles.errorBox}>
                  <p>⚠️ {roomError}</p>
                  <button onClick={() => fetchRooms(query)}>다시 시도</button>
                </div>
              )}
              {!roomLoading && !roomError && rooms.length === 0 && (
                <div className={styles.emptyBox}>
                  <p className={styles.emptyIcon}>🏠</p>
                  <p className={styles.emptyText}>조건에 맞는 방이 없습니다.</p>
                  <button
                    className={styles.emptyResetBtn}
                    onClick={() => dispatch({ type: 'RESET' })}
                  >
                    필터 초기화
                  </button>
                </div>
              )}
              {!roomLoading && rooms.length > 0 && (
                <div className={styles.grid}>
                  {rooms.map((r) => (
                    <RoomCard
                      key={r.roomId}
                      room={r}
                      onClick={(id) => navigate(`/rooms/${id}`)}
                    />
                  ))}
                </div>
              )}
              {roomPag.totalPages > 1 && (
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
                  {roomPages.map((p) => (
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
                    disabled={query.page === roomPag.totalPages}
                    onClick={() =>
                      dispatch({ type: 'SET_PAGE', payload: query.page + 1 })
                    }
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}

          {/* ════ 공용공간 목록 ════ */}
          {activeTab === 'spaces' && (
            <>
              <div className={styles.sortRow}>
                <span className={styles.resultCount}>
                  {spaceQ.buildingNm ? (
                    <>
                      {spaceQ.buildingNm} ·{' '}
                      <strong style={{ color: '#ba8037' }}>
                        {spacePag.totalElements}
                      </strong>
                      개
                    </>
                  ) : (
                    <>{spacePag.totalElements}개 결과</>
                  )}
                </span>
                <button
                  type="button"
                  style={{
                    background: '#ba8037',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => navigate('/me?tab=space')}
                >
                  📋 공용공간예약 조회
                </button>
              </div>
              {spaceLoading && (
                <div className={styles.loadingWrap}>
                  <div className={styles.spinner} />
                  <p>공용공간 목록을 불러오는 중...</p>
                </div>
              )}
              {spaceError && !spaceLoading && (
                <div className={styles.errorBox}>
                  <p>⚠️ {spaceError}</p>
                  <button onClick={() => fetchSpaces(spaceQ)}>다시 시도</button>
                </div>
              )}
              {!spaceLoading && !spaceError && spaces.length === 0 && (
                <div className={styles.emptyBox}>
                  <p className={styles.emptyIcon}>🛋️</p>
                  <p className={styles.emptyText}>
                    {spaceQ.buildingId
                      ? '이 건물에 등록된 공용공간이 없습니다.'
                      : '등록된 공용공간이 없습니다.'}
                  </p>
                  {spaceQ.buildingId && (
                    <button
                      className={styles.emptyResetBtn}
                      onClick={() => spaceD({ type: 'RESET' })}
                    >
                      전체 보기
                    </button>
                  )}
                </div>
              )}
              {!spaceLoading && spaces.length > 0 && (
                <div className={styles.grid}>
                  {spaces.map((s) => (
                    <SpaceCard
                      key={s.spaceId}
                      space={s}
                      onClick={(id) => navigate(`/spaces/${id}`)}
                    />
                  ))}
                </div>
              )}
              {spacePag.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={spaceQ.page === 1}
                    onClick={() =>
                      spaceD({ type: 'SET_PAGE', payload: spaceQ.page - 1 })
                    }
                  >
                    ‹
                  </button>
                  {spacePages.map((p) => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${p === spaceQ.page ? styles.pageBtnActive : ''}`}
                      onClick={() => spaceD({ type: 'SET_PAGE', payload: p })}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    disabled={spaceQ.page === spacePag.totalPages}
                    onClick={() =>
                      spaceD({ type: 'SET_PAGE', payload: spaceQ.page + 1 })
                    }
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
          {/* ════ 건물 목록 ════ */}
          {activeTab === 'buildings' && (
            <>
              <div className={styles.sortRow}>
                <span className={styles.resultCount}>
                  {buildingsTotalElements}개 결과
                </span>
              </div>
              {buildingsLoading && (
                <div className={styles.loadingWrap}>
                  <div className={styles.spinner} />
                  <p>건물 목록을 불러오는 중...</p>
                </div>
              )}
              {buildingsError && !buildingsLoading && (
                <div className={styles.errorBox}>
                  <p>⚠️ {buildingsError}</p>
                </div>
              )}
              {!buildingsLoading &&
                !buildingsError &&
                buildingsList.length === 0 && (
                  <div className={styles.emptyBox}>
                    <p className={styles.emptyIcon}>🏢</p>
                    <p className={styles.emptyText}>등록된 건물이 없습니다.</p>
                  </div>
                )}
              {!buildingsLoading && buildingsList.length > 0 && (
                <div className={styles.grid}>
                  {buildingsList.map((b) => (
                    <article
                      key={b.buildingId}
                      className={styles.card}
                      onClick={() => navigate(`/buildings/${b.buildingId}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        navigate(`/buildings/${b.buildingId}`)
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.cardImg}>
                        {b.thumbnailUrl ? (
                          <img src={b.thumbnailUrl} alt={b.buildingNm} />
                        ) : (
                          <div className={styles.cardImgPlaceholder}>
                            <span>🏢</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{b.buildingNm}</h3>
                        <p className={styles.addr}>{b.buildingAddr}</p>
                        <div className={styles.cardMeta}>
                          {b.buildingUsage && <span>🏗 {b.buildingUsage}</span>}
                          {b.parkingCapacity != null && (
                            <span>🚗 주차 {b.parkingCapacity}대</span>
                          )}
                          {b.existElv !== undefined && b.existElv !== null && (
                            <span>
                              🛗 엘리베이터{' '}
                              {b.existElv === 'Y' || b.existElv === true
                                ? '있음'
                                : '없음'}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {buildingsTotalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={buildingsPage === 1}
                    onClick={() => setBuildingsPage((p) => p - 1)}
                  >
                    ‹
                  </button>
                  {Array.from(
                    { length: buildingsTotalPages },
                    (_, i) => i + 1
                  ).map((p) => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${p === buildingsPage ? styles.pageBtnActive : ''}`}
                      onClick={() => setBuildingsPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className={styles.pageBtn}
                    disabled={buildingsPage === buildingsTotalPages}
                    onClick={() => setBuildingsPage((p) => p + 1)}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Footer />

      <Modal
        open={tourListOpen}
        onClose={() => setTourListOpen(false)}
        title="📋 방문 예약 조회"
        size="lg"
      >
        <TourReservationList
          inlineMode
          onGoCreate={() => {
            setTourListOpen(false);
            setTourCreateOpen(true);
          }}
          onClose={() => setTourListOpen(false)}
        />
      </Modal>
      <Modal
        open={tourCreateOpen}
        onClose={() => setTourCreateOpen(false)}
        title="📅 사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
          onSuccess={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
          onClose={() => setTourCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
