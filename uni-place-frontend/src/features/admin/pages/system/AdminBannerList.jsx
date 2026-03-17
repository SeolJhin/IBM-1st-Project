// features/admin/pages/system/AdminBannerList.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from '../reservation/AdminReservation.module.css';

const STATUS_LABELS = {
  active: { label: '활성', cls: styles.badgeConfirmed },
  inactive: { label: '비활성', cls: styles.badgeCancelled },
};

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

export default function AdminBannerList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ 목록 쿼리
  const [query, setQuery] = useState({
    page: 1, // 화면 1-base
    size: 10,
    sort: 'banId',
    direct: 'DESC',
  });

  // ✅ 관리 모달
  const [detailModal, setDetailModal] = useState(null); // banId
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  // ✅ 수정 폼(모달 내부)
  const [editForm, setEditForm] = useState({
    banTitle: '',
    banUrl: '',
    banOrder: '',
    startAt: '',
    endAt: '',
    file: null,
    deleteImage: false,
    banSt: 'active', // ✅ 상태는 "저장 시"만 반영
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // ✅ 등록 모달
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    banTitle: '',
    banUrl: '',
    banOrder: '',
    startAt: '',
    endAt: '',
    file: null,
  });
  const [createLoading, setCreateLoading] = useState(false);

  /**
   * ✅ fetchList는 "state set"만 하지 말고, 반드시 list를 return 하게 만든다.
   * 그래야 저장 직후 최신값을 state race 없이 바로 쓸 수 있음.
   */
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await adminApi.getBanners({
        page: query.page - 1, // getBanners는 0-base
        size: query.size,
        sort: query.sort,
        direct: query.direct,
      });

      const list = res?.content ?? [];
      setItems(list);
      setTotalElements(res?.totalElements ?? 0);
      setTotalPages(res?.totalPages ?? 1);

      // ✅ 모달이 열려있다면, 최신 list 기준으로 detail 갱신
      if (detailModal) {
        const refreshed = list.find(
          (it) => Number(it?.banId) === Number(detailModal)
        );
        if (refreshed) setDetail(refreshed);
      }

      return list; // ✅ 핵심
    } catch (e) {
      setError(e?.message || '배너 목록 조회 실패');
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

  const openDetail = async (banId) => {
    setDetailModal(banId);
    setDetail(null);
    setDetailLoading(true);

    try {
      // 1) 현재 state에서 먼저 찾고
      let found =
        items.find((it) => Number(it?.banId) === Number(banId)) ?? null;

      // 2) 없으면 fetchList()가 return한 최신 리스트에서 찾는다 (state race 제거)
      if (!found) {
        const freshList = await fetchList();
        found =
          freshList.find((it) => Number(it?.banId) === Number(banId)) ?? null;
      }

      if (!found) throw new Error('배너를 찾을 수 없습니다.');

      setDetail(found);
      setEditForm({
        banTitle: found?.banTitle ?? '',
        banUrl: found?.banUrl ?? '',
        banOrder: found?.banOrder ?? '',
        startAt: toDatetimeLocal(found?.startAt),
        endAt: toDatetimeLocal(found?.endAt),
        file: null,
        deleteImage: false,
        banSt: found?.banSt ?? 'active',
      });
    } catch (e) {
      alert(e?.message || '배너 상세 조회 실패');
      setDetailModal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModal(null);
    setDetail(null);
    setEditForm({
      banTitle: '',
      banUrl: '',
      banOrder: '',
      startAt: '',
      endAt: '',
      file: null,
      deleteImage: false,
      banSt: 'active',
    });
  };

  const validatePeriod = (startAt, endAt) => {
    if (!startAt || !endAt) return '시작일/종료일은 필수입니다.';
    const s = new Date(`${startAt}:00`).getTime();
    const e = new Date(`${endAt}:00`).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e))
      return '날짜 형식이 올바르지 않습니다.';
    if (e < s) return '종료일은 시작일보다 빠를 수 없습니다.';
    return '';
  };

  // ✅ 저장: PUT(정보) → 필요하면 PATCH(상태) → 최신 list로 detail/editForm 확정 갱신
  const handleSave = async () => {
    if (!detailModal) return;

    const msg = validatePeriod(editForm.startAt, editForm.endAt);
    if (msg) return alert(msg);
    if (!String(editForm.banTitle).trim())
      return alert('배너 제목은 필수입니다.');
    if (
      editForm.banOrder === '' ||
      editForm.banOrder === null ||
      editForm.banOrder === undefined
    ) {
      return alert('정렬 순서는 필수입니다.');
    }

    setSaveLoading(true);
    try {
      // 1) PUT: 배너 정보 업데이트 (multipart/form-data)
      const fd = new FormData();
      fd.append('banTitle', editForm.banTitle);
      fd.append('banUrl', editForm.banUrl || '');
      fd.append('banOrder', String(editForm.banOrder));
      fd.append('startAt', `${editForm.startAt}:00`);
      fd.append('endAt', `${editForm.endAt}:00`);
      if (editForm.file) fd.append('file', editForm.file);
      fd.append('banSt', editForm.banSt);

      await adminApi.updateBanner(detailModal, fd, editForm.deleteImage);

      // 3) ✅ 최신 목록을 "return 값"으로 받아서 최신 detail 확정
      const freshList = await fetchList();
      const latest =
        freshList.find((it) => Number(it?.banId) === Number(detailModal)) ??
        null;

      // 서버가 update 후 값을 내려주지 않는 구조라면,
      // latest가 곧 “저장 이후 화면에 보여줘야 할 진짜 값”
      if (latest) {
        setDetail(latest);
        setEditForm((f) => ({
          ...f,
          banTitle: latest?.banTitle ?? '',
          banUrl: latest?.banUrl ?? '',
          banOrder: latest?.banOrder ?? '',
          startAt: toDatetimeLocal(latest?.startAt),
          endAt: toDatetimeLocal(latest?.endAt),
          banSt: latest?.banSt ?? f.banSt,
          file: null,
          deleteImage: false,
        }));
      } else {
        // 혹시 목록 페이지/size 때문에 최신이 안 들어오면 폼값 유지
        setEditForm((f) => ({ ...f, file: null, deleteImage: false }));
      }

      alert('저장되었습니다.');
    } catch (e) {
      alert(e?.message || '저장 실패 (PUT /admin/banners/{id} 확인)');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!detailModal) return;
    if (!window.confirm(`배너 #${detailModal} 를 삭제할까요?`)) return;

    setSaveLoading(true);
    try {
      await adminApi.deleteBanner(detailModal);
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
      banTitle: '',
      banUrl: '',
      banOrder: '',
      startAt: '',
      endAt: '',
      file: null,
    });
  };

  const closeCreate = () => {
    setCreateModal(false);
    setCreateForm({
      banTitle: '',
      banUrl: '',
      banOrder: '',
      startAt: '',
      endAt: '',
      file: null,
    });
  };

  const handleCreate = async () => {
    const msg = validatePeriod(createForm.startAt, createForm.endAt);
    if (msg) return alert(msg);
    if (!String(createForm.banTitle).trim())
      return alert('배너 제목은 필수입니다.');
    if (
      createForm.banOrder === '' ||
      createForm.banOrder === null ||
      createForm.banOrder === undefined
    ) {
      return alert('정렬 순서는 필수입니다.');
    }

    setCreateLoading(true);
    try {
      const fd = new FormData();
      fd.append('banTitle', createForm.banTitle);
      fd.append('banUrl', createForm.banUrl || '');
      fd.append('banOrder', String(createForm.banOrder));
      fd.append('startAt', `${createForm.startAt}:00`);
      fd.append('endAt', `${createForm.endAt}:00`);
      if (createForm.file) fd.append('file', createForm.file);

      await adminApi.createBanner(fd);
      await fetchList();
      alert('등록되었습니다.');
      closeCreate();
    } catch (e) {
      alert(e?.message || '등록 실패');
    } finally {
      setCreateLoading(false);
    }
  };

  const imageUrl = detail?.imageUrl
    ? detail.imageUrl.startsWith('/api')
      ? detail.imageUrl
      : `/api${detail.imageUrl}`
    : detail?.files?.[0]?.fileId
      ? `/api/files/${detail.files[0].fileId}/view`
      : '';

  return (
    <div className={styles.mainInner}>
      {/* 타이틀바 */}
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>🖼️ 배너 관리</h1>
          <p className={styles.pageSub}>
            총 <strong>{totalElements}</strong>개의 배너가 있습니다.
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
            배너등록
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

        {/* 정렬: 최신/오래된 + 노출순서 */}
        <select
          className={styles.filterSelect}
          value={`${query.sort}|${query.direct}`}
          onChange={(e) => {
            const [sort, direct] = String(e.target.value).split('|');
            setQuery((q) => ({ ...q, sort, direct, page: 1 }));
          }}
        >
          <option value="banId|DESC">최신순</option>
          <option value="banId|ASC">오래된순</option>
          <option value="banOrder|ASC">노출순서↑</option>
          <option value="banOrder|DESC">노출순서↓</option>
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
          <p className={styles.emptyIcon}>🖼️</p>
          <p>배너가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>배너 ID</th>
                <th>배너 제목</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>배너 상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.banId}>
                  <td className={styles.tdId}>#{b.banId}</td>
                  <td className={styles.tdName}>{b.banTitle ?? '-'}</td>
                  <td className={styles.tdDate}>{fmtDt(b.startAt)}</td>
                  <td className={styles.tdDate}>{fmtDt(b.endAt)}</td>
                  <td>
                    <StatusBadge status={b.banSt} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => openDetail(b.banId)}
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

      {/* 등록 모달 */}
      {createModal && (
        <div className={styles.modalOverlay} onClick={closeCreate}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>🖼️ 배너 등록</h2>
              <button className={styles.modalClose} onClick={closeCreate}>
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>배너 정보를 입력합니다.</p>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>배너 제목</label>
                <input
                  className={styles.searchInput}
                  value={createForm.banTitle}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, banTitle: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>이동 URL</label>
                <input
                  className={styles.searchInput}
                  value={createForm.banUrl}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, banUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>정렬 순서</label>
                <input
                  type="number"
                  className={styles.searchInput}
                  value={createForm.banOrder}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, banOrder: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>시작일</label>
                <input
                  type="datetime-local"
                  className={styles.searchInput}
                  value={createForm.startAt}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, startAt: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>종료일</label>
                <input
                  type="datetime-local"
                  className={styles.searchInput}
                  value={createForm.endAt}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, endAt: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalField}>
                <label className={styles.modalLabel}>배너 이미지(선택)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      file: e.target.files?.[0] ?? null,
                    }))
                  }
                />
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  선택됨: {createForm.file?.name ?? '없음'}
                </div>
              </div>

              <div className={styles.infoBox}>
                등록 시 기본 상태는 <strong>active</strong>로 저장됩니다.
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
              <h2 className={styles.modalTitle}>🖼️ 배너 상세/수정</h2>
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
                  <p>배너 상세를 불러오지 못했습니다.</p>
                </div>
              ) : (
                <>
                  <p className={styles.modalDesc}>
                    배너 <strong>#{detail.banId}</strong> 정보를 수정합니다.
                  </p>

                  {/* 상태: 폼만 변경, 저장 시 반영 */}
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>상태 변경</label>
                    <div className={styles.statusBtnGroup}>
                      {[
                        { value: 'active', label: '활성' },
                        { value: 'inactive', label: '비활성' },
                      ].map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`${styles.statusPickBtn} ${
                            editForm.banSt === o.value
                              ? styles.statusPickBtnActive
                              : ''
                          }`}
                          onClick={() =>
                            setEditForm((f) => ({ ...f, banSt: o.value }))
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 이미지 */}
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>이미지</label>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="banner"
                        style={{
                          width: '100%',
                          maxWidth: 520,
                          borderRadius: 12,
                          border: '1px solid rgba(0,0,0,0.08)',
                        }}
                      />
                    ) : (
                      <div className={styles.infoBox}>
                        등록된 이미지가 없습니다.
                      </div>
                    )}
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>배너 제목</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.banTitle}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, banTitle: e.target.value }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>이동 URL</label>
                    <input
                      className={styles.searchInput}
                      value={editForm.banUrl}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, banUrl: e.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>정렬 순서</label>
                    <input
                      type="number"
                      className={styles.searchInput}
                      value={editForm.banOrder}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, banOrder: e.target.value }))
                      }
                    />
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>시작일</label>
                    <input
                      type="datetime-local"
                      className={styles.searchInput}
                      value={editForm.startAt}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, startAt: e.target.value }))
                      }
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      현재: {fmtDt(detail.startAt)}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>종료일</label>
                    <input
                      type="datetime-local"
                      className={styles.searchInput}
                      value={editForm.endAt}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, endAt: e.target.value }))
                      }
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      현재: {fmtDt(detail.endAt)}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>이미지 교체</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          file: e.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                      선택됨: {editForm.file?.name ?? '없음'}
                    </div>
                  </div>

                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>
                      기존 이미지 삭제
                    </label>
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.deleteImage}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            deleteImage: e.target.checked,
                          }))
                        }
                      />
                      체크 시 저장하면 기존 이미지가 삭제됩니다.
                    </label>
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
