// features/support/pages/NoticeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

export default function NoticeDetail() {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    supportApi
      .getNoticeDetail(noticeId)
      .then((data) => setNotice(data))
      .catch((err) => setError(err.message || '공지사항을 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [noticeId]);

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!notice) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {notice.importance === 'Y' && (
            <span className={styles.statusBadge}>중요</span>
          )}
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>{notice.noticeTitle}</h2>
        </div>

        <div className={styles.cardMeta} style={{ marginBottom: 24 }}>
          <span>조회수 {notice.readCount ?? 0}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <span>{notice.createdAt ? notice.createdAt.slice(0, 10) : '-'}</span>
        </div>

        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
          {notice.noticeCtnt}
        </div>
      </div>

      <button className={styles.pageBtn} onClick={() => navigate('/support/notice')} style={{ marginTop: 16 }}>
        ← 목록으로
      </button>
    </div>
  );
}
