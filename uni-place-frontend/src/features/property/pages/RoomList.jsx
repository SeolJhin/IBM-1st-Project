// features/property/pages/RoomList.jsx
import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import PageTabs from '../../../shared/components/PageTabs/PageTabs';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import styles from './RoomList.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationList from '../../reservation/pages/TourReservationList';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import { toApiImageUrl } from '../../../shared/utils/imageUrl';

// ─── 방 쿼리 ──────────────────────────────────────────────────
const INIT_QUERY = {
  page: 1,
  size: 12,
  sort: 'roomId',
  direct: 'DESC',
  rentType: undefined,
  roomSt: undefined,
  roomType: undefined,
  roomNo: undefined,
  floor: undefined,
  sunDirection: undefined,
  petAllowedYn: undefined,
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
    case 'SET_STATE': // page 리셋 없이 state만 변경 (UI 동기화용)
      return { ...state, ...action.payload };
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

const BUILDING_TYPO_ALIASES = {
  유니플레이스: 'Uniplace',
  유니플레이스a: 'Uniplace A',
  유니플레이스b: 'Uniplace B',
  유니플레이스c: 'Uniplace C',
  유니플a: 'Uniplace A',
  유니플b: 'Uniplace B',
  유니플c: 'Uniplace C',
  uniplacea: 'Uniplace A',
  uniplaceb: 'Uniplace B',
  uniplacec: 'Uniplace C',
};

function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^0-9a-z가-힣]/gi, '');
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function resolveBuildingName(inputValue, buildings = []) {
  const raw = String(inputValue || '').trim();
  if (!raw) return { building: null, correctedFrom: '' };

  const normalizedInput = normalizeSearchText(raw);
  if (!normalizedInput) return { building: null, correctedFrom: '' };

  const exact = buildings.find(
    (b) => normalizeSearchText(b?.buildingNm) === normalizedInput
  );
  if (exact) return { building: exact, correctedFrom: '' };

  const aliasTarget = BUILDING_TYPO_ALIASES[normalizedInput];
  if (aliasTarget) {
    const aliasNormalized = normalizeSearchText(aliasTarget);
    const aliasMatch =
      buildings.find(
        (b) => normalizeSearchText(b?.buildingNm) === aliasNormalized
      ) ||
      buildings.find((b) =>
        normalizeSearchText(b?.buildingNm).includes(aliasNormalized)
      );
    if (aliasMatch) return { building: aliasMatch, correctedFrom: raw };
  }

  const includeMatch = buildings.find((b) => {
    const name = normalizeSearchText(b?.buildingNm);
    return name.includes(normalizedInput) || normalizedInput.includes(name);
  });
  if (includeMatch) return { building: includeMatch, correctedFrom: '' };

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  buildings.forEach((building) => {
    const name = normalizeSearchText(building?.buildingNm);
    if (!name) return;
    const distance = levenshteinDistance(normalizedInput, name);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = building;
    }
  });

  const threshold =
    normalizedInput.length <= 4 ? 1 : normalizedInput.length <= 9 ? 2 : 3;
  if (best && bestDistance <= threshold) {
    return { building: best, correctedFrom: raw };
  }

  return { building: null, correctedFrom: '' };
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
            src={toApiImageUrl(room.thumbnailUrl)}
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
          <img src={toApiImageUrl(space.thumbnailUrl)} alt={space.spaceNm} />
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

// ─── 주소 → 지점명 변환 ───────────────────────────────────────
// 예) '서울특별시 강남구 테헤란로 427'  → '강남점'
//     '경기도 수원시 영통구 광교중앙로 145' → '수원점'
//     '경기도 성남시 분당구 판교역로 235' → '판교점'
function getBranchLabel(building) {
  const addr = building.buildingAddr || '';

  // 1) 서울: 구 단위 추출  (강남구 → 강남점)
  if (addr.includes('서울')) {
    const m = addr.match(/([가-힣]+)구/);
    if (m) return `${m[1]}점`;
  }

  // 2) 도로명에 '역'이 포함된 경우  (판교역로 → 판교점)
  const roadM = addr.match(/([가-힣]+)역/);
  if (roadM) return `${roadM[1]}점`;

  // 3) 시 단위 추출  (수원시 → 수원점)
  //    특별시·광역시·특별자치시는 제외
  const siM = addr.match(/([가-힣]{2,5})시/);
  const METRO = [
    '서울특별',
    '부산광역',
    '인천광역',
    '대구광역',
    '광주광역',
    '대전광역',
    '울산광역',
    '세종특별자치',
  ];
  if (siM && !METRO.some((ex) => siM[1].includes(ex))) {
    return `${siM[1]}점`;
  }

  // 4) fallback: 건물명 그대로
  return building.buildingNm;
}

// ─── 방 필터 패널 ─────────────────────────────────────────────
function FilterPanel({
  query,
  dispatch,
  buildings,
  buildingLoading,
  roomNoCandidates = [],
}) {
  const [local, setLocal] = useState({
    buildingNm: '',
    minRentPrice: '',
    maxRentPrice: '',
    minDeposit: '',
    maxDeposit: '',
    minRoomCapacity: '',
    maxRoomCapacity: '',
    roomNo: '',
    floor: '',
  });
  const [buildingCorrection, setBuildingCorrection] = useState(null);

  useEffect(() => {
    setLocal({
      buildingNm: query.buildingNm ?? '',
      minRentPrice: query.minRentPrice ?? '',
      maxRentPrice: query.maxRentPrice ?? '',
      minDeposit: query.minDeposit ?? '',
      maxDeposit: query.maxDeposit ?? '',
      minRoomCapacity: query.minRoomCapacity ?? '',
      maxRoomCapacity: query.maxRoomCapacity ?? '',
      roomNo: query.roomNo ?? '',
      floor: query.floor ?? '',
    });
  }, [
    query.buildingNm,
    query.minRentPrice,
    query.maxRentPrice,
    query.minDeposit,
    query.maxDeposit,
    query.minRoomCapacity,
    query.maxRoomCapacity,
    query.roomNo,
    query.floor,
  ]);

  const buildingNameOptions = useMemo(() => {
    const unique = new Set();
    buildings.forEach((b) => {
      const name = String(b?.buildingNm || '').trim();
      if (name) unique.add(name);
    });
    return [...unique];
  }, [buildings]);

  const filteredRoomNoCandidates = useMemo(() => {
    const keyword = normalizeSearchText(local.roomNo);
    const source = Array.isArray(roomNoCandidates) ? roomNoCandidates : [];
    if (!keyword) return source.slice(0, 30);
    return source
      .filter((value) => normalizeSearchText(value).includes(keyword))
      .slice(0, 30);
  }, [local.roomNo, roomNoCandidates]);

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

  const applyBuildingFilter = useCallback(
    (rawInput) => {
      const input = String(rawInput ?? local.buildingNm ?? '').trim();
      if (!input) {
        setBuildingCorrection(null);
        dispatch({
          type: 'SET_FILTER',
          payload: { buildingNm: undefined, buildingId: undefined },
        });
        return;
      }

      const { building, correctedFrom } = resolveBuildingName(input, buildings);
      const nextBuildingNm = building?.buildingNm || input;

      setLocal((prev) => ({ ...prev, buildingNm: nextBuildingNm }));
      dispatch({
        type: 'SET_FILTER',
        payload: {
          buildingNm: nextBuildingNm,
          buildingId: building?.buildingId,
        },
      });

      if (building && correctedFrom) {
        setBuildingCorrection(
          `'${correctedFrom}' → '${nextBuildingNm}'로 보정됨`
        );
      } else if (!building && input) {
        setBuildingCorrection(
          `'${input}'과 일치하는 건물이 없어 입력값으로 검색`
        );
      } else {
        setBuildingCorrection(null);
      }

    },
    [buildings, dispatch, local.buildingNm]
  );

  const applyRoomNoFilter = useCallback(
    (rawInput) => {
      const roomNo = String(rawInput ?? local.roomNo ?? '').trim();
      dispatch({
        type: 'SET_FILTER',
        payload: { roomNo: roomNo || undefined },
      });
    },
    [dispatch, local.roomNo]
  );

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

      {/* ── 1. 건물 ── */}
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>건물</h3>
        {buildingLoading ? (
          <p style={{ fontSize: 12, color: '#9a8c70', margin: 0 }}>
            건물 목록 로딩 중...
          </p>
        ) : (
          <>
            <div className={styles.buildingSearchRow}>
              <input
                className={styles.filterInput}
                type="text"
                list="building-name-options"
                placeholder="건물명 입력 (예: Uniplace A, 유니플A)"
                value={local.buildingNm}
                onChange={(e) => {
                  setBuildingCorrection(null);
                  setLocal((prev) => ({ ...prev, buildingNm: e.target.value }));
                }}
                onBlur={() => applyBuildingFilter(local.buildingNm)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyBuildingFilter(local.buildingNm);
                }}
              />
              <button
                type="button"
                className={styles.searchApplyBtn}
                onClick={() => applyBuildingFilter(local.buildingNm)}
              >
                적용
              </button>
            </div>
            <datalist id="building-name-options">
              {buildingNameOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {buildingCorrection ? (
              <p className={styles.searchAssist}>{buildingCorrection}</p>
            ) : null}
            <select
              className={styles.filterSelect}
              style={{ display: 'none' }}
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
                  {getBranchLabel(b)}
                </option>
              ))}
            </select>
          </>
        )}
      </section>

      {/* ── 2. 방 유형 ── */}
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>방 유형</h3>
        <div className={styles.roomTypeGrid}>
          {[
            { value: '', label: '전체', icon: '🏠' },
            { value: 'one_room', label: '원룸', icon: '🛏' },
            { value: 'two_room', label: '투룸', icon: '🛏🛏' },
            { value: 'three_room', label: '쓰리룸', icon: '🛏🛏🛏' },
            { value: 'share', label: '쉐어', icon: '👥' },
            { value: 'loft', label: '로프트', icon: '🏗' },
          ].map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              className={`${styles.roomTypeBtn} ${(query.roomType ?? '') === value ? styles.roomTypeBtnActive : ''}`}
              onClick={() =>
                dispatch({
                  type: 'SET_FILTER',
                  payload: { roomType: value || undefined },
                })
              }
            >
              <span className={styles.roomTypeIcon}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── 3. 호실 / 층 검색 ── */}
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>호실 / 층 검색</h3>
        <p className={styles.filterHint}>입력 후 Enter 또는 클릭 시 적용</p>
        <div className={styles.searchRow}>
          <div className={styles.searchField}>
            <span className={styles.searchFieldLabel}>호실</span>
            <input
              className={styles.filterInput}
              type="text"
              list="room-no-options"
              placeholder="예) 101"
              value={local.roomNo}
              onChange={(e) =>
                setLocal((p) => ({ ...p, roomNo: e.target.value }))
              }
              onBlur={() => applyRoomNoFilter(local.roomNo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyRoomNoFilter(local.roomNo);
              }}
            />
            <datalist id="room-no-options">
              {filteredRoomNoCandidates.map((roomNo) => (
                <option key={roomNo} value={roomNo} />
              ))}
            </datalist>
          </div>
          <div className={styles.searchField}>
            <span className={styles.searchFieldLabel}>층</span>
            <input
              className={styles.filterInput}
              type="number"
              placeholder="예) 3"
              min={1}
              value={local.floor}
              onChange={(e) =>
                setLocal((p) => ({ ...p, floor: e.target.value }))
              }
              onBlur={() =>
                dispatch({
                  type: 'SET_FILTER',
                  payload: {
                    floor: local.floor === '' ? undefined : Number(local.floor),
                  },
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  dispatch({
                    type: 'SET_FILTER',
                    payload: {
                      floor:
                        local.floor === '' ? undefined : Number(local.floor),
                    },
                  });
              }}
            />
          </div>
        </div>
      </section>

      {/* ── 4. 입주 상태 ── */}
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

      {/* ── 5. 임대 유형 ── */}
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

      {/* ── 6. 월세 범위 ── */}
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

      {/* ── 7. 보증금 범위 ── */}
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

      {/* ── 8. 수용 인원 ── */}
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

      {/* ── 9. 채광 ── */}
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

      {/* ── 10. 반려동물 ── */}
      <section className={styles.filterSection}>
        <h3 className={styles.filterLabel}>반려동물</h3>
        <select
          className={styles.filterSelect}
          value={query.petAllowedYn || ''}
          onChange={sel('petAllowedYn')}
        >
          <option value="">전체</option>
          <option value="Y">허용</option>
          <option value="N">불가</option>
        </select>
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
                {getBranchLabel(b)}
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


const TAB_IMAGES = {
  rooms:     'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1400&q=80',
  spaces:    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80',
  buildings: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=80',
};
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.tab || 'rooms';
  });

  // 헤더 드롭다운에서 navigate로 state가 바뀔 때 activeTab 동기화
  useEffect(() => {
    const tabFromState = location.state?.tab || 'rooms';
    setActiveTab(tabFromState);
  }, [location.state]);

  // 건물 목록 상태
  const [buildingsList, setBuildingsList] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [buildingsError, setBuildingsError] = useState(null);
  const [buildingsPage, setBuildingsPage] = useState(1);
  const [buildingsTotalPages, setBuildingsTotalPages] = useState(1);
  const [buildingsTotalElements, setBuildingsTotalElements] = useState(0);

  /* ── 방 상태 ── */
  const [searchParams, setSearchParams] = useSearchParams();

  // URL searchParams → INIT_QUERY 변환
  const queryFromUrl = () => {
    const p = (key) => searchParams.get(key) || undefined;
    const n = (key) =>
      searchParams.get(key) ? Number(searchParams.get(key)) : undefined;
    return {
      ...INIT_QUERY,
      page: n('page') ?? 1,
      sort: p('sort') ?? 'roomId',
      direct: p('direct') ?? 'DESC',
      rentType: p('rentType'),
      roomSt: p('roomSt'),
      roomType: p('roomType'),
      roomNo: p('roomNo'),
      floor: n('floor'),
      sunDirection: p('sunDirection'),
      petAllowedYn: p('petAllowedYn'),
      minRentPrice: n('minRentPrice'),
      maxRentPrice: n('maxRentPrice'),
      minDeposit: n('minDeposit'),
      maxDeposit: n('maxDeposit'),
      minRoomCapacity: n('minRoomCapacity'),
      maxRoomCapacity: n('maxRoomCapacity'),
      buildingNm: p('buildingNm'),
      buildingId: n('buildingId'),
    };
  };

  const [query, dispatch] = useReducer(queryReducer, undefined, queryFromUrl);
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

  const roomNoCandidates = useMemo(() => {
    const fromRooms = rooms
      .map((room) => String(room?.roomNo || '').trim())
      .filter(Boolean);
    return [...new Set(fromRooms)];
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.removeItem('uniplace_recent_room_searches_v1');
    } catch {
      // ignore storage failures
    }
  }, []);

  /* ── 방 fetch ── */
  const fetchRooms = useCallback(async (q) => {
    setRL(true);
    setRE(null);
    try {
      // _rating은 클라이언트 정렬이므로 API에는 기본값으로 전달
      const apiQ = q.sort === '_rating' ? { ...q, sort: 'roomId' } : q;
      const data = await propertyApi.getRoomsAll(apiQ);
      const content = data?.content ?? [];
      const enriched = await Promise.all(
        content.map(async (room) => {
          try {
            const res = await fetch(
              `/api/reviews/rooms/${room.roomId}/summary`
            );
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
      const sorted =
        q.sort === '_rating'
          ? [...enriched].sort((a, b) => (b._rating ?? 0) - (a._rating ?? 0))
          : enriched;
      setRooms(sorted);
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

  // query 변경 시 URL searchParams 동기화 (방 탭일 때만)
  useEffect(() => {
    if (activeTab !== 'rooms') return;
    const params = {};
    Object.entries(query).forEach(([k, v]) => {
      if (
        v !== undefined &&
        v !== null &&
        v !== '' &&
        !(k === 'page' && v === 1) &&
        !(k === 'size') &&
        !(k === 'sort' && v === 'roomId') &&
        !(k === 'direct' && v === 'DESC')
      ) {
        params[k] = String(v);
      }
    });
    setSearchParams(params, { replace: true });
  }, [query, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
          const loaded = d?.content ?? [];
          setBldgs(loaded);
          setBldgLoaded(true);

          // URL에 buildingId가 있고 buildingNm이 아직 없으면 sync
          // query.buildingId는 queryFromUrl()에서 이미 설정됨 → API 필터 이미 적용 중
          // buildingNm만 추가로 채워서 필터 select UI에 선택값 표시
          const urlBuildingId = searchParams.get('buildingId');
          if (urlBuildingId && !searchParams.get('buildingNm')) {
            const found = loaded.find(
              (b) => String(b.buildingId) === String(urlBuildingId)
            );
            if (found) {
              // SET_STATE: page 리셋·재조회 없이 buildingNm만 query에 보완
              // (buildingId로 첫 fetch는 queryFromUrl에서 이미 완료)
              dispatch({
                type: 'SET_STATE',
                payload: {
                  buildingNm: found.buildingNm,
                  buildingId: Number(urlBuildingId),
                },
              });
            }
          }
        })
        .catch(() => {})
        .finally(() => setBL(false));
    }
  }, [activeTab, bldgLoaded]);

  // 페이지 윈도우: 현재 페이지 기준 앞뒤 4개씩만 표시 (최대 10개)
  function pageWindow(current, total, radius = 2) {
    const from = Math.max(1, current - radius);
    const to = Math.min(total, current + radius);
    const result = [];
    for (let p = from; p <= to; p++) result.push(p);
    return result;
  }

  const roomPages = pageWindow(query.page, roomPag.totalPages);
  const spacePages = pageWindow(spaceQ.page, spacePag.totalPages);

  return (
    <div className={styles.page}>
      <Header />

      {/* ══ HERO ════════════════════════════════════════════════ */}
      {(() => {
        const TAB_META = {
          rooms:     { eyebrow: 'FIND YOUR ROOM', title: '방 찾기', sub: '라이프스타일에 맞는 최적의 공간을 지금 찾아보세요.' },
          spaces:    { eyebrow: 'SHARED SPACE', title: '공용공간', sub: '라운지, 스터디룸, 피트니스 등 다양한 공용 공간을 확인하세요.' },
          buildings: { eyebrow: 'BUILDINGS', title: '건물 목록', sub: 'UNI-PLACE가 운영하는 모든 하우스를 둘러보세요.' },
        };
        const meta = TAB_META[activeTab] ?? TAB_META.rooms;
        const img  = TAB_IMAGES[activeTab];
        return (
          <section className={styles.heroSection}>
            <div
              className={styles.heroBg}
              style={{ backgroundImage: `url(${img})` }}
            />
            <div className={styles.heroOverlay} />
            <div className={styles.heroSideLine} aria-hidden="true" />
            <div className={styles.heroContent}>
              <div className={styles.heroInner}>
                <span className={styles.heroEyebrow}>{meta.eyebrow}</span>
                <div className={styles.heroLine} aria-hidden="true" />
                <h1 className={styles.heroTitle}>{meta.title}</h1>
                <p className={styles.heroSub}>{meta.sub}</p>
              </div>
            </div>
            <div className={styles.heroFade} aria-hidden="true" />
          </section>
        );
      })()}

      <PageTabs
        categories={[
          { label: '방 목록', path: '/rooms', tab: 'rooms' },
          { label: '공용공간', path: '/rooms', tab: 'spaces' },
          { label: '건물 목록', path: '/rooms', tab: 'buildings' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.history.replaceState({ tab }, '');
        }}
      />

      <div className={styles.layout}>
        {/* 필터 패널 */}
        {activeTab === 'rooms' ? (
          <FilterPanel
            query={query}
            dispatch={dispatch}
            buildings={buildings}
            buildingLoading={bldgLoading}
            roomNoCandidates={roomNoCandidates}
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
            <p style={{ fontSize: 13, color: '#9a8c70', margin: 0, padding: '0 4px' }}>
              건물을 클릭하면 상세 정보를 확인할 수 있습니다.
            </p>
          </aside>
        )}

        <main className={styles.main}>
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
                    onChange={(e) => {
                      const val = e.target.value;
                      // 낮은순 정렬은 ASC, 최신순/별점순은 DESC
                      const direct =
                        val === 'roomId' || val === '_rating' ? 'DESC' : 'ASC';
                      dispatch({
                        type: 'SET_FILTER',
                        payload: { sort: val, direct },
                      });
                    }}
                  >
                    <option value="roomId">최신순</option>
                    <option value="rentPrice">월세 낮은순</option>
                    <option value="deposit">보증금 낮은순</option>
                    <option value="roomSize">면적순</option>
                    <option value="_rating">별점순</option>
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
                      onClick={(id) =>
                        navigate(`/rooms/${id}`, { state: { fromList: true } })
                      }
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
                  onClick={() => navigate('/me?tab=space&sub=list')}
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
                        {b.thumbUrl ? (
                          <img
                            src={toApiImageUrl(b.thumbUrl)}
                            alt={b.buildingNm}
                          />
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
                  {pageWindow(buildingsPage, buildingsTotalPages).map((p) => (
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
