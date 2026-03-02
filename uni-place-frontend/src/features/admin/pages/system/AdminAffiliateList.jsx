// features/admin/pages/system/AdminAffiliateList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from '../reservation/AdminReservation.module.css';

const STATUS_LABELS = {
  planned: { label: '예정', cls: styles.badgePending },
  progress: { label: '진행', cls: styles.badgeConfirmed },
  ended: { label: '종료', cls: styles.badgeCancelled },
};

const AFFILIATE_GROUP_CODE = 'AFFILIATE_CATEGORY';

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? {
    label: status ?? '-',
    cls: styles.badgePending,
  };
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

function fmtDt(v) {
  if (!v) return '-';
  return String(v).replace('T', ' ').slice(0, 16);
}

function toDatetimeLocal(value) {
  if (!value) return '';
  return String(value).slice(0, 16);
}

function validatePeriod(startAt, endAt) {
  if (!startAt || !endAt) return '';
  const s = new Date(`${startAt}:00`).getTime();
  const e = new Date(`${endAt}:00`).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e))
    return '날짜 형식이 올바르지 않습니다.';
  if (e < s) return '종료일은 시작일보다 빠를 수 없습니다.';
  return '';
}

function toNumOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(v) {
  const t = String(v ?? '').trim();
  return t ? t : null;
}

export default function AdminAffiliateList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ code dropdown options
  const [codeOptions, setCodeOptions] = useState([]);
  const [codeLoading, setCodeLoading] = useState(false);

  // ✅ 목록 쿼리
  const [query, setQuery] = useState({
    page: 1,
    size: 10,
    sort: 'affiliateId',
    direct: 'DESC',
  });

  // ✅ 관리 모달
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // ✅ 수정 폼
  const [editForm, setEditForm] = useState({
    buildingId: '',
    affiliateNm: '',
    affiliateCeo: '',
    affiliateTel: '',
    businessNo: '',
    affiliateFax: '',
    affiliateEmail: '',
    affiliateAddr: '',
    affiliateStartAt: '',
    affiliateEndAt: '',
    code: '',
    affiliateDesc: '',
    affiliateSt: 'planned',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // ✅ 등록 모달
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    buildingId: '',
    affiliateNm: '',
    affiliateCeo: '',
    affiliateTel: '',
    businessNo: '',
    affiliateFax: '',
    affiliateEmail: '',
    affiliateAddr: '',
    affiliateStartAt: '',
    affiliateEndAt: '',
    code: '',
    affiliateDesc: '',
    affiliateSt: 'planned',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // ✅ 공통코드 로드 (AFFILIATE_CATEGORY 활성 코드)
  const fetchCodeOptions = useCallback(async () => {
    setCodeLoading(true);
    try {
      // ⚠️ 너가 adminApi.js에 추가한 함수명과 다르면 여기만 수정!
      // 기대 응답: [{ code, codeValue, ... }, ...]
      const res = await adminApi.getActiveCommonCodes(AFFILIATE_GROUP_CODE);

      const list = res?.data ?? res; // ApiResponse 래핑/비래핑 모두 대응
      const arr = Array.isArray(list) ? list : [];

      // displayOrder가 있으면 정렬, 없으면 code 기준 정렬
      const sorted = [...arr].sort((a, b) => {
        const ao = Number(a?.displayOrder);
        const bo = Number(b?.displayOrder);
        if (Number.isFinite(ao) && Number.isFinite(bo) && ao !== bo)
          return ao - bo;
        return String(a?.code ?? '').localeCompare(String(b?.code ?? ''));
      });

      setCodeOptions(sorted);
    } catch (e) {
      // 드롭다운은 “없어도 동작”은 해야 해서, 오류는 조용히 처리(원하면 alert로 바꿔도 됨)
      setCodeOptions([]);
      console.warn('Failed to load common codes:', e);
    } finally {
      setCodeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodeOptions();
  }, [fetchCodeOptions]);

  const codeMap = useMemo(() => {
    const m = new Map();
    for (const c of codeOptions) {
      if (c?.code) m.set(String(c.code), c);
    }
    return m;
  }, [codeOptions]);

  const getCodeLabel = useCallback(
    (code) => {
      if (!code) return '';
      const obj = codeMap.get(String(code));
      return obj?.codeValue || obj?.name || obj?.label || '';
    },
    [codeMap]
  );

  /**
   * ✅ fetchList는 list를 return
   */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await adminApi.getAffiliates({
        page: query.page - 1,
        size: query.size,
        sort: query.sort,
        direct: query.direct,
      });

      const list = res?.content ?? [];
      setItems(list);
      setTotalElements(res?.totalElements ?? 0);
      setTotalPages(res?.totalPages ?? 1);

      if (detailModal) {
        const refreshed =
          list.find((it) => Number(it?.affiliateId) === Number(detailModal)) ??
          null;
        if (refreshed) setDetail((prev) => ({ ...(prev ?? {}), ...refreshed }));
      }

      return list;
    } catch (e) {
      setError(e?.message || '제휴 목록 조회 실패');
      return [];
    } finally {
      setLoading(false);
    }
  }, [query.page, query.size, query.sort, query.direct, detailModal]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  const openDetail = async (affiliateId) => {
    setDetailModal(affiliateId);
    setDetail(null);
    setDetailLoading(true);

    try {
      let found =
        items.find((it) => Number(it?.affiliateId) === Number(affiliateId)) ??
        null;

      if (!found) {
        const freshList = await fetchList();
        found =
          freshList.find(
            (it) => Number(it?.affiliateId) === Number(affiliateId)
          ) ?? null;
      }

      const full = await adminApi.getAffiliateDetail(affiliateId);
      const d = full?.data ?? full;

      const detailObj = d?.affiliateId ? d : (found ?? d);
      if (!detailObj) throw new Error('제휴를 찾을 수 없습니다.');

      setDetail(detailObj);

      setEditForm({
        buildingId: detailObj?.buildingId ?? '',
        affiliateNm: detailObj?.affiliateNm ?? '',
        affiliateCeo: detailObj?.affiliateCeo ?? '',
        affiliateTel: detailObj?.affiliateTel ?? '',
        businessNo: detailObj?.businessNo ?? '',
        affiliateFax: detailObj?.affiliateFax ?? '',
        affiliateEmail: detailObj?.affiliateEmail ?? '',
        affiliateAddr: detailObj?.affiliateAddr ?? '',
        affiliateStartAt: toDatetimeLocal(detailObj?.affiliateStartAt),
        affiliateEndAt: toDatetimeLocal(detailObj?.affiliateEndAt),
        code: detailObj?.code ?? '',
        affiliateDesc: detailObj?.affiliateDesc ?? '',
        affiliateSt: detailObj?.affiliateSt ?? 'planned',
      });
    } catch (e) {
      alert(e?.message || '제휴 상세 조회 실패');
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModal(null);
    setDetail(null);
    setEditForm({
      buildingId: '',
      affiliateNm: '',
      affiliateCeo: '',
      affiliateTel: '',
      businessNo: '',
      affiliateFax: '',
      affiliateEmail: '',
      affiliateAddr: '',
      affiliateStartAt: '',
      affiliateEndAt: '',
      code: '',
      affiliateDesc: '',
      affiliateSt: 'planned',
    });
  };

  const handleSave = async () => {
    if (!detailModal) return;

    if (!String(editForm.buildingId).trim())
      return alert('건물 ID는 필수입니다.');
    if (!String(editForm.affiliateNm).trim())
      return alert('업체명은 필수입니다.');

    const periodMsg = validatePeriod(
      editForm.affiliateStartAt,
      editForm.affiliateEndAt
    );
    if (periodMsg) return alert(periodMsg);

    setSaveLoading(true);
    try {
      const body = {};
      const push = (k, v) => {
        if (v === undefined) return;
        body[k] = v;
      };

      push('buildingId', toNumOrNull(editForm.buildingId));

      const s = (v) => {
        const t = String(v ?? '').trim();
        return t ? t : undefined;
      };

      push('affiliateNm', s(editForm.affiliateNm));
      push('affiliateCeo', s(editForm.affiliateCeo));
      push('affiliateTel', s(editForm.affiliateTel));
      push('businessNo', s(editForm.businessNo));
      push('affiliateFax', s(editForm.affiliateFax));
      push('affiliateEmail', s(editForm.affiliateEmail));
      push('affiliateAddr', s(editForm.affiliateAddr));
      push('code', s(editForm.code)); // ✅ 드롭다운이든 뭐든 code 값만 가면 됨
      push('affiliateDesc', s(editForm.affiliateDesc));

      if (editForm.affiliateStartAt)
        push('affiliateStartAt', `${editForm.affiliateStartAt}:00`);
      if (editForm.affiliateEndAt)
        push('affiliateEndAt', `${editForm.affiliateEndAt}:00`);

      if (editForm.affiliateSt) push('affiliateSt', editForm.affiliateSt);

      await adminApi.updateAffiliate(detailModal, body);

      const freshList = await fetchList();
      const latest =
        freshList.find(
          (it) => Number(it?.affiliateId) === Number(detailModal)
        ) ?? null;

      try {
        const full = await adminApi.getAffiliateDetail(detailModal);
        const d = full?.data ?? full;
        if (d) setDetail(d);
      } catch {
        if (latest) setDetail((prev) => ({ ...(prev ?? {}), ...latest }));
      }

      const src = latest ?? detail;
      if (src) {
        setEditForm((f) => ({
          ...f,
          buildingId: src?.buildingId ?? f.buildingId,
          affiliateNm: src?.affiliateNm ?? f.affiliateNm,
          affiliateTel: src?.affiliateTel ?? f.affiliateTel,
          code: src?.code ?? f.code,
          affiliateSt: src?.affiliateSt ?? f.affiliateSt,
          affiliateStartAt:
            toDatetimeLocal(src?.affiliateStartAt) || f.affiliateStartAt,
          affiliateEndAt:
            toDatetimeLocal(src?.affiliateEndAt) || f.affiliateEndAt,
        }));
      }

      alert('저장되었습니다.');
    } catch (e) {
      alert(e?.message || '저장 실패 (PATCH /admin/affiliates/{id} 확인)');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!detailModal) return;
    if (!window.confirm(`제휴 #${detailModal} 를 삭제할까요?`)) return;

    setSaveLoading(true);
    try {
      await adminApi.deleteAffiliate(detailModal);
      await fetchList();
      alert('삭제되었습니다.');
      closeDetail();
    } catch (e) {
      alert(e?.message || '삭제 실패');
    } finally {
      setSaveLoading(false);
    }
  };

  const openCreate = () => {
    setCreateModal(true);
    setCreateForm({
      buildingId: '',
      affiliateNm: '',
      affiliateCeo: '',
      affiliateTel: '',
      businessNo: '',
      affiliateFax: '',
      affiliateEmail: '',
      affiliateAddr: '',
      affiliateStartAt: '',
      affiliateEndAt: '',
      code: '',
      affiliateDesc: '',
      affiliateSt: 'planned',
    });
  };

  const closeCreate = () => {
    setCreateModal(false);
    setCreateForm({
      buildingId: '',
      affiliateNm: '',
      affiliateCeo: '',
      affiliateTel: '',
      businessNo: '',
      affiliateFax: '',
      affiliateEmail: '',
      affiliateAddr: '',
      affiliateStartAt: '',
      affiliateEndAt: '',
      code: '',
      affiliateDesc: '',
      affiliateSt: 'planned',
    });
  };

  const handleCreate = async () => {
    if (!String(createForm.buildingId).trim())
      return alert('건물 ID는 필수입니다.');
    if (!String(createForm.affiliateNm).trim())
      return alert('업체명은 필수입니다.');

    const periodMsg = validatePeriod(
      createForm.affiliateStartAt,
      createForm.affiliateEndAt
    );
    if (periodMsg) return alert(periodMsg);

    setCreateLoading(true);
    try {
      const body = {
        buildingId: toNumOrNull(createForm.buildingId),
        affiliateNm: strOrNull(createForm.affiliateNm),
        affiliateCeo: strOrNull(createForm.affiliateCeo),
        affiliateTel: strOrNull(createForm.affiliateTel),
        businessNo: strOrNull(createForm.businessNo),
        affiliateFax: strOrNull(createForm.affiliateFax),
        affiliateEmail: strOrNull(createForm.affiliateEmail),
        affiliateAddr: strOrNull(createForm.affiliateAddr),
        affiliateStartAt: createForm.affiliateStartAt
          ? `${createForm.affiliateStartAt}:00`
          : null,
        affiliateEndAt: createForm.affiliateEndAt
          ? `${createForm.affiliateEndAt}:00`
          : null,
        code: strOrNull(createForm.code),
        affiliateDesc: strOrNull(createForm.affiliateDesc),
        affiliateSt: createForm.affiliateSt || 'planned',
      };

      await adminApi.createAffiliate(body);
      await fetchList();
      alert('등록되었습니다.');
      closeCreate();
    } catch (e) {
      alert(e?.message || '등록 실패');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className={styles.mainInner}>
      {/* 타이틀바 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>🤝 제휴 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>개의 제휴가 있습니다.
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
          <button
            type="button"
            className={styles.actionBtn}
            onClick={openCreate}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            제휴등록
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* 옵션바 */}
      <div className={styles.searchBar}>
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

        {/* 정렬 */}
        <select
          className={styles.filterSelect}
          value={`${query.sort}|${query.direct}`}
          onChange={(e) => {
            const [sort, direct] = String(e.target.value).split('|');
            setQuery((q) => ({ ...q, sort, direct, page: 1 }));
          }}
        >
          <option value="affiliateId|DESC">최신순</option>
          <option value="affiliateId|ASC">오래된순</option>
          <option value="affiliateNm|ASC">업체명 A→Z</option>
          <option value="affiliateNm|DESC">업체명 Z→A</option>
          <option value="affiliateStartAt|DESC">시작일 최신</option>
          <option value="affiliateStartAt|ASC">시작일 오래된</option>
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
          <p className={styles.emptyIcon}>🤝</p>
          <p>제휴가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>제휴 ID</th>
                <th>건물 ID</th>
                <th>업체명</th>
                <th>전화</th>
                <th>분류(code)</th>
                <th>상태</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const label = getCodeLabel(a?.code);
                return (
                  <tr key={a.affiliateId}>
                    <td className={styles.tdId}>#{a.affiliateId}</td>
                    <td className={styles.tdId}>{a.buildingId ?? '-'}</td>
                    <td className={styles.tdName}>{a.affiliateNm ?? '-'}</td>
                    <td className={styles.tdName}>{a.affiliateTel ?? '-'}</td>
                    <td className={styles.tdName}>
                      {a.code ? (
                        <>
                          {a.code}
                          {label ? (
                            <span style={{ marginLeft: 8, opacity: 0.7 }}>
                              ({label})
                            </span>
                          ) : null}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <StatusBadge status={a.affiliateSt} />
                    </td>
                    <td className={styles.tdDate}>
                      {fmtDt(a.affiliateStartAt)}
                    </td>
                    <td className={styles.tdDate}>{fmtDt(a.affiliateEndAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => openDetail(a.affiliateId)}
                      >
                        관리
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      {/* 등록 모달 */}
      {createModal && (
        <div className={styles.modalOverlay} onClick={closeCreate}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🤝 제휴 등록</h2>
              <button className={styles.modalClose} onClick={closeCreate}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>제휴 정보를 입력합니다.</p>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>건물 ID *</label>
                <input
                  type="number"
                  className={styles.searchInput}
                  value={createForm.buildingId}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, buildingId: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>업체명 *</label>
                <input
                  className={styles.searchInput}
                  value={createForm.affiliateNm}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateNm: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>상태</label>
                <select
                  className={styles.filterSelect}
                  value={createForm.affiliateSt}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateSt: e.target.value,
                    }))
                  }
                >
                  <option value="planned">예정</option>
                  <option value="progress">진행</option>
                  <option value="ended">종료</option>
                </select>
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>전화</label>
                <input
                  className={styles.searchInput}
                  value={createForm.affiliateTel}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateTel: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>대표자</label>
                <input
                  className={styles.searchInput}
                  value={createForm.affiliateCeo}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateCeo: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>사업자번호</label>
                <input
                  className={styles.searchInput}
                  value={createForm.businessNo}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, businessNo: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>팩스</label>
                <input
                  className={styles.searchInput}
                  value={createForm.affiliateFax}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateFax: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>이메일</label>
                <input
                  className={styles.searchInput}
                  value={createForm.affiliateEmail}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateEmail: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>주소</label>
                <input
                  className={styles.searchInput}
                  value={createForm.affiliateAddr}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateAddr: e.target.value,
                    }))
                  }
                />
              </div>

              {/* ✅ 드롭다운 적용 */}
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>분류(code)</label>
                <select
                  className={styles.filterSelect}
                  value={createForm.code || ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, code: e.target.value }))
                  }
                  disabled={codeLoading}
                >
                  <option value="">
                    {codeLoading ? '불러오는 중...' : '선택 안 함'}
                  </option>
                  {codeOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.codeValue ? `${c.codeValue} (${c.code})` : c.code}
                    </option>
                  ))}
                </select>

                {/* 참고용 표시 */}
                {createForm.code ? (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    선택: <strong>{createForm.code}</strong>
                    {getCodeLabel(createForm.code) ? (
                      <> / {getCodeLabel(createForm.code)}</>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>시작일(선택)</label>
                <input
                  type="datetime-local"
                  className={styles.searchInput}
                  value={createForm.affiliateStartAt}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateStartAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>종료일(선택)</label>
                <input
                  type="datetime-local"
                  className={styles.searchInput}
                  value={createForm.affiliateEndAt}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateEndAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>제휴 내용</label>
                <textarea
                  className={styles.searchInput}
                  rows={5}
                  value={createForm.affiliateDesc}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      affiliateDesc: e.target.value,
                    }))
                  }
                  placeholder="제휴 설명/혜택/유의사항 등"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className={styles.infoBox}>
                * 필수: <strong>건물 ID</strong>, <strong>업체명</strong>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={closeCreate}
                disabled={createLoading}
              >
                닫기
              </button>
              <button
                type="button"
                className={styles.modalConfirmBtn}
                onClick={handleCreate}
                disabled={createLoading}
              >
                {createLoading ? '등록 중...' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세/수정 모달 */}
      {detailModal && (
        <div className={styles.modalOverlay} onClick={closeDetail}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🤝 제휴 상세/수정</h2>
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
                  <p>제휴 상세를 불러오지 못했습니다.</p>
                </div>
              ) : (
                <>
                  <p className={styles.modalDesc}>
                    제휴 <strong>#{detailModal}</strong> 정보를 수정합니다.
                  </p>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>상태</label>
                    <div className={styles.statusBtnGroup}>
                      {[
                        { value: 'planned', label: '예정' },
                        { value: 'progress', label: '진행' },
                        { value: 'ended', label: '종료' },
                      ].map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`${styles.statusPickBtn} ${
                            editForm.affiliateSt === o.value
                              ? styles.statusPickBtnActive
                              : ''
                          }`}
                          onClick={() =>
                            setEditForm((f) => ({ ...f, affiliateSt: o.value }))
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>건물 ID *</label>
                    <input
                      type="number"
                      className={styles.searchInput}
                      value={editForm.buildingId}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          buildingId: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>업체명 *</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.affiliateNm}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateNm: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>전화</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.affiliateTel}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateTel: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>대표자</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.affiliateCeo}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateCeo: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>사업자번호</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.businessNo}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          businessNo: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>팩스</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.affiliateFax}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateFax: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>이메일</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.affiliateEmail}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateEmail: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>주소</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.affiliateAddr}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateAddr: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* ✅ 드롭다운 적용 */}
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>분류(code)</label>
                    <select
                      className={styles.filterSelect}
                      value={editForm.code || ''}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, code: e.target.value }))
                      }
                      disabled={codeLoading}
                    >
                      <option value="">
                        {codeLoading ? '불러오는 중...' : '선택 안 함'}
                      </option>
                      {codeOptions.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.codeValue ? `${c.codeValue} (${c.code})` : c.code}
                        </option>
                      ))}
                    </select>

                    {/* 현재 값 표시 */}
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      현재: {detail?.code ?? '-'}
                      {detail?.code && getCodeLabel(detail.code)
                        ? ` / ${getCodeLabel(detail.code)}`
                        : ''}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>시작일(선택)</label>
                    <input
                      type="datetime-local"
                      className={styles.searchInput}
                      value={editForm.affiliateStartAt}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateStartAt: e.target.value,
                        }))
                      }
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      현재: {fmtDt(detail.affiliateStartAt)}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>종료일(선택)</label>
                    <input
                      type="datetime-local"
                      className={styles.searchInput}
                      value={editForm.affiliateEndAt}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateEndAt: e.target.value,
                        }))
                      }
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      현재: {fmtDt(detail.affiliateEndAt)}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>제휴 내용</label>
                    <textarea
                      className={styles.searchInput}
                      rows={6}
                      value={editForm.affiliateDesc}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          affiliateDesc: e.target.value,
                        }))
                      }
                      placeholder="제휴 설명/혜택/유의사항 등"
                      style={{ resize: 'vertical' }}
                    />
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
                className={styles.modalCancelBtn}
                onClick={handleDelete}
                disabled={saveLoading || detailLoading}
                style={{ marginLeft: 8 }}
              >
                삭제
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
