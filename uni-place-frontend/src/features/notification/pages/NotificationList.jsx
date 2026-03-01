// src/features/notification/pages/NotificationList.jsx
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import styles from './NotificationList.module.css';

// Header를 lazy로 import → NotificationBell과의 순환 참조 방지
// (NotificationBell → NotificationList → Header → NotificationBell 순환)
const Header = lazy(() => import('../../../app/layouts/components/Header'));

const TARGET_LABEL = {
  board: '게시글',
  reply: '댓글',
  notice: '공지사항',
  tour: '사전방문',
  space: '공용시설',
  review: '리뷰',
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function NotificationItem({ item, onRead, onNavigate }) {
  const isUnread = item.isRead !== 'Y';
  const handleClick = () => {
    if (isUnread) onRead(item.notificationId);
    if (item.urlPath) onNavigate(item.urlPath);
  };
  return (
    <div
      className={`${styles.item} ${isUnread ? styles.unread : styles.read}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className={styles.itemLeft}>
        <span
          className={`${styles.typeBadge} ${!isUnread ? styles.badgeRead : ''}`}
        >
          {TARGET_LABEL[item.target] ?? item.target ?? '알림'}
        </span>
        <p
          className={`${styles.message} ${!isUnread ? styles.messageRead : ''}`}
        >
          {item.message}
        </p>
        <span className={styles.time}>{timeAgo(item.createdAt)}</span>
      </div>
      {isUnread && <span className={styles.dot} aria-label="읽지 않음" />}
    </div>
  );
}

/**
 * inlineMode=true → Header 없이 컨텐츠만 (Modal 안에서 사용)
 */
export default function NotificationList({ inlineMode = false }) {
  const navigate = useNavigate();
  const [deletingRead, setDeletingRead] = useState(false);

  const {
    items,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    deleteRead,
  } = useNotifications({ autoFetch: true });

  const handleDeleteRead = async () => {
    if (!window.confirm('읽은 알림을 모두 삭제할까요?')) return;
    setDeletingRead(true);
    try {
      await deleteRead();
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    } finally {
      setDeletingRead(false);
    }
  };

  const hasReadItems = items.some((n) => n.isRead === 'Y');

  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const content = (
    <div className={inlineMode ? styles.containerInline : styles.container}>
      <div className={styles.pageHeader}>
        {!inlineMode && (
          <button
            className={styles.backBtn}
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로"
          >
            ←
          </button>
        )}
        <h1 className={styles.title} style={inlineMode ? { fontSize: 15 } : {}}>
          알림
        </h1>
        <div className={styles.headerBtns}>
          {unreadCount > 0 && (
            <button
              className={styles.readAllBtn}
              type="button"
              onClick={markAllRead}
            >
              모두 읽음
            </button>
          )}
          {hasReadItems && (
            <button
              className={styles.deleteReadBtn}
              type="button"
              onClick={handleDeleteRead}
              disabled={deletingRead}
            >
              {deletingRead ? '삭제 중…' : '읽은 알림 삭제'}
            </button>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <div className={styles.unreadBanner}>
          읽지 않은 알림 <strong>{unreadCount}개</strong>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && items.length === 0 && !error && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔔</span>
          <p>새로운 알림이 없어요</p>
        </div>
      )}

      <div className={styles.list}>
        {items.map((item) => (
          <NotificationItem
            key={item.notificationId}
            item={item}
            onRead={markRead}
            onNavigate={navigate}
          />
        ))}
      </div>

      <div ref={sentinelRef} className={styles.sentinel} />

      {loading && (
        <div className={styles.loadingWrap}>
          <span className={styles.spinner} />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className={styles.endMsg}>모든 알림을 확인했어요</p>
      )}
    </div>
  );

  if (inlineMode) return content;

  return (
    <Suspense fallback={null}>
      <Header />
      {content}
    </Suspense>
  );
}
