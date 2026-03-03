// features/review/pages/MyReviewsDetail.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReviewDetail, useReviewActions } from '../hooks/useReviews';
import { useAuth } from '../../user/hooks/useAuth';
import { adminApi } from '../../admin/api/adminApi';
import UserStatusModal from '../../user/components/UserStatusModal';
import styles from './ReviewDetail.module.css';
import { toApiImageUrl } from '../../file/api/fileApi';

function StarRating({ rating }) {
  return (
    <span className={styles.stars} aria-label={`별점 ${rating}점`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? styles.starOn : styles.starOff}>
          ★
        </span>
      ))}
    </span>
  );
}

function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: 36,
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          style={{
            position: 'absolute',
            left: 16,
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            fontSize: 28,
            width: 48,
            height: 48,
            borderRadius: '50%',
            cursor: 'pointer',
          }}
        >
          ‹
        </button>
      )}
      <img
        src={images[current]}
        alt={`리뷰 이미지 ${current + 1}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      />
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          style={{
            position: 'absolute',
            right: 16,
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            fontSize: 28,
            width: 48,
            height: 48,
            borderRadius: '50%',
            cursor: 'pointer',
          }}
        >
          ›
        </button>
      )}
      {images.length > 1 && (
        <div
          style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 6 }}
        >
          {images.map((_, i) => (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                cursor: 'pointer',
                background: i === current ? '#d9ad5b' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyReviewsDetail() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { review, loading, error } = useReviewDetail(Number(reviewId));
  const { remove, submitting } = useReviewActions();
  const [lightbox, setLightbox] = useState(null);
  const [userStatusModalId, setUserStatusModalId] = useState(null);

  const isAdmin = String(user?.userRole ?? '').toLowerCase() === 'admin';

  const handleDelete = async () => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;
    const ok = await remove(Number(reviewId));
    if (ok) navigate('/reviews/my', { replace: true });
  };

  const handleAdminDelete = async () => {
    if (!window.confirm('관리자 권한으로 이 리뷰를 삭제할까요?')) return;
    try {
      await adminApi.adminDeleteReview(Number(reviewId));
      navigate(-1);
    } catch (e) {
      window.alert(e?.message || '삭제 실패');
    }
  };

  if (loading)
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} />
        </div>
      </div>
    );
  if (error || !review)
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{error ?? '리뷰를 찾을 수 없어요.'}</p>
      </div>
    );

  const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  const imageFiles = (review.files ?? []).filter((f) => {
    const t = (f.fileType || '').toLowerCase();
    return IMAGE_EXTS.includes(t) || t === 'image';
  });
  const imageUrls = imageFiles.map((f) => toApiImageUrl(f.viewUrl));

  return (
    <div className={styles.container}>
      {lightbox !== null && (
        <Lightbox
          images={imageUrls}
          index={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className={styles.header}>
        <button
          className={styles.backBtn}
          type="button"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className={styles.title}>리뷰 상세</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.editBtn}
            type="button"
            onClick={() => navigate(`/reviews/${reviewId}/edit`)}
          >
            수정
          </button>
          <button
            className={styles.deleteBtn}
            type="button"
            onClick={handleDelete}
            disabled={submitting}
          >
            삭제
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleAdminDelete}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              🗑 관리자 삭제
            </button>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* 작성자 정보 (관리자용) */}
        {isAdmin && review?.userId && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 14px',
              background: '#f0f9ff',
              borderRadius: 8,
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: '#555' }}>작성자:</span>
            <button
              type="button"
              onClick={() => setUserStatusModalId(review.userId)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                padding: 0,
              }}
              title="회원 정보/상태 변경"
            >
              {review.userId}
              {review.userNickname ? ` (${review.userNickname})` : ''}
            </button>
          </div>
        )}
        <div className={styles.roomBadge}>
          <span className={styles.buildingNm}>
            {review.buildingNm ?? '건물 정보 없음'}
          </span>
          {review.roomNo != null && (
            <span className={styles.roomNo}>{review.roomNo}호</span>
          )}
        </div>

        <div className={styles.ratingRow}>
          <StarRating rating={review.rating} />
          <span className={styles.ratingNum}>{review.rating}.0</span>
        </div>

        {review.reviewTitle && (
          <h2 className={styles.reviewTitle}>{review.reviewTitle}</h2>
        )}

        {imageUrls.length > 0 && (
          <div className={styles.imageGrid}>
            {imageUrls.map((url, idx) => (
              <img
                key={idx}
                className={styles.reviewImg}
                src={url}
                alt={`리뷰 이미지 ${idx + 1}`}
                style={{ cursor: 'zoom-in' }}
                onClick={() => setLightbox(idx)}
              />
            ))}
          </div>
        )}

        {review.reviewCtnt && (
          <p className={styles.reviewCtnt}>{review.reviewCtnt}</p>
        )}

        <p className={styles.date}>
          작성일:{' '}
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString('ko-KR')
            : ''}
          {review.updatedAt && review.updatedAt !== review.createdAt && (
            <span className={styles.updatedAt}>
              {' '}
              (수정됨: {new Date(review.updatedAt).toLocaleDateString('ko-KR')})
            </span>
          )}
        </p>
      </div>

      {isAdmin && userStatusModalId && (
        <UserStatusModal
          userId={userStatusModalId}
          currentUserId={user?.userId}
          onClose={() => setUserStatusModalId(null)}
        />
      )}
    </div>
  );
}
