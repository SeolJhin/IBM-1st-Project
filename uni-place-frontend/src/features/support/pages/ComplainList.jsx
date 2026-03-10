import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useComplains } from '../hooks/useComplains';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const STATUS_MAP = {
  received: '접수완료',
  in_progress: '처리중',
  resolved: '처리완료',
};

const IMPORTANCE_MAP = {
  high: { label: '긴급', color: '#e55353', bg: '#fff0f0' },
  medium: { label: '보통', color: '#f0952a', bg: '#fff7ee' },
  low: { label: '낮음', color: '#8c8c8c', bg: '#f5f5f5' },
};

const CODE_META = {
  COMP_PERSONAL: { label: '개인', cls: 'type_personal' },
  COMP_FACILITY: { label: '시설', cls: 'type_facility' },
  COMP_NOISE: { label: '소음', cls: 'type_noise' },
  COMP_CONTRACT: { label: '입주/계약', cls: 'type_contract' },
  COMP_SAFETY: { label: '안전', cls: 'type_safety' },
  COMP_ETC: { label: '기타', cls: 'type_etc' },
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
  return String(raw ?? '')
    .toLowerCase()
    .replace('role_', '');
}

export default function ComplainList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const canCreate = role === 'admin' || role === 'tenant';
  const { complains, pagination, loading, error, goToPage } = useComplains(
    {},
    { isAdmin }
  );

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHead}>
        <h2 className={styles.pageTitle}>민원 접수</h2>
      </div>

      {canCreate && (
        <div className={styles.listActions}>
          <button
            className={styles.buttonPrimary}
            onClick={() => navigate('/support/complain/write')}
          >
            + 민원 작성
          </button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 60 }}>번호</th>
            <th style={{ width: 110 }}>유형</th>
            <th>제목</th>
            {isAdmin && <th style={{ width: 150 }}>작성자 ID</th>}
            <th style={{ width: 80 }}>중요도</th>
            <th style={{ width: 110 }}>상태</th>
            <th style={{ width: 120 }}>날짜</th>
          </tr>
        </thead>
        <tbody>
          {complains.length === 0 ? (
            <tr>
              <td
                colSpan={isAdmin ? 7 : 6}
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: 'var(--muted)',
                }}
              >
                접수된 민원이 없습니다.
              </td>
            </tr>
          ) : (
            complains.map((item) => {
              const meta = CODE_META[item.code] ?? {
                label: item.code ?? '-',
                cls: 'type_etc',
              };
              const imp = IMPORTANCE_MAP[item.importance];
              const isHigh = item.importance === 'high';
              return (
                <tr
                  key={item.compId}
                  style={
                    isHigh
                      ? {
                          background: '#fff5f5',
                          borderLeft: '3px solid #e55353',
                        }
                      : {}
                  }
                >
                  <td
                    style={{
                      textAlign: 'center',
                      color: isHigh ? '#e55353' : 'var(--muted)',
                      fontWeight: isHigh ? 700 : 400,
                    }}
                  >
                    {item.compId}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`${styles.typeBadge} ${styles[meta.cls]}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/support/complain/${item.compId}`}
                      className={styles.tableLink}
                      style={
                        isHigh ? { color: '#c0392b', fontWeight: 700 } : {}
                      }
                    >
                      {isHigh && '🚨 '}
                      {item.compTitle}
                    </Link>
                  </td>
                  {isAdmin && (
                    <td
                      style={{
                        textAlign: 'center',
                        color: isHigh ? '#e55353' : 'var(--muted)',
                      }}
                    >
                      {item.userId || '-'}
                    </td>
                  )}
                  <td style={{ textAlign: 'center' }}>
                    {imp ? (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                          color: isHigh ? '#fff' : imp.color,
                          background: isHigh ? '#e55353' : imp.bg,
                          boxShadow: isHigh
                            ? '0 1px 4px rgba(229,83,83,0.4)'
                            : 'none',
                        }}
                      >
                        {imp.label}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                        -
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={styles.statusBadge}
                      style={
                        item.compSt === 'resolved'
                          ? { background: 'var(--highlight)' }
                          : {}
                      }
                    >
                      {STATUS_MAP[item.compSt] ?? item.compSt}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: 'center',
                      color: isHigh ? '#e55353' : 'var(--muted)',
                      fontSize: 13,
                    }}
                  >
                    {item.createdAt ? item.createdAt.slice(0, 10) : '-'}
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
