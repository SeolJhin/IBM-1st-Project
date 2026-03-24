import { createPortal } from 'react-dom';
import React, { useState } from 'react';
import { adminApi } from '../../api/adminApi';
import FileUploader from '../../../file/components/FileUploader';
import useFileUpload from '../../../file/hooks/useFileUpload';
import styles from './AdminCreateModal.module.css';

const INITIAL = {
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

export default function AdminBuildingCreateModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fu = useFileUpload({ maxCount: 10 });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
      await adminApi.createBuilding(fd);
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e?.message || '';
      const code = e?.errorCode || '';
      if (code === 'BUILDING_409') {
        setError('이미 같은 이름의 건물이 존재합니다. 다른 건물명을 사용해주세요.');
      } else {
        setError(msg || '건물 등록에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>건물 등록</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

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
                  placeholder="예: Seoul A-ro 101"
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
                  placeholder="예: 대지"
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
                  placeholder="예: 200.50"
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
                  placeholder="예: 10"
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
                placeholder="건물에 대한 설명을 입력하세요"
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>임대인 정보</h3>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span className={styles.label}>임대인 성명</span>
                <input
                  className={styles.input}
                  name="buildingLessorNm"
                  value={form.buildingLessorNm}
                  onChange={handleChange}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>임대인 연락처</span>
                <input
                  className={styles.input}
                  name="buildingLessorTel"
                  value={form.buildingLessorTel}
                  onChange={handleChange}
                  placeholder="예: 010-1234-5678"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>임대인 주소</span>
                <input
                  className={styles.input}
                  name="buildingLessorAddr"
                  value={form.buildingLessorAddr}
                  onChange={handleChange}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>임대인 주민번호</span>
                <input
                  className={styles.input}
                  name="buildingLessorRrn"
                  value={form.buildingLessorRrn}
                  onChange={handleChange}
                  placeholder="예: 000000-1000000"
                />
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>이미지</h3>
            <FileUploader
              existingFiles={[]}
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
            disabled={loading}
          >
            {loading ? '등록 중...' : '건물 등록'}
          </button>
        </div>
      </div>
    </div>
  ,
  document.body
);
}
