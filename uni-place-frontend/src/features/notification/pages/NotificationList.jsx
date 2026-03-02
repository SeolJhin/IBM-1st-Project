import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { localizeNotificationMessage } from '../utils/localizeNotificationMessage';
import { resolveNotificationPath } from '../utils/resolveNotificationPath';
import styles from './NotificationList.module.css';

const Header = lazy(() => import('../../../app/layouts/components/Header'));

const TARGET_LABEL = {
  board: '게시글',
  reply: '댓글',
  notice: '공지사항',
  tour: '투어',
  space: '공간예약',
  review: '리뷰',
  payment: '결제',
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
  const handleNavigate = () => {
    const nextPath = resolveNotificationPath(item);
    if (nextPath) onNavigate(nextPath);
  };

  const handleRead = (e) => {
    e.stopPropagation();
    onRead(item.notificationId);
  };

  return (
    <div
      className={`${styles.item} ${styles.unread}`}
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
    >
      <div className={styles.itemLeft}>
        <span className={styles.typeBadge}>
          {TARGET_LABEL[item.target] ?? item.target ?? '알림'}
        </span>
        <p className={styles.message}>{localizeNotificationMessage(item)}</p>
        <span className={styles.time}>{timeAgo(item.createdAt)}</span>
      </div>
      <div className={styles.itemRight}>
        <span className={styles.dot} aria-label="읽지 않음" />
        <button
          className={styles.readBtn}
          type="button"
          onClick={handleRead}
          aria-label="읽음 처리"
        >
          읽음
        </button>
      </div>
    </div>
  );
}

export default function NotificationList({ inlineMode = false }) {
  const navigate = useNavigate();

  const {
    items,
    unreadCount,
    loading,
    error,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
  } = useNotifications({ autoFetch: true });

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
            <button className={styles.readAllBtn} type="button" onClick={markAllRead}>
              모두 읽음
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
