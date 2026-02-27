// features/property/pages/BuildingDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import styles from './BuildingDetail.module.css';

function ImageGallery({ files }) {
  const [active, setActive] = useState(0);
  const images = (files || []).filter((f) => {
    const ext = (f.fileType || '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });
  if (!images.length) {
    return (
      <div className={styles.galleryPlaceholder}>
        <span>🏢</span>
        <p>등록된 사진이 없습니다</p>
      </div>
    );
  }
  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img
          src={images[active]?.viewUrl || images[active]?.fileUrl}
          alt={`빌딩 사진 ${active + 1}`}
        />
      </div>
      {images.length > 1 && (
        <div className={styles.galleryThumbs}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`${styles.galleryThumb} ${i === active ? styles.galleryThumbActive : ''}`}
              onClick={() => setActive(i)}
              type="button"
            >
              <img src={img.viewUrl || img.fileUrl} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
          <img src={space.thumbnailUrl} alt={space.spaceNm} />
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
          <img src={room.thumbnailUrl} alt={`${room.roomNo}호`} />
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
                onClick={() => scrollToTab('rooms')}
                type="button"
              >
                🏠 이 건물 방 보기
              </button>
              <button
                className={`${styles.quickBtn} ${styles.quickBtnSecondary}`}
                onClick={() => scrollToTab('spaces')}
                type="button"
              >
                🛋️ 공용공간 보기
              </button>
            </div>
          </div>
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
                이 빌딩의 방 ({rooms.length}개)
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
                {Array.from({ length: roomTotalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      className={`${styles.pgBtn} ${p === roomPage ? styles.pgBtnActive : ''}`}
                      onClick={() => setRoomPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
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
                {Array.from({ length: spaceTotalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      className={`${styles.pgBtn} ${p === spacePage ? styles.pgBtnActive : ''}`}
                      onClick={() => setSpacePage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
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
