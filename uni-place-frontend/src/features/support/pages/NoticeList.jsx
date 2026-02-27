import React from 'react';
import { useNotices } from '../hooks/useNotices';
import { Link } from 'react-router-dom';

export default function NoticeList() {
  const { notices, pagination, loading, error, goToPage } = useNotices();

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24 }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>공지사항</h2>
      <ul>
        {notices.map((notice) => (
          <li key={notice.noticeId}>
            <Link to={`/support/notice/${notice.noticeId}`}>
              {notice.noticeTitle}
            </Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        {!pagination.isFirst && (
          <button onClick={() => goToPage(pagination.page - 1)}>이전</button>
        )}
        <span>
          {' '}
          {pagination.page} / {pagination.totalPages}{' '}
        </span>
        {!pagination.isLast && (
          <button onClick={() => goToPage(pagination.page + 1)}>다음</button>
        )}
      </div>
    </div>
  );
}
