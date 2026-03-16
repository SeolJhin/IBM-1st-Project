// features/property/pages/BuildingDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import styles from './BuildingDetail.module.css';
import { toApiImageUrl } from '../../../shared/utils/imageUrl';
import ImageGallery from '../../file/components/ImageGallery';
import { KAKAO_MAP_KEY, KMA_KEY } from '../../chat/config/chatConfig';

// ── 카카오맵 동적 로드 ────────────────────────────────────────
let _kakaoLoadPromise = null;
function loadKakaoMap(appKey) {
  if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
    return Promise.resolve(window.kakao.maps);
  }
  if (_kakaoLoadPromise) return _kakaoLoadPromise;
  _kakaoLoadPromise = new Promise((resolve, reject) => {
    // 이미 스크립트 태그가 있으면 로드 완료 대기
    const existing = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existing) {
      const check = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          clearInterval(check);
          resolve(window.kakao.maps);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
    script.onload = () =>
      window.kakao.maps.load(() => resolve(window.kakao.maps));
    script.onerror = (e) => {
      _kakaoLoadPromise = null;
      reject(e);
    };
    document.head.appendChild(script);
  });
  return _kakaoLoadPromise;
}

// ── 기상청 날씨 코드 매핑 ─────────────────────────────────────
// PTY(강수형태): 0없음 1비 2비/눈 3눈 4소나기
// SKY(하늘상태): 1맑음 3구름많음 4흐림
const KMA_SKY = {
  1: { icon: '☀️', label: '맑음' },
  3: { icon: '⛅', label: '구름많음' },
  4: { icon: '☁️', label: '흐림' },
};
const KMA_PTY = {
  1: { icon: '🌧️', label: '비' },
  2: { icon: '🌨️', label: '비/눈' },
  3: { icon: '❄️', label: '눈' },
  4: { icon: '🌦️', label: '소나기' },
};

// ── 위경도 → 기상청 격자 변환 (기상청 공식 알고리즘) ──────────
function latLonToGrid(lat, lon) {
  const RE = 6371.00877,
    GRID = 5.0,
    SLAT1 = 30.0,
    SLAT2 = 60.0;
  const OLON = 126.0,
    OLAT = 38.0,
    XO = 43,
    YO = 136;
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID,
    slat1 = SLAT1 * DEGRAD,
    slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD,
    olat = OLAT * DEGRAD;
  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

// ── 기상청 베이스타임 계산 ────────────────────────────────────
function getKmaBaseTime() {
  const now = new Date();
  const h = now.getHours(),
    m = now.getMinutes();
  const totalMin = h * 60 + m;
  // 발표 후 10분 뒤부터 유효
  const times = [200, 500, 800, 1100, 1400, 1700, 2000, 2300];
  let base = 2300;
  for (const t of times) {
    const th = Math.floor(t / 100),
      tm = t % 100;
    if (totalMin >= th * 60 + tm + 10) base = t;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const bh = Math.floor(base / 100);
  const date = new Date(now);
  if (bh > h) date.setDate(date.getDate() - 1);
  return {
    base_date: `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    base_time: `${pad(bh)}00`,
  };
}

// ── 날씨 카드 컴포넌트 (기상청) ──────────────────────────────
function WeatherCard({ addr, kmaKey }) {
  const [weather, setWeather] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!addr || !kmaKey) return;

    // 1단계: 카카오 지오코더로 주소 → 위경도
    loadKakaoMap(KAKAO_MAP_KEY)
      .then((maps) => {
        return new Promise((resolve, reject) => {
          const geocoder = new maps.services.Geocoder();
          geocoder.addressSearch(addr, (result, status) => {
            if (status !== maps.services.Status.OK) {
              reject(new Error('geocode fail'));
              return;
            }
            resolve({
              lat: parseFloat(result[0].y),
              lon: parseFloat(result[0].x),
            });
          });
        });
      })
      .then(({ lat, lon }) => {
        // 2단계: 위경도 → 기상청 격자
        const { nx, ny } = latLonToGrid(lat, lon);
        const { base_date, base_time } = getKmaBaseTime();
        const url =
          `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst` +
          `?serviceKey=${encodeURIComponent(kmaKey)}` +
          `&numOfRows=60&pageNo=1&dataType=JSON` +
          `&base_date=${base_date}&base_time=${base_time}` +
          `&nx=${nx}&ny=${ny}`;
        return fetch(url).then((r) => r.json());
      })
      .then((data) => {
        const items = data?.response?.body?.items?.item;
        if (!items) throw new Error('no items');
        // 가장 가까운 시각의 데이터 추출
        const fcstTime = items[0]?.fcstTime;
        const row = (cat) =>
          items.find((i) => i.category === cat && i.fcstTime === fcstTime)
            ?.fcstValue;
        const T1H = row('T1H'); // 기온
        const REH = row('REH'); // 습도
        const PTY = parseInt(row('PTY') ?? '0', 10); // 강수형태
        const SKY = parseInt(row('SKY') ?? '1', 10); // 하늘상태
        const WSD = row('WSD'); // 풍속 (체감온도 계산용)
        // 체감온도 (바람냉각지수 근사)
        const t = parseFloat(T1H ?? 0),
          v = parseFloat(WSD ?? 0);
        const feels =
          t <= 10
            ? Math.round(
                13.12 +
                  0.6215 * t -
                  11.37 * Math.pow(v, 0.16) +
                  0.3965 * Math.pow(v, 0.16) * t
              )
            : Math.round(t);
        setWeather({ T1H: Math.round(t), feels, REH, PTY, SKY });
      })
      .catch(() => setErr(true));
  }, [addr, kmaKey]);

  if (err || !kmaKey) return null;
  if (!weather) {
    return (
      <div className={styles.weatherSkeleton}>
        <span className={styles.weatherSkeletonDot} />
        날씨 불러오는 중...
      </div>
    );
  }

  const pty = KMA_PTY[weather.PTY];
  const sky = KMA_SKY[weather.SKY] || KMA_SKY[1];
  const { icon, label } = pty || sky;

  return (
    <div className={styles.weatherCard}>
      <span className={styles.weatherIcon}>{icon}</span>
      <div className={styles.weatherInfo}>
        <span className={styles.weatherTemp}>{weather.T1H}°C</span>
        <span className={styles.weatherLabel}>{label}</span>
      </div>
      <div className={styles.weatherSub}>
        <span>체감 {weather.feels}°C</span>
        <span>습도 {weather.REH}%</span>
      </div>
    </div>
  );
}

// ── 카카오맵 컴포넌트 ─────────────────────────────────────────
function KakaoMapView({ addr, kakaoKey }) {
  const mapRef = useRef(null);
  const [mapErr, setMapErr] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // DOM이 마운트된 후 ready 상태로 전환
  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!addr || !kakaoKey || !mapReady || !mapRef.current) return;
    let cancelled = false;

    loadKakaoMap(kakaoKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const geocoder = new maps.services.Geocoder();
        geocoder.addressSearch(addr, (result, status) => {
          if (cancelled || !mapRef.current) return;
          if (status !== maps.services.Status.OK) {
            setMapErr(true);
            return;
          }
          const coords = new maps.LatLng(result[0].y, result[0].x);
          const map = new maps.Map(mapRef.current, {
            center: coords,
            level: 4,
          });
          const marker = new maps.Marker({ position: coords });
          marker.setMap(map);
          const infowindow = new maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:13px;font-weight:600;">${addr.split(' ').slice(0, 3).join(' ')}</div>`,
          });
          infowindow.open(map, marker);
        });
      })
      .catch(() => {
        if (!cancelled) setMapErr(true);
      });

    return () => {
      cancelled = true;
    };
  }, [addr, kakaoKey, mapReady]);

  if (!kakaoKey) return null;
  if (mapErr)
    return <div className={styles.mapErr}>지도를 불러올 수 없습니다.</div>;

  return <div ref={mapRef} className={styles.kakaoMap} />;
}

function SpaceCard({ space, onDetail }) {
  const options = space.spaceOptions
    ? space.spaceOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  return (
    <article
      className={styles.spaceCard}
      onClick={() => onDetail(space.spaceId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDetail(space.spaceId)}
    >
      <div className={styles.spaceImg}>
        {space.thumbnailUrl ? (
          <img src={toApiImageUrl(space.thumbnailUrl)} alt={space.spaceNm} />
        ) : (
          <div className={styles.spaceImgPlaceholder}>🛋️</div>
        )}
      </div>
      <div className={styles.spaceBody}>
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
      </div>
    </article>
  );
}

function RoomMiniCard({ room, onDetail }) {
  const rentTypeLabel = { monthly_rent: '월세', stay: '단기' };
  const statusLabel = {
    available: '가능',
    reserved: '예약중',
    contracted: '계약중',
    repair: '수리중',
    cleaning: '청소중',
  };
  const statusClass = {
    available: styles.sBadgeAvail,
    reserved: styles.sBadgeOccupied,
    contracted: styles.sBadgeOccupied,
    repair: styles.sBadgeMaint,
    cleaning: styles.sBadgeMaint,
  };
  return (
    <article
      className={styles.roomMiniCard}
      onClick={() => onDetail(room.roomId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDetail(room.roomId)}
    >
      <div className={styles.roomMiniImg}>
        {room.thumbnailUrl ? (
          <img
            src={toApiImageUrl(room.thumbnailUrl)}
            alt={`${room.roomNo}호`}
          />
        ) : (
          <div className={styles.roomMiniImgPh}>🏠</div>
        )}
        <span className={`${styles.sBadge} ${statusClass[room.roomSt] || ''}`}>
          {statusLabel[room.roomSt] || room.roomSt}
        </span>
      </div>
      <div className={styles.roomMiniBody}>
        <p className={styles.roomMiniNo}>
          {room.roomNo}호 · {room.floor}층
        </p>
        <p className={styles.roomMiniType}>
          {rentTypeLabel[room.rentType] || room.rentType} · {room.roomSize}㎡
        </p>
        <p className={styles.roomMiniPrice}>
          월 {Number(room.rentPrice).toLocaleString()}원
        </p>
      </div>
    </article>
  );
}

export default function BuildingDetail() {
  const { buildingId } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomPage, setRoomPage] = useState(1);
  const [roomTotalPages, setRoomTotalPages] = useState(1);
  const [roomTotalCount, setRoomTotalCount] = useState(0);
  const [roomLoading, setRoomLoading] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [spacePage, setSpacePage] = useState(1);
  const [spaceTotalPages, setSpaceTotalPages] = useState(1);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms');
  const [findMenuOpen, setFindMenuOpen] = useState(false);

  useEffect(() => {
    if (!buildingId) return;
    setLoading(true);
    propertyApi
      .getBuildingDetail(Number(buildingId))
      .then((data) => setBuilding(data))
      .catch((err) =>
        setError(err?.message || '빌딩 정보를 불러올 수 없습니다.')
      )
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    if (!buildingId) return;
    setRoomLoading(true);
    propertyApi
      .getRooms(Number(buildingId), { page: roomPage, size: 8 })
      .then((data) => {
        setRooms(data?.content ?? []);
        setRoomTotalPages(data?.totalPages ?? 1);
        setRoomTotalCount(data?.totalElements ?? 0);
      })
      .catch(() => setRooms([]))
      .finally(() => setRoomLoading(false));
  }, [buildingId, roomPage]);

  useEffect(() => {
    if (!buildingId) return;
    setSpaceLoading(true);
    propertyApi
      .getSpaces(Number(buildingId), { page: spacePage, size: 8 })
      .then((data) => {
        setSpaces(data?.content ?? []);
        setSpaceTotalPages(data?.totalPages ?? 1);
      })
      .catch(() => setSpaces([]))
      .finally(() => setSpaceLoading(false));
  }, [buildingId, spacePage]);

  useEffect(() => {
    if (!findMenuOpen) return;
    const close = () => setFindMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [findMenuOpen]);

  const scrollToTab = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      document
        .querySelector('[data-tabbar]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>빌딩 정보를 불러오는 중...</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (error || !building) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <p>⚠️ {error || '빌딩 정보를 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate('/rooms')}>방 찾기로 이동</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      {/* ── 브레드크럼 + 방찾기 드롭다운 ── */}
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <div className={styles.bcLeft}>
            <button className={styles.bcBtn} onClick={() => navigate('/')}>
              홈
            </button>
            <span className={styles.bcSep}>›</span>
            <button
              className={styles.bcBtn}
              onClick={() => navigate('/buildings')}
            >
              건물 목록
            </button>
            <span className={styles.bcSep}>›</span>
            <span className={styles.bcCurrent}>{building.buildingNm}</span>
          </div>

          {/* 방찾기 드롭다운 */}
          <div
            className={styles.findMenuWrap}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.findBtn}
              onClick={() => setFindMenuOpen((v) => !v)}
              type="button"
            >
              🔍 방 찾기&nbsp;
              <span className={styles.findArrow}>
                {findMenuOpen ? '▲' : '▼'}
              </span>
            </button>
            {findMenuOpen && (
              <div className={styles.findMenu}>
                <button
                  className={styles.findMenuItem}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms');
                  }}
                  type="button"
                >
                  🏠 방 목록 전체
                </button>
                <button
                  className={styles.findMenuItem}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'buildings' } });
                  }}
                  type="button"
                >
                  🏢 건물 목록
                </button>
                <button
                  className={styles.findMenuItem}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'spaces' } });
                  }}
                  type="button"
                >
                  🛋️ 공용공간 목록
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* ── 상단: 갤러리 + 빌딩 정보 ── */}
        <div className={styles.topGrid}>
          <ImageGallery files={building.files} />

          <div className={styles.infoPanel}>
            <p className={styles.infoKicker}>BUILDING INFO</p>
            <h1 className={styles.buildingNm}>{building.buildingNm}</h1>
            <p className={styles.buildingAddr}>📍 {building.buildingAddr}</p>
            {/* 날씨 */}
            <WeatherCard addr={building.buildingAddr} kmaKey={KMA_KEY} />
            {building.buildingDesc && (
              <p className={styles.buildingDesc}>{building.buildingDesc}</p>
            )}

            <div className={styles.detailGrid}>
              {building.landCategory && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>지목</span>
                  <span className={styles.detailValue}>
                    {building.landCategory}
                  </span>
                </div>
              )}
              {building.buildSize && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>연면적</span>
                  <span className={styles.detailValue}>
                    {building.buildSize}㎡
                  </span>
                </div>
              )}
              {building.buildingUsage && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>용도</span>
                  <span className={styles.detailValue}>
                    {building.buildingUsage}
                  </span>
                </div>
              )}
              {building.existElv !== undefined &&
                building.existElv !== null && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>엘리베이터</span>
                    <span className={styles.detailValue}>
                      {building.existElv === 'Y' || building.existElv === true
                        ? '있음'
                        : '없음'}
                    </span>
                  </div>
                )}
              {building.parkingCapacity != null && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>주차</span>
                  <span className={styles.detailValue}>
                    {building.parkingCapacity}대
                  </span>
                </div>
              )}
            </div>

            {/* 빠른 이동 버튼 */}
            <div className={styles.quickBtns}>
              <button
                className={`${styles.quickBtn} ${styles.quickBtnPrimary}`}
                onClick={() => navigate(`/rooms?buildingId=${buildingId}`)}
                type="button"
              >
                🏠 이 건물 방 보기
              </button>
              <button
                className={`${styles.quickBtn} ${styles.quickBtnSecondary}`}
                onClick={() => navigate('/rooms', { state: { tab: 'spaces' } })}
                type="button"
              >
                🛋️ 공용공간 보기
              </button>
            </div>
          </div>
        </div>

        {/* ── 지도 + 챗봇 AI 버튼 ── */}
        <div className={styles.mapSection}>
          <div className={styles.mapHeader}>
            <h2 className={styles.mapTitle}>📍 건물 위치</h2>
            <button
              className={styles.askAiBtn}
              onClick={() => {
                // 챗봇에 건물 컨텍스트 주입하여 열기
                window.dispatchEvent(
                  new CustomEvent('open-chatbot', {
                    detail: {
                      buildingId,
                      buildingNm: building.buildingNm,
                      buildingAddr: building.buildingAddr,
                      roomCount:
                        roomTotalCount > 0 ? roomTotalCount : rooms.length,
                      buildingDesc: building.buildingDesc || '',
                    },
                  })
                );
              }}
              type="button"
            >
              🤖 AI에게 이 건물 물어보기
            </button>
          </div>
          <KakaoMapView addr={building.buildingAddr} kakaoKey={KAKAO_MAP_KEY} />
        </div>

        {/* ── 탭 바 ── */}
        <div
          className={styles.tabBar}
          data-tabbar="true"
          style={{ display: 'none' }}
        >
          <button
            className={`${styles.tab} ${activeTab === 'rooms' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            🏠 방 목록 <span className={styles.tabCount}>{rooms.length}</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'spaces' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('spaces')}
          >
            🛋️ 공용공간 <span className={styles.tabCount}>{spaces.length}</span>
          </button>
        </div>

        {/* ── 방 목록 ── */}
        {activeTab === 'rooms' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>
                이 빌딩의 방 (
                {roomTotalCount > 0 ? roomTotalCount : rooms.length}개)
              </h2>
              <button
                className={styles.goListBtn}
                onClick={() => navigate(`/rooms?buildingId=${buildingId}`)}
                type="button"
              >
                전체 방 목록에서 보기 →
              </button>
            </div>
            {roomLoading && (
              <div className={styles.loadingRow}>
                <div className={styles.spinnerSm} /> 방 목록 불러오는 중...
              </div>
            )}
            {!roomLoading && rooms.length === 0 && (
              <div className={styles.emptyBox}>
                <p>등록된 방이 없습니다.</p>
              </div>
            )}
            {!roomLoading && rooms.length > 0 && (
              <div className={styles.roomGrid}>
                {rooms.map((room) => (
                  <RoomMiniCard
                    key={room.roomId}
                    room={room}
                    onDetail={(id) => navigate(`/rooms/${id}`)}
                  />
                ))}
              </div>
            )}
            {roomTotalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={roomPage === 1}
                  onClick={() => setRoomPage((p) => p - 1)}
                  className={styles.pgBtn}
                >
                  ‹
                </button>
                {(() => {
                  const from = Math.max(1, roomPage - 2);
                  const to = Math.min(roomTotalPages, roomPage + 2);
                  return Array.from(
                    { length: to - from + 1 },
                    (_, i) => from + i
                  ).map((p) => (
                    <button
                      key={p}
                      className={`${styles.pgBtn} ${p === roomPage ? styles.pgBtnActive : ''}`}
                      onClick={() => setRoomPage(p)}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  disabled={roomPage === roomTotalPages}
                  onClick={() => setRoomPage((p) => p + 1)}
                  className={styles.pgBtn}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 공용공간 목록 ── */}
        {activeTab === 'spaces' && (
          <div className={styles.tabContent}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionTitle}>
                공용공간 ({spaces.length}개)
              </h2>
              <button
                className={styles.goListBtn}
                onClick={() => navigate('/rooms', { state: { tab: 'spaces' } })}
                type="button"
              >
                공용공간 목록에서 보기 →
              </button>
            </div>
            {spaceLoading && (
              <div className={styles.loadingRow}>
                <div className={styles.spinnerSm} /> 공용공간 불러오는 중...
              </div>
            )}
            {!spaceLoading && spaces.length === 0 && (
              <div className={styles.emptyBox}>
                <p>등록된 공용공간이 없습니다.</p>
              </div>
            )}
            {!spaceLoading && spaces.length > 0 && (
              <div className={styles.spaceGrid}>
                {spaces.map((space) => (
                  <SpaceCard
                    key={space.spaceId}
                    space={space}
                    onDetail={(id) => navigate(`/spaces/${id}`)}
                  />
                ))}
              </div>
            )}
            {spaceTotalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={spacePage === 1}
                  onClick={() => setSpacePage((p) => p - 1)}
                  className={styles.pgBtn}
                >
                  ‹
                </button>
                {(() => {
                  const from = Math.max(1, spacePage - 2);
                  const to = Math.min(spaceTotalPages, spacePage + 2);
                  return Array.from(
                    { length: to - from + 1 },
                    (_, i) => from + i
                  ).map((p) => (
                    <button
                      key={p}
                      className={`${styles.pgBtn} ${p === spacePage ? styles.pgBtnActive : ''}`}
                      onClick={() => setSpacePage(p)}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  disabled={spacePage === spaceTotalPages}
                  onClick={() => setSpacePage((p) => p + 1)}
                  className={styles.pgBtn}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
