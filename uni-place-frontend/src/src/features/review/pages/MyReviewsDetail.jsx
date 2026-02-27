// features/review/pages/MyReviewsDetail.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReviewDetail, useReviewActions } from '../hooks/useReviews';
import styles from './ReviewDetail.module.css';

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

export default function MyReviewsDetail() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { review, loading, error } = useReviewDetail(Number(reviewId));
  const { remove, submitting } = useReviewActions();

  const handleDelete = async () => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;
    const ok = await remove(Number(reviewId));
    if (ok) navigate('/reviews/my', { replace: true });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className={styles.container}>
        <p className={styles.errorMsg}>{error ?? '리뷰를 찾을 수 없어요.'}</p>
      </div>
    );
  }

  const imageFiles = (review.files ?? []).filter((f) => {
    const ext = (f.fileType || '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });

  return (
    <div className={styles.container}>
      {/* 헤더 */}
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
        </div>
      </div>

      {/* 본문 */}
      <div className={styles.body}>
        {/* 방 정보 */}
        <div className={styles.roomBadge}>
          <span className={styles.buildingNm}>
            {review.buildingNm ?? '건물 정보 없음'}
          </span>
          {review.roomNo != null && (
            <span className={styles.roomNo}>{review.roomNo}호</span>
          )}
        </div>

        {/* 별점 */}
        <div className={styles.ratingRow}>
          <StarRating rating={review.rating} />
          <span className={styles.ratingNum}>{review.rating}.0</span>
        </div>

        {/* 제목 */}
        {review.reviewTitle && (
          <h2 className={styles.reviewTitle}>{review.reviewTitle}</h2>
        )}

        {/* 이미지 */}
        {imageFiles.length > 0 && (
          <div className={styles.imageGrid}>
            {imageFiles.map((f) => (
              <img
                key={f.fileId}
                className={styles.reviewImg}
                src={f.viewUrl}
                alt="리뷰 이미지"
              />
            ))}
          </div>
        )}

        {/* 본문 */}
        {review.reviewCtnt && (
          <p className={styles.reviewCtnt}>{review.reviewCtnt}</p>
        )}

        {/* 날짜 */}
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
    </div>
  );
}
