// features/support/pages/NoticeList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useNotices } from '../hooks/useNotices';
import styles from './Support.module.css';

export default function NoticeList() {
  const { notices, pagination, loading, error, goToPage } = useNotices();

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>번호</th>
            <th>제목</th>
            <th style={{ width: 100 }}>조회수</th>
            <th style={{ width: 120 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {notices.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                등록된 공지사항이 없습니다.
              </td>
            </tr>
          ) : (
            notices.map((notice) => (
              <tr key={notice.noticeId}>
                <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{notice.noticeId}</td>
                <td>
                  {notice.importance === 'Y' && (
                    <span className={styles.statusBadge} style={{ marginRight: 8 }}>중요</span>
                  )}
                  <Link to={`/support/notice/${notice.noticeId}`} className={styles.tableLink}>
                    {notice.noticeTitle}
                  </Link>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{notice.readCount ?? 0}</td>
                <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  {notice.createdAt ? notice.createdAt.slice(0, 10) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.isLast}
            onClick={() => goToPage(pagination.page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
