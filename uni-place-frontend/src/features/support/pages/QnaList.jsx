import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useQnas } from '../hooks/useQnas';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const STATUS_MAP = {
  waiting: '답변 대기',
  complete: '답변 완료',
};

function normalizeRole(user) {
  const raw =
    user?.userRole ??
    user?.role ??
    user?.userRl ??
    user?.user_role ??
    user?.authority ??
    user?.authorities?.[0];

  const value = String(raw ?? '').toLowerCase();

  if (value.includes('admin')) return 'admin';
  if (value.includes('user')) return 'user';

  return value;
}

export default function QnaList() {
  const { user } = useAuth();
  const { qnas, pagination, loading, error, goToPage } = useQnas(
    {},
    { enabled: Boolean(user) }
  );
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user);
  const canCreate = role === 'admin' || role === 'user';

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      {canCreate && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 16,
          }}
        >
          <button
            className={styles.buttonPrimary}
            onClick={() => navigate('/support/qna/write')}
          >
            문의 작성
          </button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>번호</th>
            <th>제목</th>
            <th style={{ width: 120 }}>상태</th>
            <th style={{ width: 120 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {qnas.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: 'var(--muted)',
                }}
              >
                작성한 문의가 없습니다.
              </td>
            </tr>
          ) : (
            qnas.map((q) => (
              <tr key={q.qnaId}>
                <td style={{ textAlign: 'center', color: 'var(--muted)' }}>
                  {q.qnaId}
                </td>
                <td>
                  <Link
                    to={`/support/qna/${q.qnaId}`}
                    className={styles.tableLink}
                  >
                    {q.qnaTitle}
                  </Link>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span
                    className={styles.statusBadge}
                    style={
                      q.qnaSt === 'complete'
                        ? { background: 'var(--highlight)' }
                        : {}
                    }
                  >
                    {STATUS_MAP[q.qnaSt] ?? q.qnaSt}
                  </span>
                </td>
                <td
                  style={{
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 13,
                  }}
                >
                  {q.createdAt ? q.createdAt.slice(0, 10) : '-'}
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
