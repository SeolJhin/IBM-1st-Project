// features/review/pages/MyReviewsList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyReviews, useReviewActions } from '../hooks/useReviews';
import ReviewModal from '../components/ReviewModal';
import styles from './ReviewList.module.css';
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

function ReviewCard({ review, onView, onEdit, onDelete }) {
  return (
    <div
      className={styles.card}
      onClick={() => onView(review.reviewId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(review.reviewId)}
    >
      <div className={styles.cardTop}>
        <div className={styles.roomInfo}>
          <span className={styles.buildingNm}>
            {review.buildingNm ?? '건물 정보 없음'}
          </span>
          {review.roomNo != null && (
            <span className={styles.roomNo}>{review.roomNo}호</span>
          )}
        </div>
        <StarRating rating={review.rating} />
      </div>

      {review.thumbnailUrl && (
        <img
          className={styles.thumbnail}
          src={toApiImageUrl(review.thumbnailUrl)}
          alt="리뷰 이미지"
        />
      )}

      {review.reviewTitle && (
        <p className={styles.reviewTitle}>{review.reviewTitle}</p>
      )}
      {review.reviewCtnt && (
        <p className={styles.reviewCtnt}>{review.reviewCtnt}</p>
      )}

      <div className={styles.cardBottom}>
        <span className={styles.date}>
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString('ko-KR')
            : ''}
        </span>
        <span className={styles.readCount}>👁 {review.readCount ?? 0}</span>
        <span className={styles.readCount}>🤍 {review.likeCount ?? 0}</span>
        <div
          className={styles.actions}
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <button
            className={styles.editBtn}
            type="button"
            onClick={() => onEdit(review.reviewId)}
          >
            수정
          </button>
          <button
            className={styles.deleteBtn}
            type="button"
            onClick={() => onDelete(review.reviewId)}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ pagination, onPage }) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;
  return (
    <div className={styles.paging}>
      <button
        className={styles.pageBtn}
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        type="button"
      >
        이전
      </button>
      <span className={styles.pageInfo}>
        {page + 1} / {totalPages}
      </span>
      <button
        className={styles.pageBtn}
        disabled={page + 1 >= totalPages}
        onClick={() => onPage(page + 1)}
        type="button"
      >
        다음
      </button>
    </div>
  );
}

export default function MyReviewsList() {
  const navigate = useNavigate();
  const { reviews, pagination, loading, error, goToPage, refetch } =
    useMyReviews();
  const { remove, submitting } = useReviewActions();
  const [reviewModal, setReviewModal] = useState(null); // { mode, reviewId }

  // 다른 페이지(상세 등) 다녀온 뒤 탭이 다시 활성화되면 즉시 refetch → readCount 즉시 반영
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetch]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return;
    const ok = await remove(reviewId);
    if (ok) refetch();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          type="button"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1 className={styles.title}>내 리뷰</h1>
        <button
          className={styles.writeBtn}
          type="button"
          onClick={() => navigate('/reviews/write')}
        >
          + 리뷰 작성
        </button>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {loading ? (
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} />
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📝</span>
          <p>작성한 리뷰가 없어요</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {reviews.map((r) => (
              <ReviewCard
                key={r.reviewId}
                review={r}
                onView={(id) => navigate(`/reviews/${id}`)}
                onEdit={(id) => setReviewModal({ mode: 'edit', reviewId: id })}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <Pagination pagination={pagination} onPage={goToPage} />
        </>
      )}

      {submitting && <div className={styles.overlay} />}

      {reviewModal && (
        <ReviewModal
          mode={reviewModal.mode}
          reviewId={reviewModal.reviewId}
          onClose={() => setReviewModal(null)}
          onSaved={() => {
            setReviewModal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
