// features/community/pages/MyPosts.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // 탭: 'boards' | 'replies' | 'reviews'
  const [tab, setTab] = useState('boards');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewModal, setReviewModal] = useState(null); // { mode, reviewId }

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
      <div className={styles.listHeader}>
        <span className={styles.total}>총 {totalElements}건</span>
      </div>

      {/* ── 목록 ── */}
      {loading ? (
        <div className={styles.loading}>조회 중…</div>
      ) : error ? (
        <div className={styles.error}>⚠️ {error}</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            {tab === 'boards' ? '📝' : tab === 'replies' ? '💬' : '⭐'}
          </span>
          <p>
            작성한{' '}
            {tab === 'boards' ? '게시글' : tab === 'replies' ? '댓글' : '후기'}
            이 없습니다.
          </p>
        </div>
      ) : tab === 'reviews' ? (
        /* ── 후기 카드 ── */
        <div className={styles.reviewList}>
          {items.map((r) => (
            <div
              key={r.reviewId}
              className={styles.reviewCard}
              onClick={() =>
                setReviewModal({ mode: 'detail', reviewId: r.reviewId })
              }
            >
              {r.thumbnailUrl && (
                <div className={styles.reviewThumb}>
                  <img
                    src={toApiImageUrl(r.thumbnailUrl)}
                    alt="후기 이미지"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className={styles.reviewBody}>
                <div className={styles.reviewMeta}>
                  <Stars value={r.rating} />
                  <span className={styles.reviewRoom}>
                    {r.buildingNm ?? ''}
                    {r.roomNo != null ? ` ${r.roomNo}호` : ''}
                  </span>
                  <span className={styles.reviewDate}>
                    {String(r.createdAt ?? '').slice(0, 10)}
                  </span>
                </div>
                <p className={styles.reviewTitle}>
                  {r.reviewTitle ?? '(제목 없음)'}
                </p>
                <p className={styles.reviewCtnt}>
                  {String(r.reviewCtnt ?? '').length > 80
                    ? String(r.reviewCtnt).slice(0, 80) + '…'
                    : (r.reviewCtnt ?? '')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── 게시글/댓글 테이블 ── */
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNum}>번호</th>
              <th className={styles.colTitle}>
                {tab === 'replies' ? '댓글 내용' : '제목'}
              </th>
              <th className={styles.colDate}>날짜</th>
              {tab !== 'replies' && <th className={styles.colView}>조회</th>}
              <th className={styles.colLike}>❤️</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const id = item.boardId ?? item.replyId ?? idx;
              // 댓글은 replyCtnt, 게시글은 boardTitle
              const title =
                item.boardTitle ??
                item.replyCtnt ??
                item.replyContent ??
                item.content ??
                '-';
              const date = String(item.createdAt ?? '').slice(0, 10);
              const views = item.readCount ?? item.viewCnt ?? '-';
              const likes = item.likeCount ?? item.likeCnt ?? 0;
              // 댓글은 해당 게시글로 이동, 게시글은 상세로 이동
              const targetBoardId =
                item.boardId ?? (tab === 'boards' ? item.id : null);
              return (
                <tr
                  key={id}
                  className={styles.row}
                  onClick={() => {
                    if (targetBoardId) navigate(`/community/${targetBoardId}`);
                  }}
                  style={{
                    cursor: targetBoardId ? 'pointer' : 'default',
                  }}
                >
                  <td className={styles.colNum}>{(page - 1) * 10 + idx + 1}</td>
                  <td className={styles.colTitle}>
                    {tab === 'replies' && (
                      <span
                        style={{
                          fontSize: 11,
                          color: '#888',
                          marginRight: 4,
                          background: '#f3f4f6',
                          borderRadius: 4,
                          padding: '1px 5px',
                        }}
                      >
                        💬 댓글
                      </span>
                    )}
                    {String(title).length > 40
                      ? String(title).slice(0, 40) + '…'
                      : title}
                  </td>
                  <td className={styles.colDate}>{date}</td>
                  {tab !== 'replies' && (
                    <td className={styles.colView}>{views}</td>
                  )}
                  <td className={styles.colLike}>
                    <span className={styles.likeChip}>♥ {likes}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

      {reviewModal && (
        <ReviewModal
          mode={reviewModal.mode}
          reviewId={reviewModal.reviewId}
          onClose={() => setReviewModal(null)}
          onSaved={() => {
            setReviewModal(null);
            load(tab, category, page);
          }}
        />
      )}
    </div>
  );
}
