// features/admin/pages/reservation/AdminTourReservationList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import styles from './AdminReservation.module.css';

const TOUR_STATUS_OPTIONS = [
  { value: 'requested', label: '신청됨' },
  { value: 'confirmed', label: '확정' },
  { value: 'ended', label: '완료' },
  { value: 'cancelled', label: '취소됨' },
];

const STATUS_LABELS = {
  requested: { label: '신청됨', cls: styles.badgePending },
  confirmed: { label: '확정', cls: styles.badgeConfirmed },
  ended: { label: '완료', cls: styles.badgeCompleted },
  cancelled: { label: '취소됨', cls: styles.badgeCancelled },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? {
    label: status ?? '-',
    cls: styles.badgePending,
  };
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

export default function AdminTourReservationList() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [query, setQuery] = useState({
    page: 1,
    size: 15,
    sort: 'tourId',
    direct: 'DESC',
  });

  const [statusModal, setStatusModal] = useState(null);
  const [statusValue, setStatusValue] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const searchKey = searchParams.toString();

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.tourReservations(query);
      setItems(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (e) {
      setError(e?.message || '투어예약 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openStatusModal = (item) => {
    setStatusModal({ tourId: item.tourId });
    setStatusValue(item.tourSt ?? 'requested');
  };

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const raw = params.get('tourId');
    const tourId = Number(raw);
    if (!Number.isFinite(tourId) || tourId <= 0) return;
    const found = items.find((item) => Number(item.tourId) === Math.trunc(tourId));
    if (found) openStatusModal(found);
  }, [items, searchKey]);

  const handleStatusChange = async () => {
    if (!statusModal || !statusValue) return;
    setStatusLoading(true);
    try {
      await adminApi.changeTourStatus(statusModal.tourId, statusValue);
      setStatusModal(null);
      fetchList();
    } catch (e) {
      alert(e?.message || '상태 변경 실패');
    } finally {
      setStatusLoading(false);
    }
  };

  const fmtDt = (s) => (s ? s.replace('T', ' ').slice(0, 16) : '-');
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.mainInner}>
      {/* 타이틀 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>🔖 투어(방문) 예약 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>건의 방문 예약이 있습니다.
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
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>불러오는 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>🗓️</p>
          <p>투어 예약이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>예약 ID</th>
                <th>건물 ID</th>
                <th>방 ID</th>
                <th>예약자명</th>
                <th>연락처</th>
                <th>방문 시작</th>
                <th>방문 종료</th>
                <th>상태</th>
                <th>상태 변경</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.tourId}>
                  <td className={styles.tdId}>#{item.tourId}</td>
                  <td>{item.buildingId ?? '-'}</td>
                  <td>{item.roomId ?? '-'}</td>
                  <td className={styles.tdName}>{item.tourNm ?? '-'}</td>
                  <td>{item.tourTel ?? '-'}</td>
                  <td className={styles.tdDate}>{fmtDt(item.tourStartAt)}</td>
                  <td className={styles.tdDate}>{fmtDt(item.tourEndAt)}</td>
                  <td>
                    <StatusBadge status={item.tourSt} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openStatusModal(item)}
                    >
                      변경
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

      {/* 상태 변경 모달 */}
      {statusModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setStatusModal(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>투어예약 상태 변경</h2>
              <button
                className={styles.modalClose}
                onClick={() => setStatusModal(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>
                예약 <strong>#{statusModal.tourId}</strong>의 상태를 변경합니다.
              </p>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>변경할 상태</label>
                <div className={styles.statusBtnGroup}>
                  {TOUR_STATUS_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.statusPickBtn} ${statusValue === o.value ? styles.statusPickBtnActive : ''}`}
                      onClick={() => setStatusValue(o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setStatusModal(null)}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleStatusChange}
                disabled={statusLoading}
              >
                {statusLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
