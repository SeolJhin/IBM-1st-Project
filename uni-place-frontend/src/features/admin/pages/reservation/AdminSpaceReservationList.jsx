// features/admin/pages/reservation/AdminSpaceReservationList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminReservation.module.css';

const SPACE_STATUS_LABELS = {
  requested: { label: '신청됨', cls: styles.badgePending },
  confirmed: { label: '확정', cls: styles.badgeConfirmed },
  ended: { label: '완료', cls: styles.badgeCompleted },
  cancelled: { label: '취소됨', cls: styles.badgeCancelled },
};

function StatusBadge({ status }) {
  const s = SPACE_STATUS_LABELS[status] ?? {
    label: status ?? '-',
    cls: styles.badgePending,
  };
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

export default function AdminSpaceReservationList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState({
    buildingId: '',
    spaceId: '',
    userId: '',
    date: '',
  });
  const [query, setQuery] = useState({
    page: 1,
    size: 15,
    sort: 'reservationId',
    direct: 'DESC',
  });

  const [detailModal, setDetailModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.spaceReservations({ ...filter, ...query });
      setItems(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (e) {
      setError(e?.message || '공용공간 예약 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openDetail = async (reservationId) => {
    try {
      const res = await adminApi.spaceReservationDetail(reservationId);
      setDetailModal(res);
      setCancelReason('');
    } catch (e) {
      alert(e?.message || '상세 조회 실패');
    }
  };

  const handleAction = async (type) => {
    if (!detailModal) return;
    setActionLoading(true);
    try {
      if (type === 'confirm')
        await adminApi.confirmSpaceReservation(detailModal.reservationId);
      else if (type === 'end')
        await adminApi.endSpaceReservation(detailModal.reservationId);
      else if (type === 'cancel')
        await adminApi.cancelSpaceReservation(
          detailModal.reservationId,
          cancelReason
        );
      setDetailModal(null);
      fetchList();
    } catch (e) {
      alert(e?.message || '처리 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery((q) => ({ ...q, page: 1 }));
  };

  const fmtDt = (s) => (s ? s.replace('T', ' ').slice(0, 16) : '-');
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.mainInner}>
      {/* 타이틀 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>🛋️ 공용공간 예약 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>건의 공용공간 예약이 있습니다.
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

      {/* 검색 필터 */}
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          placeholder="건물 ID"
          value={filter.buildingId}
          onChange={(e) =>
            setFilter((f) => ({ ...f, buildingId: e.target.value }))
          }
        />
        <input
          className={styles.searchInput}
          placeholder="공간 ID"
          value={filter.spaceId}
          onChange={(e) =>
            setFilter((f) => ({ ...f, spaceId: e.target.value }))
          }
        />
        <input
          className={styles.searchInput}
          placeholder="사용자 ID"
          value={filter.userId}
          onChange={(e) => setFilter((f) => ({ ...f, userId: e.target.value }))}
        />
        <input
          type="date"
          className={styles.searchInput}
          value={filter.date}
          onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
        />
        <button type="submit" className={styles.searchBtn}>
          검색
        </button>
        <button
          type="button"
          className={styles.resetBtn}
          onClick={() => {
            setFilter({ buildingId: '', spaceId: '', userId: '', date: '' });
            setQuery((q) => ({ ...q, page: 1 }));
          }}
        >
          초기화
        </button>
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
      </form>

      {/* 테이블 */}
      {loading ? (
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>불러오는 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>🛋️</p>
          <p>공용공간 예약이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>예약 ID</th>
                <th>건물 ID</th>
                <th>공간 ID</th>
                <th>사용자 ID</th>
                <th>시작</th>
                <th>종료</th>
                <th>인원</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.reservationId}>
                  <td className={styles.tdId}>#{item.reservationId}</td>
                  <td>{item.buildingId ?? '-'}</td>
                  <td>{item.spaceId ?? '-'}</td>
                  <td className={styles.tdName}>{item.userId ?? '-'}</td>
                  <td className={styles.tdDate}>{fmtDt(item.srStartAt)}</td>
                  <td className={styles.tdDate}>{fmtDt(item.srEndAt)}</td>
                  <td>{item.srNoPeople ?? '-'}명</td>
                  <td>
                    <StatusBadge status={item.srSt} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openDetail(item.reservationId)}
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
              className={`${styles.pageBtn} ${p === query.page ? styles.pageBtnActive : ''}`}
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

      {/* 상세/관리 모달 */}
      {detailModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setDetailModal(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🛋️ 공용공간 예약 관리</h2>
              <button
                className={styles.modalClose}
                onClick={() => setDetailModal(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                {[
                  ['예약 ID', `#${detailModal.reservationId}`],
                  ['건물 ID', detailModal.buildingId ?? '-'],
                  ['공간 ID', detailModal.spaceId ?? '-'],
                  ['사용자 ID', detailModal.userId ?? '-'],
                  ['이용 시작', fmtDt(detailModal.srStartAt)],
                  ['이용 종료', fmtDt(detailModal.srEndAt)],
                  ['이용 인원', `${detailModal.srNoPeople ?? '-'}명`],
                ].map(([label, value]) => (
                  <div key={label} className={styles.detailRow}>
                    <span className={styles.detailLabel}>{label}</span>
                    <span className={styles.detailValue}>{value}</span>
                  </div>
                ))}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>현재 상태</span>
                  <span className={styles.detailValue}>
                    <StatusBadge status={detailModal.srSt} />
                  </span>
                </div>
              </div>
              <div className={styles.cancelSection}>
                <label className={styles.modalLabel}>
                  취소 사유 (취소 시 입력)
                </label>
                <textarea
                  className={styles.cancelTextarea}
                  rows={3}
                  placeholder="취소 사유를 입력하세요..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setDetailModal(null)}
              >
                닫기
              </button>
              <button
                type="button"
                className={styles.btnConfirm}
                onClick={() => handleAction('confirm')}
                disabled={actionLoading}
              >
                ✅ 확정
              </button>
              <button
                type="button"
                className={styles.btnEnd}
                onClick={() => handleAction('end')}
                disabled={actionLoading}
              >
                🏁 종료
              </button>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
              >
                ❌ 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
