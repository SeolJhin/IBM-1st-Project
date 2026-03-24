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
  order: '주문',
  contract: '계약',
  support: '고객지원',
  security: '보안',
};

function getNotificationLabel(item) {
  const code = String(item?.code || '').toUpperCase();
  if (code.startsWith('PAY_')) return '결제';
  if (code.startsWith('ORDER_')) return '주문';
  if (code.startsWith('CONTRACT_')) return '계약';
  if (code.startsWith('QNA_') || code.startsWith('COMP_')) return '고객지원';
  if (code.startsWith('SP_')) return '공간예약';
  if (code.startsWith('TOUR_')) return '투어';
  if (code.startsWith('BRD_') || code.startsWith('RPL_')) return '커뮤니티';
  if (code.startsWith('RVW_') || code === 'ADM_RVW_DEL') return '리뷰';
  if (code.startsWith('SEC_') || code.startsWith('ADM_')) return '보안';
  if (code === 'BILL_NEW') return '청구서';
  if (code === 'ADMIN_NOTICE') return '공지사항';
  return TARGET_LABEL[item?.target] ?? '알림';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  let parsed;
  if (Array.isArray(dateStr)) {
    const [y, mo, d, h = 0, mi = 0, s = 0] = dateStr;
    parsed = new Date(y, mo - 1, d, h, mi, s);
  } else {
    const str = String(dateStr);
    parsed = str.includes('T') && !str.includes('Z') && !str.includes('+')
      ? new Date(str + '+09:00')
      : new Date(str);
  }
  const diff = Date.now() - parsed.getTime();
  if (isNaN(diff) || diff < 0) return '방금';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return parsed.toLocaleDateString('ko-KR');
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
        <span className={styles.typeBadge}>{getNotificationLabel(item)}</span>
        <p className={styles.message}>{localizeNotificationMessage(item)}</p>
        <span className={styles.time}>{timeAgo(item.createdAt)}</span>
      </div>
      <div className={styles.itemRight}>
        <span className={styles.dot} aria-label="읽지 않음" />
        <button
          className={styles.readBtn}
          type="button"
          onClick={handleRead}
          aria-label="삭제"
        >
          삭제
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
            <button
              className={styles.readAllBtn}
              type="button"
              onClick={markAllRead}
            >
              모두 삭제
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
