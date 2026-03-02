import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../../features/notification/api/notificationApi';
import { localizeNotificationMessage } from '../../../features/notification/utils/localizeNotificationMessage';
import { resolveNotificationPath } from '../../../features/notification/utils/resolveNotificationPath';
import Modal from '../../../shared/components/Modal/Modal';
import styles from './NotificationBell.module.css';

const NotificationList = lazy(
  () => import('../../../features/notification/pages/NotificationList')
);

const TARGET_LABEL = {
  board: '게시글',
  reply: '댓글',
  notice: '공지사항',
  tour: '투어',
  space: '공간예약',
  review: '리뷰',
  payment: '결제',
};

function isAuthError(error) {
  const status = Number(error?.response?.status || error?.status || 0);
  return status === 401 || status === 403;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notiModalOpen, setNotiModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);
  const pollBlockedRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (pollBlockedRef.current) return;
    try {
      const res = await notificationApi.getUnread({ page: 0, size: 1 });
      setUnreadCount(res?.unreadCount ?? 0);
    } catch (error) {
      if (isAuthError(error)) {
        pollBlockedRef.current = true;
      }
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  const loadDropdown = useCallback(async () => {
    if (pollBlockedRef.current) return;
    setLoading(true);
    try {
      const res = await notificationApi.getUnread({ page: 0, size: 20 });
      setItems(res?.notifications?.content ?? []);
      setUnreadCount(res?.unreadCount ?? 0);
    } catch (error) {
      if (isAuthError(error)) {
        pollBlockedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next) loadDropdown();
  }, [open, loadDropdown]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = useCallback(async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markRead(notificationId);
      setItems((prev) => prev.filter((n) => n.notificationId !== notificationId));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  const handleItemClick = useCallback(
    (item) => {
      setOpen(false);
      const nextPath = resolveNotificationPath(item);
      if (nextPath) navigate(nextPath);
    },
    [navigate]
  );

  const goToAll = () => {
    setOpen(false);
    setNotiModalOpen(true);
  };

  return (
    <>
      <div className={styles.wrap} ref={dropRef}>
        <button
          className={styles.bellBtn}
          type="button"
          aria-label="알림"
          aria-expanded={open}
          onClick={handleOpen}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className={styles.dropdown}>
            <div className={styles.dropHeader}>
              <span className={styles.dropTitle}>알림</span>
              {unreadCount > 0 && (
                <button
                  className={styles.readAllBtn}
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await notificationApi.markAllRead();
                      setItems([]);
                      setUnreadCount(0);
                    } catch {
                      // ignore
                    }
                  }}
                >
                  모두 읽음
                </button>
              )}
            </div>

            {loading ? (
              <div className={styles.loadingWrap}>
                <span className={styles.spinner} />
              </div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>새로운 알림이 없어요</div>
            ) : (
              <ul className={styles.dropList}>
                {items.map((item) => (
                  <li
                    key={item.notificationId}
                    className={`${styles.dropItem} ${styles.unread}`}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleItemClick(item)}
                  >
                    <div className={styles.dropItemLeft}>
                      <span className={styles.typeBadge}>
                        {TARGET_LABEL[item.target] ?? item.target ?? '알림'}
                      </span>
                      <p className={styles.dropMsg}>{localizeNotificationMessage(item)}</p>
                      <span className={styles.dropTime}>{timeAgo(item.createdAt)}</span>
                    </div>
                    <div className={styles.dropItemRight}>
                      <span className={styles.dot} />
                      <button
                        className={styles.readBtn}
                        type="button"
                        aria-label="읽음 처리"
                        onClick={(e) => handleMarkRead(item.notificationId, e)}
                      >
                        읽음
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.dropFooter}>
              <button
                className={styles.viewAllBtn}
                type="button"
                onClick={goToAll}
              >
                알림 전체 보기
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={notiModalOpen}
        onClose={() => setNotiModalOpen(false)}
        title="알림 전체보기"
        size="md"
      >
        <Suspense
          fallback={<div style={{ padding: 24, textAlign: 'center' }}>로딩 중...</div>}
        >
          <NotificationList inlineMode />
        </Suspense>
      </Modal>
    </>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
