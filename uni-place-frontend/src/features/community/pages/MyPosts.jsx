// features/community/pages/MyPosts.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { communityApi } from '../api/communityApi';
import { reviewApi } from '../../review/api/reviewApi';
import ReviewModal from '../../review/components/ReviewModal';
import styles from './MyPosts.module.css';
import { toApiImageUrl } from '../../file/api/fileApi';

const BOARD_CATEGORIES = [
  { value: 'ALL', label: '전체' },
  { value: 'FREE', label: '자유' },
  { value: 'QUESTION', label: '질문' },
];

// 별점
function Stars({ value = 0 }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= value ? '#d9ad5b' : '#ddd' }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function MyPosts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 탭: 'boards' | 'replies' | 'reviews'
  // URL ?postTab=reviews 로 직접 진입 지원 (AI 챗봇 내 리뷰 버튼용)
  const [tab, setTab] = useState(() => {
    const pt = searchParams.get('postTab');
    return ['boards', 'replies', 'reviews'].includes(pt) ? pt : 'boards';
  });
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { mode, reviewId }
  const [openReviewId, setOpenReviewId] = useState(null);

  const load = useCallback(async (t, cat, pg) => {
    setLoading(true);
    setError('');
    try {
      let result;
      if (t === 'boards') {
        result = await communityApi.myBoards({
          page: pg,
          size: 10,
          boardType: cat,
        });
      } else if (t === 'replies') {
        result = await communityApi.myReplies({ page: pg, size: 10 });
      } else if (t === 'reviews') {
        result = await reviewApi.getMyList({ page: pg - 1, size: 10 });
      }
      setData(result);
    } catch (e) {
      setError(e?.message || '조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab, category, page);
  }, [tab, category, page, load]);

  const handleTabChange = (t) => {
    setTab(t);
    setCategory('ALL');
    setPage(1);
    setData(null);
  };

  const handleCatChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className={styles.wrap}>
      {/* ── 탭 ── */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'boards' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('boards')}
        >
          <span className={styles.tabIcon}>📝</span>
          <span className={styles.tabLabel}>게시글</span>
          {tab === 'boards' && totalElements > 0 && (
            <span className={styles.tabBadge}>{totalElements}</span>
          )}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'replies' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('replies')}
        >
          <span className={styles.tabIcon}>💬</span>
          <span className={styles.tabLabel}>댓글</span>
          {tab === 'replies' && totalElements > 0 && (
            <span className={styles.tabBadge}>{totalElements}</span>
          )}
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'reviews' ? styles.tabActive : ''}`}
          onClick={() => handleTabChange('reviews')}
        >
          <span className={styles.tabIcon}>⭐</span>
          <span className={styles.tabLabel}>후기</span>
          {tab === 'reviews' && totalElements > 0 && (
            <span className={styles.tabBadge}>{totalElements}</span>
          )}
        </button>
      </div>

      {/* ── 카테고리 필터 (게시글 탭만) ── */}
      {tab === 'boards' && (
        <div className={styles.catRow}>
          {BOARD_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`${styles.catBtn} ${category === c.value ? styles.catBtnActive : ''}`}
              onClick={() => handleCatChange(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* ── 헤더 ── */}
      {totalElements > 0 && (
        <div className={styles.listHeader}>
          <span className={styles.total}>총 {totalElements}건</span>
        </div>
      )}

      {/* ── 목록 ── */}
      {loading ? (
        <div className={styles.loading}>조회 중…</div>
      ) : error ? (
        <div className={styles.error}>⚠️ {error}</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            작성한{' '}
            {tab === 'boards' ? '게시글' : tab === 'replies' ? '댓글' : '후기'}
            이 없습니다.
          </p>
        </div>
      ) : tab === 'reviews' ? (
        /* ── 후기 카드 (게시글 카드와 동일 스타일) ── */
        <div className={styles.boardList}>
          {items.map((r) => (
            <React.Fragment key={r.reviewId}>
              <div
                className={`${styles.boardCard} ${openReviewId === r.reviewId ? styles.boardCardOpen : ''}`}
                onClick={() => {
                  if (openReviewId === r.reviewId) {
                    setOpenReviewId(null);
                    setReviewModal(null);
                  } else {
                    setOpenReviewId(r.reviewId);
                    setReviewModal({ mode: 'detail', reviewId: r.reviewId });
                  }
                }}
              >
                <div className={styles.boardCardTop}>
                  <div className={styles.boardCardMeta}>
                    <span className={styles.categoryTag}>후기</span>
                    <span style={{ fontSize: 12, color: '#d9ad5b', letterSpacing: 1 }}>
                      {'★'.repeat(Math.max(0, Math.min(5, r.rating ?? 0)))}
                      {'☆'.repeat(Math.max(0, 5 - Math.min(5, r.rating ?? 0)))}
                    </span>
                    {(r.buildingNm || r.roomNo != null) && (
                      <span className={styles.reviewRoomTag}>
                        {r.buildingNm ?? ''}{r.roomNo != null ? ` ${r.roomNo}호` : ''}
                      </span>
                    )}
                    <span className={styles.boardCardDate}>
                      {String(r.createdAt ?? '').slice(0, 10)}
                    </span>
                  </div>
                  {r.thumbnailUrl && (
                    <div className={styles.reviewThumbSmall}>
                      <img
                        src={toApiImageUrl(r.thumbnailUrl)}
                        alt="후기 이미지"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                <p className={styles.boardCardTitle}>
                  {r.reviewTitle ?? '(제목 없음)'}
                </p>
                {r.reviewCtnt && (
                  <p className={styles.reviewExcerpt}>
                    {String(r.reviewCtnt).length > 80
                      ? String(r.reviewCtnt).slice(0, 80) + '…'
                      : r.reviewCtnt}
                  </p>
                )}
                <div className={`${styles.boardCardArrow} ${openReviewId === r.reviewId ? styles.boardCardArrowOpen : ''}`}>›</div>
              </div>
              {openReviewId === r.reviewId && reviewModal && (
                <ReviewModal
                  mode={reviewModal.mode}
                  reviewId={reviewModal.reviewId}
                  noOverlay
                  onClose={() => { setReviewModal(null); setOpenReviewId(null); }}
                  onSaved={() => {
                    setReviewModal(null);
                    setOpenReviewId(null);
                    load(tab, category, page);
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        /* ── 게시글/댓글 카드 리스트 ── */
        <div className={styles.boardList}>
          {items.map((item, idx) => {
            const id = item.boardId ?? item.replyId ?? idx;
            const title =
              item.boardTitle ??
              item.replyCtnt ??
              item.replyContent ??
              item.content ??
              '-';
            const date = String(item.createdAt ?? '').slice(0, 10);
            const views = item.readCount ?? item.viewCnt ?? null;
            const likes = item.likeCount ?? item.likeCnt ?? 0;
            const targetBoardId =
              item.boardId ?? (tab === 'boards' ? item.id : null);
            const categoryLabel =
              item.boardType === 'FREE' ? '자유' :
              item.boardType === 'QUESTION' ? '질문' : null;
            return (
              <div
                key={id}
                className={styles.boardCard}
                onClick={() => {
                  if (targetBoardId) navigate(`/community/${targetBoardId}`);
                }}
                style={{ cursor: targetBoardId ? 'pointer' : 'default' }}
              >
                <div className={styles.boardCardTop}>
                  <div className={styles.boardCardMeta}>
                    {tab === 'replies' && (
                      <span className={styles.replyTag}>댓글</span>
                    )}
                    {categoryLabel && tab !== 'replies' && (
                      <span className={styles.categoryTag}>{categoryLabel}</span>
                    )}
                    <span className={styles.boardCardDate}>{date}</span>
                  </div>
                  <div className={styles.boardCardStats}>
                    {views !== null && tab !== 'replies' && (
                      <span className={styles.boardCardStat}>
                        <span className={styles.statIcon}>👁</span>{views}
                      </span>
                    )}
                    <span className={`${styles.boardCardStat} ${styles.statLike}`}>
                      ♥ {likes}
                    </span>
                  </div>
                </div>
                <p className={styles.boardCardTitle}>
                  {String(title).length > 60
                    ? String(title).slice(0, 60) + '…'
                    : title}
                </p>
                <div className={styles.boardCardArrow}>›</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 페이징 ── */}
      {!loading && totalPages > 1 && (
        <div className={styles.paging}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      )}

    </div>
  );
}
