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
import Modal from '../../../shared/components/Modal/Modal';
import styles from './NotificationBell.module.css';

// NotificationList를 lazy import → 순환 참조 방지
// NotificationBell → NotificationList → Header → NotificationBell (순환)
const NotificationList = lazy(
  () => import('../../../features/notification/pages/NotificationList')
);

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
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notiModalOpen, setNotiModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingRead, setDeletingRead] = useState(false);
  const dropRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnread({ page: 0, size: 1 });
      setUnreadCount(res?.unreadCount ?? 0);
    } catch {
      /* 로그인 안 된 상태 등 무시 */
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  const loadDropdown = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getList({ page: 0, size: 5 });
      setItems(res?.notifications?.content ?? []);
      setUnreadCount(res?.unreadCount ?? 0);
    } catch {
      /* ignore */
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
      if (dropRef.current && !dropRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = useCallback(async (notificationId, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markRead(notificationId);
      setItems((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: 'Y' } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  }, []);

  const handleItemClick = useCallback(
    async (item) => {
      if (item.isRead !== 'Y') {
        try {
          await notificationApi.markRead(item.notificationId);
          setItems((prev) =>
            prev.map((n) =>
              n.notificationId === item.notificationId
                ? { ...n, isRead: 'Y' }
                : n
            )
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
      if (item.urlPath) navigate(item.urlPath);
    },
    [navigate]
  );

  const handleDeleteRead = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!window.confirm('읽은 알림을 모두 삭제할까요?')) return;
      setDeletingRead(true);
      try {
        await notificationApi.deleteRead();
        await loadDropdown();
      } catch {
        /* ignore */
      } finally {
        setDeletingRead(false);
      }
    },
    [loadDropdown]
  );

  const hasReadItems = items.some((n) => n.isRead === 'Y');

  // "알림 전체 보기" → 팝업으로
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
                      setItems((prev) =>
                        prev.map((n) => ({ ...n, isRead: 'Y' }))
                      );
                      setUnreadCount(0);
                    } catch {
                      /* ignore */
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
                {items.map((item) => {
                  const isUnread = item.isRead !== 'Y';
                  return (
                    <li
                      key={item.notificationId}
                      className={`${styles.dropItem} ${isUnread ? styles.unread : styles.read}`}
                      onClick={() => handleItemClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleItemClick(item)
                      }
                    >
                      <div className={styles.dropItemLeft}>
                        <span
                          className={`${styles.typeBadge} ${!isUnread ? styles.badgeRead : ''}`}
                        >
                          {TARGET_LABEL[item.target] ?? item.target ?? '알림'}
                        </span>
                        <p
                          className={`${styles.dropMsg} ${!isUnread ? styles.msgRead : ''}`}
                        >
                          {item.message}
                        </p>
                        <span className={styles.dropTime}>
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <div className={styles.dropItemRight}>
                        {isUnread && (
                          <>
                            <span className={styles.dot} />
                            <button
                              className={styles.readBtn}
                              type="button"
                              aria-label="읽음 처리"
                              onClick={(e) =>
                                handleMarkRead(item.notificationId, e)
                              }
                            >
                              ✓
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className={styles.dropFooter}>
              {hasReadItems && (
                <button
                  className={styles.deleteReadBtn}
                  type="button"
                  onClick={handleDeleteRead}
                  disabled={deletingRead}
                >
                  {deletingRead ? '삭제 중…' : '읽은 알림 지우기'}
                </button>
              )}
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

      {/* 알림 전체보기 팝업 */}
      <Modal
        open={notiModalOpen}
        onClose={() => setNotiModalOpen(false)}
        title="🔔 알림 전체보기"
        size="md"
      >
        <Suspense
          fallback={
            <div style={{ padding: 24, textAlign: 'center' }}>로딩 중…</div>
          }
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
