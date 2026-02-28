// features/support/pages/QnaWrite.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

// B방법: 프론트 하드코딩 기본값 (추후 API로 교체 가능)
const QNA_CATEGORIES = [
  { code: 'QNA_CONTRACT', label: '계약 문의' },
  { code: 'QNA_PAYMENT', label: '결제·환불' },
  { code: 'QNA_FACILITY', label: '시설 이용' },
  { code: 'QNA_ROOMSERVICE', label: '룸서비스' },
  { code: 'QNA_MOVEINOUT', label: '입주·퇴실' },
  { code: 'QNA_ETC', label: '기타' },
];

export default function QnaWrite() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    qnaTitle: '',
    qnaCtnt: '',
    code: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.code) return alert('문의 유형을 선택해주세요.');
    if (!form.qnaTitle.trim()) return alert('제목을 입력해주세요.');
    if (!form.qnaCtnt.trim()) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      await supportApi.createQna(form);
      alert('문의가 등록되었습니다.');
      navigate('/support/qna');
    } catch (err) {
      alert(err.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>1:1 문의 작성</h2>

        <label className={styles.formLabel}>문의 유형</label>
        <select
          className={styles.formSelect}
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value)}
        >
          <option value="">유형 선택</option>
          {QNA_CATEGORIES.map((cat) => (
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
          value={form.qnaTitle}
          onChange={(e) => handleChange('qnaTitle', e.target.value)}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          placeholder="문의 내용을 입력하세요"
          value={form.qnaCtnt}
          onChange={(e) => handleChange('qnaCtnt', e.target.value)}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={styles.buttonPrimary}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
          <button className={styles.pageBtn} onClick={() => navigate('/support/qna')}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
