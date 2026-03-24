import React, { useState } from 'react';
import { adminApi } from '../../api/adminApi';
import useBuildingOptions from '../../hooks/useBuildingOptions';
import FileUploader from '../../../file/components/FileUploader';
import useFileUpload from '../../../file/hooks/useFileUpload';
import styles from './AdminCreateModal.module.css';

const INITIAL = {
  buildingNm: '',
  spaceNm: '',
  spaceFloor: '',
  spaceCapacity: '',
  spaceOptions: '',
  spaceDesc: '',
};

export default function AdminSpaceCreateModal({ onClose, onSuccess }) {
  const { buildings, loading: bldgLoading } = useBuildingOptions();
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
    if (!form.spaceNm.trim()) {
      setError('공간명은 필수입니다.');
      return;
    }
    if (!form.spaceFloor) {
      setError('층수는 필수입니다.');
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
      await adminApi.createSpace(fd);
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e?.message || '';
      const code = e?.errorCode || '';
      const msgLower = msg.toLowerCase();
      if (code === 'BUILDING_409') {
        setError('이미 같은 이름의 건물이 존재합니다.');
      } else if (msgLower.includes('duplicate entry')) {
        setError('같은 건물에 이미 동일한 공용공간이 존재합니다.');
      } else if (code === 'BUILDING_404') {
        setError('선택한 건물을 찾을 수 없습니다.');
      } else {
        setError(msg || '공용공간 등록에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>공용공간 등록</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>기본 정보</h3>
            <div className={styles.grid2}>
              <label className={styles.field} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.label}>
                  건물 선택 <span className={styles.req}>*</span>
                </span>
                <select
                  className={styles.select}
                  name="buildingNm"
                  value={form.buildingNm}
                  onChange={handleChange}
                  disabled={bldgLoading}
                >
                  <option value="">
                    {bldgLoading ? '불러오는 중...' : '건물을 선택하세요'}
                  </option>
                  {buildings.map((b) => (
                    <option key={b.buildingId} value={b.buildingNm}>
                      [{b.buildingId}] {b.buildingNm} — {b.buildingAddr}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>
                  공간명 <span className={styles.req}>*</span>
                </span>
                <input
                  className={styles.input}
                  name="spaceNm"
                  value={form.spaceNm}
                  onChange={handleChange}
                  placeholder="예: 루프탑, 피트니스센터"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>
                  층수 <span className={styles.req}>*</span>
                </span>
                <input
                  className={styles.input}
                  type="number"
                  name="spaceFloor"
                  value={form.spaceFloor}
                  onChange={handleChange}
                  placeholder="예: 1"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>수용 인원</span>
                <input
                  className={styles.input}
                  type="number"
                  name="spaceCapacity"
                  value={form.spaceCapacity}
                  onChange={handleChange}
                  placeholder="예: 20"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>옵션 (쉼표 구분)</span>
                <input
                  className={styles.input}
                  name="spaceOptions"
                  value={form.spaceOptions}
                  onChange={handleChange}
                  placeholder="예: 프로젝터,냉난방"
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className={styles.label}>공간 설명</span>
              <textarea
                className={styles.textarea}
                name="spaceDesc"
                value={form.spaceDesc}
                onChange={handleChange}
                rows={3}
                placeholder="공용공간에 대한 설명을 입력하세요"
              />
            </label>
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
              label="공용공간 이미지"
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
            {loading ? '등록 중...' : '공용공간 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
