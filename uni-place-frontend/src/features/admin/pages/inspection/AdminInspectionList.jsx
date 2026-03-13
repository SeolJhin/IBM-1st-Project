// src/features/admin/pages/inspection/AdminInspectionList.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionApi } from '../../api/inspectionApi';
import styles from './AdminInspectionList.module.css';

const STATUS_LABEL = {
  completed: { text: '완료', color: '#16a34a' },
  issue_detected: { text: '문제 감지', color: '#dc2626' },
  no_change: { text: '변화 없음', color: '#6b7280' },
};

const SPACE_TYPE_LABEL = {
  room: '객실',
  building: '건물',
  common_space: '공용공간',
};

export default function AdminInspectionList() {
  const navigate = useNavigate();

  // ── 목록 상태 ──────────────────────────────────────────
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 0,
    totalPages: 1,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  // ── 점검 생성 모달 상태 ────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    spaceType: 'room',
    spaceId: '',
    inspectionMemo: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  // ── 목록 로드 ──────────────────────────────────────────
  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await inspectionApi.getInspections({ page, size: 10 });
      const content = data?.content ?? (Array.isArray(data) ? data : []);
      setRows(content);
      setMeta({
        page: data?.page ?? page,
        totalPages: data?.totalPages ?? 1,
        totalElements: data?.totalElements ?? content.length,
      });
    } catch (e) {
      setError(e?.message || '목록을 불러오지 못했습니다.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // ── 이미지 선택 ────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── 점검 생성 제출 ─────────────────────────────────────
  const handleSubmit = async () => {
    if (!imageFile) {
      setSubmitError('이미지를 선택해주세요.');
      return;
    }
    if (!form.spaceId) {
      setSubmitError('공간 ID를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('afterImage', imageFile);
      formData.append('spaceType', form.spaceType);
      formData.append('spaceId', form.spaceId);
      if (form.inspectionMemo)
        formData.append('inspectionMemo', form.inspectionMemo);

      const result = await inspectionApi.createInspection(formData);
      setShowModal(false);
      resetModal();
      // 생성 후 상세 페이지로 이동
      navigate(`/admin/inspections/${result.inspectionId}`);
    } catch (e) {
      setSubmitError(e?.message || '점검 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setForm({ spaceType: 'room', spaceId: '', inspectionMemo: '' });
    setImageFile(null);
    setImagePreview(null);
    setSubmitError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (inspectionId) => {
    if (
      !window.confirm(
        `점검 #${inspectionId}을 삭제할까요?\n관련 티켓과 이미지도 함께 삭제됩니다.`
      )
    )
      return;
    setDeletingId(inspectionId);
    try {
      await inspectionApi.deleteInspection(inspectionId);
      loadList();
    } catch (e) {
      alert('삭제 실패: ' + (e?.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetModal();
  };

  return (
    <div className={styles.wrap}>
      {/* 헤더 */}
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.title}>건물 점검</h2>
          <p className={styles.sub}>
            Before/After 이미지를 AI로 비교해 손상 여부를 자동 감지합니다.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.btnTicket}
            onClick={() => navigate('/admin/inspections/tickets')}
          >
            하자 관리
          </button>
          <button
            className={styles.btnCreate}
            onClick={() => setShowModal(true)}
          >
            + 새 점검 등록
          </button>
        </div>
      </div>

      {/* 오류 */}
      {error && <div className={styles.error}>{error}</div>}

      {/* 테이블 */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>점검 ID</th>
              <th>공간 종류</th>
              <th>공간 ID</th>
              <th>변화율</th>
              <th>상태</th>
              <th>점검 일시</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.center}>
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.center}>
                  점검 기록이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const st = STATUS_LABEL[row.inspectionStatus] ?? {
                  text: row.inspectionStatus,
                  color: '#6b7280',
                };
                return (
                  <tr key={row.inspectionId}>
                    <td>{row.inspectionId}</td>
                    <td>{SPACE_TYPE_LABEL[row.spaceType] ?? row.spaceType}</td>
                    <td>{row.spaceId}</td>
                    <td>
                      {row.changePercent != null
                        ? `${Number(row.changePercent).toFixed(2)}%`
                        : '-'}
                    </td>
                    <td>
                      <span
                        className={styles.badge}
                        style={{ color: st.color, borderColor: st.color }}
                      >
                        {st.text}
                      </span>
                    </td>
                    <td>
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className={styles.btnDetail}
                          onClick={() =>
                            navigate(`/admin/inspections/${row.inspectionId}`)
                          }
                        >
                          상세보기
                        </button>
                        <button
                          className={styles.btnDelete}
                          disabled={deletingId === row.inspectionId}
                          onClick={() => handleDelete(row.inspectionId)}
                        >
                          {deletingId === row.inspectionId ? '...' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      <div className={styles.paging}>
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ◀ 이전
        </button>
        <span>
          {page + 1} / {meta.totalPages}
        </span>
        <button
          disabled={page + 1 >= meta.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음 ▶
        </button>
      </div>

      {/* 점검 생성 모달 */}
      {showModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>새 점검 등록</h3>
            <p className={styles.modalSub}>
              이미지를 업로드하면 AI가 이전 점검과 비교해 손상 여부를 자동으로
              분석합니다.
            </p>

            <div className={styles.field}>
              <label>공간 종류</label>
              <select
                value={form.spaceType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spaceType: e.target.value }))
                }
              >
                <option value="room">객실 (room)</option>
                <option value="building">건물 (building)</option>
                <option value="common_space">공용공간 (common_space)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>공간 ID</label>
              <input
                type="number"
                placeholder="예: 101"
                value={form.spaceId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spaceId: e.target.value }))
                }
              />
            </div>

            <div className={styles.field}>
              <label>
                점검 이미지 <span className={styles.required}>*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="미리보기"
                  className={styles.preview}
                />
              )}
            </div>

            <div className={styles.field}>
              <label>점검 메모 (선택)</label>
              <textarea
                placeholder="점검 내용을 간단히 적어주세요."
                value={form.inspectionMemo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, inspectionMemo: e.target.value }))
                }
                rows={3}
              />
            </div>

            {submitError && <div className={styles.error}>{submitError}</div>}

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={closeModal}
                disabled={submitting}
              >
                취소
              </button>
              <button
                className={styles.btnSubmit}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'AI 분석 중...' : '점검 등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
