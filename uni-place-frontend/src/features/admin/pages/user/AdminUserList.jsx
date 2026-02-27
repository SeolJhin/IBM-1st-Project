// features/admin/pages/user/AdminUserList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from '../reservation/AdminReservation.module.css'; // ✅ 투어 예약과 동일 스타일 사용

const USER_STATUS_OPTIONS = [
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'banned', label: '정지' },
];

const USER_ROLE_OPTIONS = [
  { value: 'user', label: 'user' },
  { value: 'tenant', label: 'tenant' },
  { value: 'admin', label: 'admin' },
];

const STATUS_LABELS = {
  active: { label: '활성', cls: styles.badgeConfirmed },
  inactive: { label: '비활성', cls: styles.badgePending },
  banned: { label: '정지', cls: styles.badgeCancelled },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? {
    label: status ?? '-',
    cls: styles.badgePending,
  };
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

export default function AdminUserList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [query, setQuery] = useState({
    page: 1,
    size: 15,
    sort: 'userId',
    direct: 'DESC',
    role: 'all',
  });

  // ✅ 상세 모달 (미니 팝업)
  const [detailModal, setDetailModal] = useState(null); // { userId }
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ✅ 상태/권한 변경 상태
  const [statusValue, setStatusValue] = useState('');
  const [roleValue, setRoleValue] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.users(query);
      setItems(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (e) {
      setError(e?.message || '회원 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (userId) => {
    setDetailModal({ userId });
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await adminApi.getUserDetail(userId);
      setDetail(res);
      setStatusValue(res?.userSt ?? 'ACTIVE');
      setRoleValue(res?.userRole ?? 'USER');
    } catch (e) {
      alert(e?.message || '회원 상세 조회 실패');
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModal(null);
    setDetail(null);
    setStatusValue('');
    setRoleValue('');
  };

  const handleSave = async () => {
    if (!detailModal?.userId) return;
    setSaveLoading(true);
    try {
      // ✅ 상태 변경 + 권한 변경을 둘 다 반영(필요 시 조건적으로)
      if (statusValue) {
        await adminApi.updateUserStatus(detailModal.userId, statusValue);
      }
      if (roleValue) {
        await adminApi.updateUserRole(detailModal.userId, roleValue);
      }
      closeDetail();
      fetchList();
    } catch (e) {
      alert(e?.message || '저장 실패');
    } finally {
      setSaveLoading(false);
    }
  };

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  const normalizeRole = (v) =>
    String(v ?? '')
      .trim()
      .toLowerCase();

  const filteredItems = useMemo(() => {
    if (query.role === 'all') return items;

    return items.filter(
      (u) => normalizeRole(u.userRole) === normalizeRole(query.role)
    );
  }, [items, query.role]);

  return (
    <div className={styles.mainInner}>
      {/* 타이틀 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>👤 회원 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>명의 회원이 있습니다.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchList}
            disabled={loading}
          >
            새로고침
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* 필터 */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={query.size}
          onChange={(e) =>
            setQuery((q) => ({ ...q, size: Number(e.target.value), page: 1 }))
          }
        >
          {[10, 15, 20, 30].map((n) => (
            <option key={n} value={n}>
              {n}개씩
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={query.direct}
          onChange={(e) =>
            setQuery((q) => ({ ...q, direct: e.target.value, page: 1 }))
          }
        >
          <option value="DESC">최신순</option>
          <option value="ASC">오래된순</option>
        </select>

        <select
          className={styles.filterSelect}
          value={query.role}
          onChange={(e) =>
            setQuery((q) => ({ ...q, role: e.target.value, page: 1 }))
          }
        >
          <option value="all">권한</option>
          <option value="user">회원</option>
          <option value="tenant">입주자</option>
          <option value="admin">관리자</option>
        </select>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>불러오는 중...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>👤</p>
          <p>회원이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>회원 ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>전화번호</th>
                <th>권한</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((u) => (
                <tr key={u.userId}>
                  <td className={styles.tdId}>{u.userId ?? '-'}</td>
                  <td className={styles.tdName}>{u.userNm ?? '-'}</td>
                  <td>{u.userEmail ?? '-'}</td>
                  <td>{u.userTel ?? '-'}</td>
                  <td>{u.userRole ?? '-'}</td>
                  <td>
                    <StatusBadge status={u.userSt} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openDetail(u.userId)}
                    >
                      관리
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={query.page === 1}
            onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
          >
            ‹
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`${styles.pageBtn} ${
                p === query.page ? styles.pageBtnActive : ''
              }`}
              onClick={() => setQuery((q) => ({ ...q, page: p }))}
            >
              {p}
            </button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={query.page === totalPages}
            onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
          >
            ›
          </button>
        </div>
      )}

      {/* ✅ 상세/수정 모달 */}
      {detailModal && (
        <div className={styles.modalOverlay} onClick={closeDetail}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>회원 정보 수정</h2>
              <button className={styles.modalClose} onClick={closeDetail}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {detailLoading ? (
                <div className={styles.centerBox}>
                  <div className={styles.spinner} />
                  <p>불러오는 중...</p>
                </div>
              ) : !detail ? (
                <div className={styles.emptyBox}>
                  <p>회원 정보를 불러오지 못했습니다.</p>
                </div>
              ) : (
                <>
                  <p className={styles.modalDesc}>
                    회원 <strong>{detail.userId}</strong> 정보를 수정합니다.
                  </p>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>이름</label>
                    <div>{detail.userNm ?? '-'}</div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>탈퇴여부</label>
                    <div>{detail.deleteYN ?? '-'}</div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>상태 변경</label>
                    <div className={styles.statusBtnGroup}>
                      {USER_STATUS_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`${styles.statusPickBtn} ${
                            statusValue === o.value
                              ? styles.statusPickBtnActive
                              : ''
                          }`}
                          onClick={() => setStatusValue(o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>권한 변경</label>
                    <div className={styles.statusBtnGroup}>
                      {USER_ROLE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`${styles.statusPickBtn} ${
                            roleValue === o.value
                              ? styles.statusPickBtnActive
                              : ''
                          }`}
                          onClick={() => setRoleValue(o.value)}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={closeDetail}
                disabled={saveLoading}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleSave}
                disabled={saveLoading || detailLoading}
              >
                {saveLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
