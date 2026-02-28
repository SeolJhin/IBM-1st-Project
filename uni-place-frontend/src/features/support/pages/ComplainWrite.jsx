// features/support/pages/ComplainWrite.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

// B방법: 프론트 하드코딩 기본값 (추후 API로 교체 가능)
const COMPLAIN_CATEGORIES = [
  { code: 'COMP_PERSONAL', label: '개인' },
  { code: 'COMP_FACILITY', label: '시설' },
  { code: 'COMP_NOISE', label: '소음' },
  { code: 'COMP_CONTRACT', label: '입주·계약' },
  { code: 'COMP_SAFETY', label: '안전' },
  { code: 'COMP_ETC', label: '기타' },
];

export default function ComplainWrite() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    compTitle: '',
    compCtnt: '',
    code: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.code) return alert('민원 유형을 선택해주세요.');
    if (!form.compTitle.trim()) return alert('제목을 입력해주세요.');
    if (!form.compCtnt.trim()) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      await supportApi.createComplain(form);
      alert('민원이 접수되었습니다.');
      navigate('/support/complain');
    } catch (err) {
      alert(err.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>민원 작성</h2>

        <label className={styles.formLabel}>민원 유형</label>
        <select
          className={styles.formSelect}
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value)}
        >
          <option value="">유형 선택</option>
          {COMPLAIN_CATEGORIES.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {cat.label}
            </option>
          ))}
        </select>

        <label className={styles.formLabel}>제목</label>
        <input
          className={styles.formInput}
          type="text"
          placeholder="제목을 입력하세요"
          value={form.compTitle}
          onChange={(e) => handleChange('compTitle', e.target.value)}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          placeholder="민원 내용을 입력하세요"
          value={form.compCtnt}
          onChange={(e) => handleChange('compCtnt', e.target.value)}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={styles.buttonPrimary}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
          <button className={styles.pageBtn} onClick={() => navigate('/support/complain')}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
