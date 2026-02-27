// features/property/pages/RoomDetail.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import { useAuth } from '../../user/hooks/useAuth';
import { useReviewActions } from '../../review/hooks/useReviews';
import styles from './RoomDetail.module.css';
import Modal from '../../../shared/components/Modal/Modal';
import TourReservationCreate from '../../reservation/pages/TourReservationCreate';
import TourReservationList from '../../reservation/pages/TourReservationList';

function StarRating({ value = 0, size = 'md' }) {
  return (
    <span className={`${styles.stars} ${styles[`stars_${size}`]}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={s <= Math.round(value) ? styles.starOn : styles.starOff}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <article className={styles.reviewCard}>
      {review.thumbnailUrl && (
        <div className={styles.reviewThumb}>
          <img src={review.thumbnailUrl} alt="리뷰 이미지" />
        </div>
      )}
      <div className={styles.reviewBody}>
        <div className={styles.reviewTop}>
          <StarRating value={review.rating} size="sm" />
          <span className={styles.reviewUser}>{review.userId || '익명'}</span>
          <span className={styles.reviewDate}>
            {review.createdAt
              ? new Date(review.createdAt).toLocaleDateString('ko-KR')
              : ''}
          </span>
        </div>
        <h4 className={styles.reviewTitle}>{review.reviewTitle}</h4>
        <p className={styles.reviewCtnt}>
          {review.reviewCtnt?.length > 100
            ? review.reviewCtnt.slice(0, 100) + '…'
            : review.reviewCtnt}
        </p>
      </div>
    </article>
  );
}

function ImageGallery({ files }) {
  const [active, setActive] = useState(0);
  const images = (files || []).filter((f) => {
    const ext = (f.fileType || '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });
  if (!images.length) {
    return (
      <div className={styles.galleryPlaceholder}>
        <span>🏠</span>
        <p>등록된 사진이 없습니다</p>
      </div>
    );
  }
  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <img
          src={images[active]?.viewUrl || images[active]?.fileUrl}
          alt={`방 사진 ${active + 1}`}
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
              <img src={img.viewUrl || img.fileUrl} alt={`썸네일 ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 공용공간 미니 카드 ─────────────────────────────────────────────────────────
function SpaceMiniCard({ space, onClick }) {
  const options = space.spaceOptions
    ? space.spaceOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  return (
    <article
      className={styles.spaceMiniCard}
      onClick={() => onClick(space.spaceId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(space.spaceId)}
    >
      <div className={styles.spaceMiniImg}>
        {space.thumbnailUrl ? (
          <img src={space.thumbnailUrl} alt={space.spaceNm} />
        ) : (
          <div className={styles.spaceMiniImgPh}>🛋️</div>
        )}
      </div>
      <div className={styles.spaceMiniBody}>
        <p className={styles.spaceMiniNm}>{space.spaceNm}</p>
        <p className={styles.spaceMiniMeta}>
          📍 {space.spaceFloor}층 · 👥 최대 {space.spaceCapacity}명
        </p>
        {options.length > 0 && (
          <div className={styles.spaceMiniTags}>
            {options.slice(0, 3).map((o) => (
              <span key={o} className={styles.spaceMiniTag}>
                {o}
              </span>
            ))}
            {options.length > 3 && (
              <span className={styles.spaceMiniTag}>+{options.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    create: createReview,
    submitting: reviewSubmitting,
    error: reviewApiError,
  } = useReviewActions();
  const [findMenuOpen, setFindMenuOpen] = useState(false);

  // 인라인 리뷰 작성 상태
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [inlineRating, setInlineRating] = useState(0);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineCtnt, setInlineCtnt] = useState('');
  const [inlineFiles, setInlineFiles] = useState([]);
  const [inlinePreviews, setInlinePreviews] = useState([]);
  const [inlineValidErr, setInlineValidErr] = useState('');
  const [inlineSuccess, setInlineSuccess] = useState(false);
  const inlineFileRef = useRef(null);
  const [inlineHover, setInlineHover] = useState(0);
  const [permError, setPermError] = useState('');
  const [tourCreateOpen, setTourCreateOpen] = useState(false);
  const [tourListOpen, setTourListOpen] = useState(false);

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(null);

  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);

  // 같은 건물 공용공간
  const [spaces, setSpaces] = useState([]);
  const [spacesLoading, setSpacesLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    setRoomLoading(true);
    propertyApi
      .getRoomDetail(Number(roomId))
      .then((data) => setRoom(data))
      .catch((err) =>
        setRoomError(err?.message || '방 정보를 불러올 수 없습니다.')
      )
      .finally(() => setRoomLoading(false));
  }, [roomId]);

  // 방 정보 로드 후 같은 건물 공용공간 조회
  useEffect(() => {
    if (!room?.buildingId) return;
    setSpacesLoading(true);
    propertyApi
      .getSpaces(room.buildingId, { page: 1, size: 6 })
      .then((data) => setSpaces(data?.content ?? []))
      .catch(() => setSpaces([]))
      .finally(() => setSpacesLoading(false));
  }, [room?.buildingId]);

  useEffect(() => {
    if (!roomId) return;
    fetch(`/reviews/rooms/${roomId}/summary`)
      .then((r) => r.json())
      .then((r) => setReviewSummary(r.data))
      .catch(() => {});
  }, [roomId]);

  const fetchReviews = useCallback(
    async (p) => {
      if (!roomId) return;
      setReviewLoading(true);
      try {
        const res = await fetch(
          `/reviews?roomId=${roomId}&page=${p - 1}&size=5&sort=reviewId&direction=DESC`
        );
        const json = await res.json();
        const data = json.data;
        setReviews(data?.content ?? []);
        setReviewTotalPages(data?.totalPages ?? 1);
      } catch {
        setReviews([]);
      } finally {
        setReviewLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    fetchReviews(reviewPage);
  }, [fetchReviews, reviewPage]);

  // 방 예약 버튼 클릭 → 팝업 오픈
  const handleTourReservation = () => {
    setTourCreateOpen(true);
  };

  // 리뷰 작성 → 인라인 폼 표시
  const handleWriteReview = () => {
    setPermError('');
    if (!user) {
      navigate('/login', { state: { from: `/rooms/${roomId}` } });
      return;
    }
    if (user.userRole !== 'tenant') {
      setPermError('리뷰 작성은 입주자(TENANT) 권한이 필요합니다.');
      return;
    }
    setShowReviewForm(true);
    setInlineSuccess(false);
    setTimeout(() => {
      document
        .querySelector('[data-review-form]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleInlineFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const merged = [...inlineFiles, ...selected].slice(0, 5);
    setInlineFiles(merged);
    setInlinePreviews(merged.map((f) => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    setInlineValidErr('');
    if (inlineRating === 0) {
      setInlineValidErr('별점을 선택해 주세요.');
      return;
    }
    const ok = await createReview(
      {
        roomId: Number(roomId),
        rating: inlineRating,
        reviewTitle: inlineTitle,
        reviewCtnt: inlineCtnt,
      },
      inlineFiles
    );
    if (ok) {
      setInlineSuccess(true);
      setShowReviewForm(false);
      setInlineRating(0);
      setInlineTitle('');
      setInlineCtnt('');
      setInlineFiles([]);
      setInlinePreviews([]);
      fetchReviews(1);
    }
  };

  useEffect(() => {
    if (!findMenuOpen) return;
    const close = () => setFindMenuOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [findMenuOpen]);

  const rentTypeLabel = { monthly_rent: '월세', stay: '단기' };
  const statusLabel = {
    available: '입주 가능',
    reserved: '예약 중',
    contracted: '계약 중',
    repair: '수리 중',
    cleaning: '청소 중',
  };
  const sunLabel = { s: '남향', n: '북향', e: '동향', w: '서향' };

  if (roomLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>방 정보를 불러오는 중...</p>
        </div>
        <Footer />
      </div>
    );
  }
  if (roomError || !room) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <p>⚠️ {roomError || '방 정보를 찾을 수 없습니다.'}</p>
          <button onClick={() => navigate('/rooms')}>목록으로</button>
        </div>
        <Footer />
      </div>
    );
  }

  const options = room.roomOptions
    ? room.roomOptions
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  return (
    <div className={styles.page}>
      <Header />

      {/* 브레드크럼 */}
      <div className={styles.breadcrumb}>
        <div
          className={styles.breadcrumbInner}
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className={styles.bcBtn} onClick={() => navigate('/')}>
              홈
            </button>
            <span className={styles.bcSep}>›</span>
            <button className={styles.bcBtn} onClick={() => navigate('/rooms')}>
              방 찾기
            </button>
            <span className={styles.bcSep}>›</span>
            <span className={styles.bcCurrent}>
              {room.buildingNm} {room.roomNo}호
            </span>
          </div>

          {/* 방 찾기 드롭다운 */}
          <div
            style={{ position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
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
                gap: '6px',
              }}
              onClick={() => setFindMenuOpen((v) => !v)}
              type="button"
            >
              🔍 방 찾기&nbsp;
              <span>{findMenuOpen ? '▲' : '▼'}</span>
            </button>
            {findMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: '#fff',
                  border: '1px solid #e8dfd0',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  minWidth: '160px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms');
                  }}
                >
                  🏠 방 목록 전체
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'buildings' } });
                  }}
                >
                  🏢 건물 목록
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                  onClick={() => {
                    setFindMenuOpen(false);
                    navigate('/rooms', { state: { tab: 'spaces' } });
                  }}
                >
                  🛋️ 공용공간 목록
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* ── 상단: 이미지 + 기본정보 ── */}
        <div className={styles.topGrid}>
          <ImageGallery files={room.files} />

          <div className={styles.infoPanel}>
            <button
              className={styles.buildingLink}
              onClick={() => navigate(`/buildings/${room.buildingId}`)}
            >
              🏢 {room.buildingNm}
              <span className={styles.buildingLinkArrow}>빌딩 상세 보기 →</span>
            </button>

            <div className={styles.roomTitle}>
              <h1 className={styles.roomName}>
                {room.roomNo}호 · {room.floor}층
              </h1>
              <span
                className={`${styles.roomStatus} ${{ available: styles.statusAvailable, reserved: styles.statusOccupied, contracted: styles.statusOccupied, repair: styles.statusMaintenance, cleaning: styles.statusMaintenance }[room.roomSt] || styles.statusMaintenance}`}
              >
                {statusLabel[room.roomSt] || room.roomSt}
              </span>
            </div>

            {/* 별점 */}
            <div className={styles.ratingBlock}>
              {reviewSummary ? (
                <>
                  <StarRating value={reviewSummary.avgRating} size="lg" />
                  <span className={styles.ratingVal}>
                    {reviewSummary.avgRating.toFixed(1)}
                  </span>
                  <span className={styles.ratingCount}>
                    ({reviewSummary.reviewCount}개 리뷰)
                  </span>
                </>
              ) : (
                <span className={styles.ratingNone}>아직 리뷰가 없습니다</span>
              )}
            </div>

            {/* 가격 */}
            <div className={styles.priceBlock}>
              <div className={styles.priceType}>
                {rentTypeLabel[room.rentType] || room.rentType}
              </div>
              <div className={styles.priceMain}>
                월 <strong>{Number(room.rentPrice).toLocaleString()}</strong>원
              </div>
              <div className={styles.priceSub}>
                보증금 {Number(room.deposit).toLocaleString()}원 · 관리비{' '}
                {Number(room.manageFee).toLocaleString()}원
              </div>
            </div>

            {/* 스펙 */}
            <div className={styles.specGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>면적</span>
                <span className={styles.specValue}>{room.roomSize}㎡</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>수용인원</span>
                <span className={styles.specValue}>{room.roomCapacity}인</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>최소기간</span>
                <span className={styles.specValue}>{room.rentMin}개월</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>채광</span>
                <span className={styles.specValue}>
                  {sunLabel[room.sunDirection] || room.sunDirection || '-'}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>주소</span>
                <span className={styles.specValue}>{room.buildingAddr}</span>
              </div>
              {room.buildingDesc && (
                <div className={styles.specItem} style={{ gridColumn: '1/-1' }}>
                  <span className={styles.specLabel}>빌딩 소개</span>
                  <span className={styles.specValue}>{room.buildingDesc}</span>
                </div>
              )}
            </div>

            {/* 옵션 */}
            {options.length > 0 && (
              <div className={styles.optionBlock}>
                <p className={styles.optionTitle}>포함 옵션</p>
                <div className={styles.optionTags}>
                  {options.map((o) => (
                    <span key={o} className={styles.optionTag}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── 방 예약 버튼 ── */}
            {room?.roomSt !== 'available' ? (
              <>
                <button
                  className={styles.tourReservationBtn}
                  type="button"
                  disabled
                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                >
                  📅 방 사전 방문 예약하기
                </button>
                <p
                  className={styles.tourReservationHint}
                  style={{ color: '#c0392b' }}
                >
                  현재 이 방은 예약이 불가합니다 (
                  {{
                    reserved: '예약 중',
                    contracted: '계약 중',
                    repair: '수리 중',
                    cleaning: '청소 중',
                  }[room?.roomSt] || room?.roomSt}
                  )
                </p>
              </>
            ) : (
              <>
                <button
                  className={styles.tourReservationBtn}
                  onClick={handleTourReservation}
                  type="button"
                >
                  📅 방 사전 방문 예약하기
                </button>
                <p className={styles.tourReservationHint}>
                  방문 예약 후 현장에서 직접 확인해보세요
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── 방 설명 ── */}
        {room.roomDesc && (
          <section className={styles.descSection}>
            <h2 className={styles.sectionTitle}>방 소개</h2>
            <p className={styles.descText}>{room.roomDesc}</p>
          </section>
        )}

        {/* ── 같은 건물 공용공간 ── */}
        <section className={styles.spacesSection}>
          <div className={styles.spacesSectionHeader}>
            <h2 className={styles.sectionTitle}>🛋️ 같은 건물 공용공간</h2>
            {spaces.length > 0 && (
              <button
                className={styles.spacesSeeAll}
                onClick={() =>
                  navigate(
                    `/spaces?buildingId=${room.buildingId}&buildingNm=${encodeURIComponent(room.buildingNm)}`
                  )
                }
                type="button"
              >
                전체 보기 →
              </button>
            )}
          </div>

          {spacesLoading && (
            <p className={styles.spacesLoading}>공용공간 불러오는 중...</p>
          )}
          {!spacesLoading && spaces.length === 0 && (
            <p className={styles.spacesEmpty}>
              이 건물에 등록된 공용공간이 없습니다.
            </p>
          )}
          {!spacesLoading && spaces.length > 0 && (
            <div className={styles.spacesMiniGrid}>
              {spaces.map((space) => (
                <SpaceMiniCard
                  key={space.spaceId}
                  space={space}
                  onClick={(id) => navigate(`/spaces/${id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 리뷰 섹션 ── */}
        <section className={styles.reviewSection}>
          <div className={styles.reviewSectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>리뷰</h2>
              {reviewSummary && (
                <div className={styles.reviewSummaryLine}>
                  <StarRating value={reviewSummary.avgRating} size="md" />
                  <span className={styles.reviewSummaryVal}>
                    {reviewSummary.avgRating.toFixed(1)}
                  </span>
                  <span className={styles.reviewSummaryCount}>
                    · 총 {reviewSummary.reviewCount}개
                  </span>
                </div>
              )}
            </div>
            {!showReviewForm && (
              <button
                className={styles.writeReviewBtn}
                onClick={handleWriteReview}
              >
                ✏️ 리뷰 작성
              </button>
            )}
          </div>

          {/* 권한 에러 메시지 */}
          {permError && (
            <div
              style={{
                background: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#c53030',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              🚫 {permError}
            </div>
          )}
          {showReviewForm && (
            <div
              data-review-form
              style={{
                background: '#fdf8f2',
                border: '1px solid #e8dfd0',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#3a2e20',
                  }}
                >
                  ✏️ 리뷰 작성
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#9a8c70',
                  }}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleInlineSubmit}>
                {/* 별점 */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '8px',
                    }}
                  >
                    별점 <span style={{ color: '#e53e3e' }}>*</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '28px',
                          color:
                            s <= (inlineHover || inlineRating)
                              ? '#f6b93b'
                              : '#d7cebc',
                          padding: '0',
                        }}
                        onMouseEnter={() => setInlineHover(s)}
                        onMouseLeave={() => setInlineHover(0)}
                        onClick={() => setInlineRating(s)}
                      >
                        ★
                      </button>
                    ))}
                    {inlineRating > 0 && (
                      <span
                        style={{
                          fontSize: '13px',
                          color: '#ba8037',
                          marginLeft: '8px',
                          lineHeight: '36px',
                        }}
                      >
                        {
                          [
                            '',
                            '별로예요',
                            '그저 그래요',
                            '보통이에요',
                            '좋아요',
                            '최고예요',
                          ][inlineRating]
                        }
                      </span>
                    )}
                  </div>
                </div>
                {/* 제목 */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '6px',
                    }}
                  >
                    제목
                  </label>
                  <input
                    type="text"
                    placeholder="제목을 입력하세요 (선택)"
                    maxLength={100}
                    value={inlineTitle}
                    onChange={(e) => setInlineTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e8dfd0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {/* 내용 */}
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '6px',
                    }}
                  >
                    내용
                  </label>
                  <textarea
                    placeholder="리뷰 내용을 입력하세요 (선택)"
                    maxLength={3000}
                    rows={4}
                    value={inlineCtnt}
                    onChange={(e) => setInlineCtnt(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e8dfd0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#fff',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {/* 사진 */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#5a4a30',
                      marginBottom: '8px',
                    }}
                  >
                    사진 ({inlineFiles.length}/5)
                  </div>
                  <div
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                  >
                    {inlinePreviews.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '72px',
                          height: '72px',
                        }}
                      >
                        <img
                          src={url}
                          alt=""
                          style={{
                            width: '72px',
                            height: '72px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #e8dfd0',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = inlineFiles.filter(
                              (_, i) => i !== idx
                            );
                            setInlineFiles(updated);
                            setInlinePreviews(
                              updated.map((f) => URL.createObjectURL(f))
                            );
                          }}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            background: '#3a2e20',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {inlineFiles.length < 5 && (
                      <button
                        type="button"
                        onClick={() => inlineFileRef.current?.click()}
                        style={{
                          width: '72px',
                          height: '72px',
                          border: '2px dashed #d7cebc',
                          borderRadius: '6px',
                          background: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          color: '#9a8c70',
                          fontSize: '11px',
                        }}
                      >
                        <span style={{ fontSize: '20px' }}>＋</span>사진 추가
                      </button>
                    )}
                  </div>
                  <input
                    ref={inlineFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleInlineFileChange}
                  />
                </div>
                {(inlineValidErr || reviewApiError) && (
                  <p
                    style={{
                      color: '#e53e3e',
                      fontSize: '13px',
                      marginBottom: '12px',
                    }}
                  >
                    {inlineValidErr || reviewApiError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    style={{
                      background: '#ba8037',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: reviewSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {reviewSubmitting ? '저장 중...' : '리뷰 등록'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    style={{
                      background: '#f5f0e8',
                      color: '#5a4a30',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {inlineSuccess && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#166534',
                fontSize: '14px',
              }}
            >
              ✅ 리뷰가 등록되었습니다!
            </div>
          )}

          {reviewLoading && (
            <div className={styles.reviewLoadingRow}>
              <div className={styles.spinnerSm} /> 리뷰 불러오는 중...
            </div>
          )}
          {!reviewLoading && reviews.length === 0 && (
            <div className={styles.reviewEmpty}>
              <p>아직 작성된 리뷰가 없습니다.</p>
              <button
                className={styles.writeReviewBtnSm}
                onClick={handleWriteReview}
              >
                첫 리뷰를 남겨보세요 →
              </button>
            </div>
          )}
          {!reviewLoading && reviews.length > 0 && (
            <div className={styles.reviewList}>
              {reviews.map((r) => (
                <ReviewCard key={r.reviewId} review={r} />
              ))}
            </div>
          )}
          {reviewTotalPages > 1 && (
            <div className={styles.reviewPagination}>
              <button
                disabled={reviewPage === 1}
                onClick={() => setReviewPage((p) => p - 1)}
                className={styles.rpBtn}
              >
                ‹
              </button>
              {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    className={`${styles.rpBtn} ${p === reviewPage ? styles.rpBtnActive : ''}`}
                    onClick={() => setReviewPage(p)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={reviewPage === reviewTotalPages}
                onClick={() => setReviewPage((p) => p + 1)}
                className={styles.rpBtn}
              >
                ›
              </button>
            </div>
          )}
        </section>
      </div>

      <Footer />

      {/* ── 사전방문 예약 팝업 ── */}
      <Modal
        open={tourCreateOpen}
        onClose={() => setTourCreateOpen(false)}
        title="📅 사전 방문 예약"
        size="lg"
      >
        <TourReservationCreate
          inlineMode
          initRoomId={String(roomId)}
          initBuildingId={room?.buildingId ? Number(room.buildingId) : null}
          onSuccess={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
          onClose={() => setTourCreateOpen(false)}
          onGoList={() => {
            setTourCreateOpen(false);
            setTourListOpen(true);
          }}
        />
      </Modal>

      {/* ── 사전방문 조회 팝업 ── */}
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
    </div>
  );
}
