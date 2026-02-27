// features/admin/pages/contract/AdminResidentList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from '../reservation/AdminReservation.module.css';

export default function AdminResidentList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ 필터 내용 유지: 입주자/건물/계약/회원 ID로 각각 검색
  const [filter, setFilter] = useState({
    residentId: '',
    buildingId: '',
    contractId: '',
    userId: '',
  });

  // ✅ 프론트에서만 정렬/페이지 (백엔드가 List만 내려줌)
  const [query, setQuery] = useState({
    page: 1,
    size: 15,
    sort: 'residentId', // residentId | buildingId | contractId | userId
    direct: 'DESC', // DESC | ASC
  });

  // ✅ 상세 모달
  const [detailModal, setDetailModal] = useState(null); // { residentId }
  const [detail, setDetail] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 네 adminApi 이름이 getResidents()라고 했으니 그대로 유지
      const res = await adminApi.getResidents();

      // ✅ ApiResponse wrapper일 수도 있어서 방어적으로 처리
      const list = Array.isArray(res) ? res : (res?.data ?? res?.result ?? []);
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || '입주자 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const normalize = (v) =>
    String(v ?? '')
      .trim()
      .toLowerCase();

  const normalizeNum = (v) =>
    String(v ?? '')
      .replace(/[^\d]/g, '')
      .trim(); // 숫자만 비교(입주자/건물/계약ID용)

  const handleSearch = (e) => {
    e.preventDefault();
    // ✅ 검색 버튼 누르면 1페이지로
    setQuery((q) => ({ ...q, page: 1 }));
  };

  // ✅ 여기서 filter 4개를 실제로 사용해야 검색이 먹는다!
  const filteredSorted = useMemo(() => {
    const fResidentId = normalizeNum(filter.residentId);
    const fBuildingId = normalizeNum(filter.buildingId);
    const fContractId = normalizeNum(filter.contractId);
    const fUserId = normalize(filter.userId);

    let arr = items;

    // 1) 필터링
    arr = arr.filter((r) => {
      const rResidentId = normalizeNum(r.residentId);
      const rBuildingId = normalizeNum(r.buildingId);
      const rContractId = normalizeNum(r.contractId);
      const rUserId = normalize(r.userId);

      if (fResidentId && rResidentId !== fResidentId) return false;
      if (fBuildingId && rBuildingId !== fBuildingId) return false;
      if (fContractId && rContractId !== fContractId) return false;
      if (fUserId && !rUserId.includes(fUserId)) return false;

      return true;
    });

    // 2) 정렬
    const dir = String(query.direct).toUpperCase() === 'ASC' ? 1 : -1;
    const key = query.sort;

    const getVal = (r) => {
      const v = r?.[key];
      if (
        key === 'residentId' ||
        key === 'buildingId' ||
        key === 'contractId'
      ) {
        const n = Number(v);
        return Number.isFinite(n) ? n : -1;
      }
      return normalize(v);
    };

    return [...arr].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);

      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [items, filter, query.sort, query.direct]);

  const totalElements = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / query.size));
  const safePage = Math.min(Math.max(1, query.page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * query.size;
    return filteredSorted.slice(start, start + query.size);
  }, [filteredSorted, safePage, query.size]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  const openDetail = (residentId) => {
    const found =
      items.find((r) => String(r.residentId) === String(residentId)) ?? null;
    setDetailModal({ residentId });
    setDetail(found);
  };

  const closeDetail = () => {
    setDetailModal(null);
    setDetail(null);
  };

  return (
    <div className={styles.mainInner}>
      {/* 타이틀 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>👤 입주자 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>명의 입주자가 있습니다.
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

      {/* ✅ 필터(유지) */}
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          placeholder="입주자 ID"
          value={filter.residentId}
          onChange={(e) =>
            setFilter((f) => ({ ...f, residentId: e.target.value }))
          }
        />
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
          placeholder="계약 ID"
          value={filter.contractId}
          onChange={(e) =>
            setFilter((f) => ({ ...f, contractId: e.target.value }))
          }
        />

        <input
          className={styles.searchInput}
          placeholder="회원 ID"
          value={filter.userId}
          onChange={(e) => setFilter((f) => ({ ...f, userId: e.target.value }))}
        />

        <button type="submit" className={styles.searchBtn}>
          검색
        </button>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={() => {
            setFilter({
              residentId: '',
              buildingId: '',
              contractId: '',
              userId: '',
            });
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
      ) : pageItems.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>🏠</p>
          <p>입주자가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>입주자 ID</th>
                <th>건물 ID</th>
                <th>계약 ID</th>
                <th>회원 ID</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r) => (
                <tr key={r.residentId}>
                  <td className={styles.tdId}>#{r.residentId ?? '-'}</td>
                  <td>{r.buildingId ?? '-'}</td>
                  <td>{r.contractId ?? '-'}</td>
                  <td className={styles.tdName}>{r.userId ?? '-'}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openDetail(r.residentId)}
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
            disabled={safePage === 1}
            onClick={() => setQuery((q) => ({ ...q, page: safePage - 1 }))}
          >
            ‹
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`${styles.pageBtn} ${
                p === safePage ? styles.pageBtnActive : ''
              }`}
              onClick={() => setQuery((q) => ({ ...q, page: p }))}
            >
              {p}
            </button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={safePage === totalPages}
            onClick={() => setQuery((q) => ({ ...q, page: safePage + 1 }))}
          >
            ›
          </button>
        </div>
      )}

      {/* 상세 모달 */}
      {detailModal && (
        <div className={styles.modalOverlay} onClick={closeDetail}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>입주자 상세</h2>
              <button className={styles.modalClose} onClick={closeDetail}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {!detail ? (
                <div className={styles.emptyBox}>
                  <p>상세 정보를 찾지 못했습니다.</p>
                </div>
              ) : (
                <>
                  <p className={styles.modalDesc}>
                    입주자 <strong>#{detail.residentId}</strong> 정보입니다.
                  </p>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>입주자 ID</label>
                    <div>#{detail.residentId ?? '-'}</div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>건물 ID</label>
                    <div>{detail.buildingId ?? '-'}</div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>계약 ID</label>
                    <div>{detail.contractId ?? '-'}</div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>회원 ID</label>
                    <div>{detail.userId ?? '-'}</div>
                  </div>

                  <div className={styles.infoBox}>
                    수정/삭제 API가 아직 없어서 현재는 조회만 가능합니다.
                  </div>
                </>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={closeDetail}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
