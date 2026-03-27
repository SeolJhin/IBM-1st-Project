// features/admin/pages/contract/AdminContractList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { withApiPrefix } from '../../../../app/http/apiBase';
import styles from '../reservation/AdminReservation.module.css';

const CONTRACT_STATUS_OPTIONS = [
  { value: '', label: '\uC0C1\uD0DC' },
  { value: 'requested', label: '\uC694\uCCAD\uB428' },
  { value: 'approved', label: '\uC2B9\uC778' },
  { value: 'active', label: '\uD65C\uC131' },
  { value: 'ended', label: '\uC885\uB8CC' },
  { value: 'cancelled', label: '\uCDE8\uC18C' },
];

const STATUS_LABELS = {
  requested: { label: '\uC694\uCCAD\uB428', cls: styles.badgePending },
  approved: { label: '\uC2B9\uC778', cls: styles.badgePending },
  active: { label: '\uD65C\uC131', cls: styles.badgeConfirmed },
  ended: { label: '\uC885\uB8CC', cls: styles.badgeCompleted },
  cancelled: { label: '\uCDE8\uC18C', cls: styles.badgeCancelled },
};

function StatusBadge({ status }) {
  const key = String(status ?? '')
    .trim()
    .toLowerCase();
  const s = STATUS_LABELS[key] ?? {
    label: status ?? '-',
    cls: styles.badgePending,
  };
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}
function fmtDate(v) {
  if (!v) return '-';
  return String(v).slice(0, 10);
}

function fmtDt(v) {
  if (!v) return '-';
  return String(v).replace('T', ' ').slice(0, 16);
}

function fmtMoney(v) {
  if (v === null || v === undefined || v === '') return '-';
  const num = Number(v);
  if (!Number.isFinite(num)) return String(v);
  return num.toLocaleString('ko-KR');
}

// datetime-local input용 (서버에서 "2026-02-27T14:30:00" 오면 앞 16자리로)
function toDatetimeLocal(value) {
  if (!value) return '';
  return String(value).slice(0, 16);
}

export default function AdminContractList() {
  const [searchParams] = useSearchParams();
  const [portalRoot, setPortalRoot] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 검색바 필터 (DTO: ContractAdminSearchRequest)
  const [filter, setFilter] = useState({
    keyword: '',
    contractStatus: '',
    buildingId: '',
    roomNo: '',
    startFrom: '',
    endTo: '',
  });

  // 페이징
  const [query, setQuery] = useState({
    page: 1,
    size: 15,
    sort: 'contractId',
    direct: 'DESC',
  });

  // 상세/수정 모달
  const [detailModal, setDetailModal] = useState(null); // contractId
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // ✅ 수정 폼 상태
  const [editStatus, setEditStatus] = useState(''); // requested/active/ended/cancelled
  const [editMoveinAt, setEditMoveinAt] = useState(''); // datetime-local string
  const [editPdfFile, setEditPdfFile] = useState(null); // File
  const [saveLoading, setSaveLoading] = useState(false);
  const searchKey = searchParams.toString();

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getContracts({
        ...filter,
        ...query,
        buildingId: filter.buildingId ? Number(filter.buildingId) : undefined,
        roomNo: filter.roomNo ? Number(filter.roomNo) : undefined,
      });

      setItems(res?.content ?? []);
      setTotalElements(res?.totalElements ?? 0);
      setTotalPages(res?.totalPages ?? 1);
    } catch (e) {
      setError(e?.message || '계약 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const contractId = (params.get('contractId') || '').trim();
    const keyword = (params.get('keyword') || '').trim();
    const nextKeyword = contractId || keyword;
    if (!nextKeyword) return;
    setFilter((prev) =>
      prev.keyword === nextKeyword ? prev : { ...prev, keyword: nextKeyword }
    );
    setQuery((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [searchKey]);

  const openDetail = useCallback(async (contractId) => {
    setDetailModal(contractId);
    setDetail(null);
    setDetailLoading(true);

    // 폼 초기화
    setEditPdfFile(null);
    setEditMoveinAt('');
    setEditStatus('');

    try {
      const res = await adminApi.getContractById(contractId);
      setDetail(res);

      // ✅ 서버 값으로 기본 세팅
      setEditStatus(res?.contractStatus ?? '');
      setEditMoveinAt(toDatetimeLocal(res?.moveinAt));
    } catch (e) {
      alert(e?.message || '계약 상세 조회 실패');
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const contractIdNum = Number(params.get('contractId'));
    if (!Number.isFinite(contractIdNum) || contractIdNum <= 0) return;
    if (loading || detailModal) return;

    const hit = items.find(
      (item) => Number(item.contractId) === Math.trunc(contractIdNum)
    );
    if (hit) openDetail(Math.trunc(contractIdNum));
  }, [detailModal, items, loading, openDetail, searchKey]);

  const closeDetail = () => {
    setDetailModal(null);
    setDetail(null);
    setEditStatus('');
    setEditMoveinAt('');
    setEditPdfFile(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery((q) => ({ ...q, page: 1 }));
  };

  const handleReset = () => {
    setFilter({
      keyword: '',
      contractStatus: '',
      buildingId: '',
      roomNo: '',
      startFrom: '',
      endTo: '',
    });
    setQuery((q) => ({ ...q, page: 1 }));
  };

  const handleSave = async () => {
    if (!detailModal) return;

    setSaveLoading(true);
    try {
      // ✅ 백엔드 ContractUpdateRequest 필드명 그대로
      await adminApi.updateContract(detailModal, {
        contractStatus: editStatus || undefined,
        moveinAt: editMoveinAt || undefined, // datetime-local 값 그대로 전송
        pdfFile: editPdfFile || undefined,
      });

      // 저장 후 상세 재조회 + 목록 갱신
      const refreshed = await adminApi.getContractById(detailModal);
      setDetail(refreshed);
      setEditStatus(refreshed?.contractStatus ?? '');
      setEditMoveinAt(toDatetimeLocal(refreshed?.moveinAt));
      setEditPdfFile(null);

      fetchList();
      alert('저장되었습니다.');
    } catch (e) {
      alert(e?.message || '저장 실패 (PUT /admin/contracts/{id} 확인)');
    } finally {
      setSaveLoading(false);
    }
  };

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <div className={styles.mainInner}>
      {/* 타이틀 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>📄 계약 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>건의 계약이 있습니다.
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

      {/* 검색바 */}
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          className={styles.searchInput}
          placeholder="건물명/임대인/임차인"
          value={filter.keyword}
          onChange={(e) =>
            setFilter((f) => ({ ...f, keyword: e.target.value }))
          }
        />

        <select
          className={styles.filterSelect}
          value={filter.contractStatus}
          onChange={(e) =>
            setFilter((f) => ({ ...f, contractStatus: e.target.value }))
          }
        >
          {CONTRACT_STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'ALL'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

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
          placeholder="방 번호(roomNo)"
          value={filter.roomNo}
          onChange={(e) => setFilter((f) => ({ ...f, roomNo: e.target.value }))}
        />

        {/* 날짜 필터 */}
        <input
          type="date"
          className={styles.searchInput}
          value={filter.startFrom}
          onChange={(e) =>
            setFilter((f) => ({ ...f, startFrom: e.target.value }))
          }
          title="계약 시작일 From"
        />
        <input
          type="date"
          className={styles.searchInput}
          value={filter.endTo}
          onChange={(e) => setFilter((f) => ({ ...f, endTo: e.target.value }))}
          title="계약 종료일 To"
        />

        <button type="submit" className={styles.searchBtn}>
          검색
        </button>
        <button type="button" className={styles.resetBtn} onClick={handleReset}>
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
      </form>

      {/* 테이블 */}
      {loading ? (
        <div className={styles.centerBox}>
          <div className={styles.spinner} />
          <p>불러오는 중...</p>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyIcon}>📄</p>
          <p>계약 내역이 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>계약 ID</th>
                <th>건물명</th>
                <th>방</th>
                <th>임차인</th>
                <th>임대인</th>
                <th>계약기간</th>
                <th>유형</th>
                <th>임대료(원)</th>
                <th>상태</th>
                <th>계약서</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.contractId}>
                  <td className={styles.tdId}>#{c.contractId}</td>

                  <td>
                    <div className={styles.tdName}>
                      {c.buildingNm ?? c.buildingName ?? '-'}
                    </div>
                  </td>

                  <td>
                    <div>{c.roomNo ?? '-'}호</div>
                  </td>

                  <td className={styles.tdName}>{c.tenantNm ?? c.tenantUserId ?? '-'}</td>
                  <td>{c.lessorNm ?? '-'}</td>

                  <td className={styles.tdDate}>
                    {fmtDate(c.contractStart)} ~ {fmtDate(c.contractEnd)}
                  </td>

                  <td>{c.rentType ?? '-'}</td>
                  <td>{fmtMoney(c.rentPrice)}</td>

                  <td>
                    <StatusBadge status={c.contractStatus} />
                  </td>

                  <td>
                    {c.contractPdfUrl ? (
                      <a
                        href={withApiPrefix(c.contractPdfUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'underline' }}
                      >
                        다운로드
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>

                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openDetail(c.contractId)}
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

      {/* 상세/수정 모달 */}
      {detailModal &&
        portalRoot &&
        createPortal(
          <div className={styles.modalOverlay} onClick={closeDetail}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>📄 계약 상세/수정</h2>
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
                    <p>계약 상세를 불러오지 못했습니다.</p>
                  </div>
                ) : (
                  <>
                    <p className={styles.modalDesc}>
                      계약 <strong>#{detail.contractId}</strong> 정보를
                      수정합니다.
                    </p>

                    {/* 상세 표시 */}
                    <div className={styles.detailGrid}>
                      {[
                        [
                          '건물',
                          detail.buildingNm ?? detail.buildingName ?? '-',
                        ],
                        ['주소', detail.buildingAddr ?? '-'],
                        [
                          '방',
                          `RoomNo: ${detail.roomNo ?? '-'} / RoomId: ${detail.roomId ?? '-'}`,
                        ],
                        [
                          '기간',
                          `${fmtDate(detail.contractStart)} ~ ${fmtDate(detail.contractEnd)}`,
                        ],
                        ['보증금', fmtMoney(detail.deposit)],
                        ['월세/이용료', fmtMoney(detail.rentPrice)],
                        ['관리비', fmtMoney(detail.manageFee)],
                        ['납부일', detail.paymentDay ?? '-'],
                        ['임대인명', detail.lessorNm ?? '-'],
                        ['요청일', fmtDt(detail.requestedAt)],
                        ['승인일', fmtDt(detail.approvedAt)],
                      ].map(([label, value]) => (
                        <div key={label} className={styles.detailRow}>
                          <span className={styles.detailLabel}>{label}</span>
                          <span className={styles.detailValue}>{value}</span>
                        </div>
                      ))}

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>현재 상태</span>
                        <span className={styles.detailValue}>
                          <StatusBadge status={detail.contractStatus} />
                        </span>
                      </div>

                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>계약서</span>
                        <span className={styles.detailValue}>
                          {detail.contractPdfUrl ? (
                            <a
                              href={withApiPrefix(detail.contractPdfUrl)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ textDecoration: 'underline' }}
                            >
                              다운로드
                            </a>
                          ) : (
                            '-'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* ✅ 수정 영역 */}
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>상태 변경</label>
                      <div className={styles.statusBtnGroup}>
                        {[
                          'requested',
                          'approved',
                          'active',
                          'ended',
                          'cancelled',
                        ].map((v) => (
                          <button
                            key={v}
                            type="button"
                            className={`${styles.statusPickBtn} ${
                              editStatus === v ? styles.statusPickBtnActive : ''
                            }`}
                            onClick={() => setEditStatus(v)}
                          >
                            {STATUS_LABELS[v]?.label ?? v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>
                        입주일(moveinAt)
                      </label>
                      <input
                        type="datetime-local"
                        className={styles.searchInput}
                        value={editMoveinAt}
                        onChange={(e) => setEditMoveinAt(e.target.value)}
                      />
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                        현재: {fmtDt(detail.moveinAt)}
                      </div>
                    </div>

                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>
                        계약서 PDF 업로드
                      </label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                          setEditPdfFile(e.target.files?.[0] ?? null)
                        }
                      />
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                        선택됨: {editPdfFile?.name ?? '없음'}
                      </div>
                    </div>

                    <div className={styles.infoBox}>
                      저장 시: 상태 / 입주일 / PDF 중 입력된 값만 반영됩니다.
                    </div>
                  </>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={closeDetail}
                  disabled={saveLoading || detailLoading}
                >
                  닫기
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
          </div>,
          portalRoot
        )}
    </div>
  );
}
