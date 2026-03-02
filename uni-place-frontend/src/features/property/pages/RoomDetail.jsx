// features/property/pages/RoomDetail.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { propertyApi } from '../api/propertyApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './RoomDetail.module.css';
import ImageGallery from '../../file/components/ImageGallery';

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
  const { user, loading: authLoading } = useAuth(); // ← loading 추가

  const [room, setRoom] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(null);

  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);

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

  const handleTourReservation = () => {
    navigate(
      `/tour-reservation?roomId=${roomId}&buildingId=${room?.buildingId}&roomNo=${room?.roomNo}`
    );
  };

  // 계약하기 버튼
  const handleContractApply = () => {
    if (authLoading) return; // ← 인증 로딩 중이면 무시
    if (!user) {
      navigate('/login', { state: { from: `/rooms/${roomId}` } });
      return;
    }
    navigate(`/contracts/apply?roomId=${roomId}`);
  };

  const handleWriteReview = () => {
    if (!user) {
      navigate('/login', { state: { from: `/rooms/${roomId}` } });
      return;
    }
    navigate(`/reviews/write?roomId=${roomId}`);
  };

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
        <div className={styles.breadcrumbInner}>
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

            {/* ── 계약하기 버튼 ── */}
            {room.roomSt === 'available' && (
              <button
                className={styles.contractBtn}
                onClick={() => setShowContractModal(true)}
                type="button"
              >
                📋 계약하기
              </button>
            )}

            {/* ── 방 예약 버튼 ── */}
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
            <button
              className={styles.writeReviewBtn}
              onClick={handleWriteReview}
            >
              ✏️ 리뷰 작성
            </button>
          </div>

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

      {/* ── 계약 확인 모달 ── */}
      {showContractModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(11,14,18,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowContractModal(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '36px 40px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(11,14,18,0.2)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h2
              style={{
                margin: '0 0 10px',
                fontSize: '22px',
                fontWeight: 900,
                color: '#1a1612',
              }}
            >
              계약 신청
            </h2>
            <p
              style={{
                margin: '0 0 24px',
                fontSize: '14px',
                color: '#5a5040',
                lineHeight: '1.7',
              }}
            >
              <strong>{room.buildingNm}</strong>의{' '}
              <strong>{room.roomNo}호</strong>를 계약하시겠습니까?
              <br />
              <span style={{ fontSize: '12px', color: '#9a8c70' }}>
                보증금 {Number(room.deposit || 0).toLocaleString()}원 · 월세{' '}
                {Number(room.rentPrice || 0).toLocaleString()}원
              </span>
            </p>
            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
            >
              <button
                style={{
                  padding: '12px 28px',
                  background: 'none',
                  border: '1.5px solid #e8e0d4',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#9a8c70',
                  cursor: 'pointer',
                }}
                onClick={() => setShowContractModal(false)}
              >
                취소
              </button>
              <button
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #d9ad5b, #ba8037)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(217,173,91,0.35)',
                }}
                onClick={() => {
                  setShowContractModal(false);
                  handleContractApply();
                }}
              >
                계약 신청하러 가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
