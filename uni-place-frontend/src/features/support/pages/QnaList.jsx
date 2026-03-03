import React from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useQnas } from '../hooks/useQnas';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const STATUS_MAP = {
  waiting: '답변 대기',
  complete: '답변 완료',
};

const CODE_META = {
  QNA_CONTRACT: { label: '계약', cls: 'type_qna_contract' },
  QNA_PAYMENT: { label: '결제/환불', cls: 'type_qna_payment' },
  QNA_FACILITY: { label: '시설', cls: 'type_qna_facility' },
  QNA_ROOMSERVICE: { label: '룸서비스', cls: 'type_qna_roomservice' },
  QNA_MOVEINOUT: { label: '입주/퇴거', cls: 'type_qna_moveinout' },
  QNA_ETC: { label: '기타', cls: 'type_etc' },
  SUP_GENERAL: { label: '일반', cls: 'type_general' },
  SUP_BILLING: { label: '요금/정산', cls: 'type_billing' },
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
  if (value.includes('tenant')) return 'tenant';
  return value.replace('role_', '');
}

export default function QnaList() {
  const { user } = useAuth();
  const { qnas, pagination, loading, error, goToPage } = useQnas({}, { enabled: Boolean(user) });
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user);
  const canCreate = role === 'admin' || role === 'tenant';

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHead}>
        <h2 className={styles.pageTitle}>1:1 문의</h2>
      </div>

      {canCreate && (
        <div className={styles.listActions}>
          <button className={styles.buttonPrimary} onClick={() => navigate('/support/qna/write')}>
            + 문의 작성
          </button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>번호</th>
            <th style={{ width: 110 }}>유형</th>
            <th>제목</th>
            <th style={{ width: 110 }}>상태</th>
            <th style={{ width: 120 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {qnas.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                작성한 문의가 없습니다.
              </td>
            </tr>
          ) : (
            qnas.map((q) => {
              const meta = CODE_META[q.code] ?? { label: q.code ?? '-', cls: 'type_etc' };
              return (
                <tr key={q.qnaId}>
                  <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{q.qnaId}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`${styles.typeBadge} ${styles[meta.cls]}`}>{meta.label}</span>
                  </td>
                  <td>
                    <Link to={`/support/qna/${q.qnaId}`} className={styles.tableLink}>
                      {q.qnaTitle}
                    </Link>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={styles.statusBadge}
                      style={q.qnaSt === 'complete' ? { background: 'var(--highlight)' } : {}}
                    >
                      {STATUS_MAP[q.qnaSt] ?? q.qnaSt}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    {q.createdAt ? q.createdAt.slice(0, 10) : '-'}
                  </td>
                </tr>
              );
            })
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
