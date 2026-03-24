import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../api/adminApi';
import FileUploader from '../../../file/components/FileUploader';
import useFileUpload from '../../../file/hooks/useFileUpload';
import styles from './AdminCreateModal.module.css';

const EMPTY = {
  buildingNm: '',
  buildingAddr: '',
  buildingDesc: '',
  landCategory: '',
  buildSize: '',
  buildingUsage: '',
  existElv: 'N',
  parkingCapacity: '',
  buildingLessorNm: '',
  buildingLessorTel: '',
  buildingLessorAddr: '',
  buildingLessorRrn: '',
};

export default function AdminBuildingModal({ buildingId, onClose, onSuccess }) {
  const isEdit = !!buildingId;
  const [form, setForm] = useState(EMPTY);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const fu = useFileUpload({ maxCount: 10 });

  // ✅ fu.initExistingOrder를 ref로 안정화 — 배포 환경에서
  // useEffect 의존성 배열에 fu를 넣지 않아도 항상 최신 함수를 참조
  const initExistingOrderRef = useRef(fu.initExistingOrder);
  useEffect(() => {
    initExistingOrderRef.current = fu.initExistingOrder;
  });

  useEffect(() => {
    if (!isEdit) return;
    setFetchLoading(true);
    adminApi
      .getBuildingDetail(buildingId)
      .then((data) => {
        setForm({
          buildingNm: data.buildingNm || '',
          buildingAddr: data.buildingAddr || '',
          buildingDesc: data.buildingDesc || '',
          landCategory: data.landCategory || '',
          buildSize: data.buildSize ?? '',
          buildingUsage: data.buildingUsage || '',
          existElv: data.existElv || 'N',
          parkingCapacity: data.parkingCapacity ?? '',
          buildingLessorNm: data.buildingLessorNm || '',
          buildingLessorTel: data.buildingLessorTel || '',
          buildingLessorAddr: data.buildingLessorAddr || '',
          buildingLessorRrn: data.buildingLessorRrn || '',
        });
        setExistingFiles(data.files || []);
        initExistingOrderRef.current(data.files || []);
      })
      .catch((e) => setError(e?.message || '불러오기 실패'))
      .finally(() => setFetchLoading(false));
  }, [isEdit, buildingId]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.buildingNm.trim()) {
      setError('건물명은 필수입니다.');
      return;
    }
    if (!form.buildingAddr.trim()) {
      setError('주소는 필수입니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '') fd.append(k, v);
      });
      fu.newFiles.forEach((f) => fd.append('files', f));
      if (isEdit) {
        fu.deleteFileIds.forEach((id) => fd.append('deleteFileIds', id));
        if (fu.existingOrder) {
          fu.existingOrder.forEach((id) => fd.append('fileOrder', id));
        }
      }
      const result = await (isEdit
        ? adminApi.updateBuilding(buildingId, fd)
        : adminApi.createBuilding(fd));
      if (isEdit && result?.files) {
        setExistingFiles(result.files);
        fu.reset();
        fu.initExistingOrder(result.files);
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e?.message || '';
      const code = e?.errorCode || '';
      if (code === 'BUILDING_409') {
        setError(
          '이미 같은 이름의 건물이 존재합니다. 다른 건물명을 사용해주세요.'
        );
      } else {
        setError(msg || `건물 ${isEdit ? '수정' : '등록'} 실패`);
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>건물 {isEdit ? '수정' : '등록'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        {fetchLoading ? (
          <div className={styles.body}>
            <p style={{ color: '#6b7280', fontSize: 13 }}>불러오는 중...</p>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>기본 정보</h3>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>
                    건물명 <span className={styles.req}>*</span>
                  </span>
                  <input
                    className={styles.input}
                    name="buildingNm"
                    value={form.buildingNm}
                    onChange={handleChange}
                    placeholder="예: Uniplace A"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>
                    주소 <span className={styles.req}>*</span>
                  </span>
                  <input
                    className={styles.input}
                    name="buildingAddr"
                    value={form.buildingAddr}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>용도</span>
                  <input
                    className={styles.input}
                    name="buildingUsage"
                    value={form.buildingUsage}
                    onChange={handleChange}
                    placeholder="예: residence, mixed"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>대지 분류</span>
                  <input
                    className={styles.input}
                    name="landCategory"
                    value={form.landCategory}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>건물 크기 (㎡)</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="buildSize"
                    value={form.buildSize}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>주차 가능 수</span>
                  <input
                    className={styles.input}
                    type="number"
                    name="parkingCapacity"
                    value={form.parkingCapacity}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>엘리베이터</span>
                  <select
                    className={styles.select}
                    name="existElv"
                    value={form.existElv}
                    onChange={handleChange}
                  >
                    <option value="Y">있음</option>
                    <option value="N">없음</option>
                  </select>
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>건물 설명</span>
                <textarea
                  className={styles.textarea}
                  name="buildingDesc"
                  value={form.buildingDesc}
                  onChange={handleChange}
                  rows={3}
                />
              </label>
            </div>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>임대인 정보</h3>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>성명</span>
                  <input
                    className={styles.input}
                    name="buildingLessorNm"
                    value={form.buildingLessorNm}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>연락처</span>
                  <input
                    className={styles.input}
                    name="buildingLessorTel"
                    value={form.buildingLessorTel}
                    onChange={handleChange}
                    placeholder="010-0000-0000"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>주소</span>
                  <input
                    className={styles.input}
                    name="buildingLessorAddr"
                    value={form.buildingLessorAddr}
                    onChange={handleChange}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>주민번호</span>
                  <input
                    className={styles.input}
                    name="buildingLessorRrn"
                    value={form.buildingLessorRrn}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>이미지</h3>
              <FileUploader
                existingFiles={existingFiles}
                newFiles={fu.newFiles}
                previews={fu.previews}
                deleteFileIds={fu.deleteFileIds}
                existingOrder={fu.existingOrder}
                addFiles={fu.addFiles}
                removeNewFile={fu.removeNewFile}
                moveNewFile={fu.moveNewFile}
                toggleDeleteExisting={fu.toggleDeleteExisting}
                moveExisting={fu.moveExisting}
                label="건물 이미지"
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </div>
        )}
        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading || fetchLoading}
          >
            {loading ? '처리 중...' : isEdit ? '수정 완료' : '건물 등록'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
