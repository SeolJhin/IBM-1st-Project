// features/support/pages/ComplainEdit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

const COMPLAIN_CATEGORIES = [
  { code: 'COMP_PERSONAL', label: '개인' },
  { code: 'COMP_FACILITY', label: '시설' },
  { code: 'COMP_NOISE', label: '소음' },
  { code: 'COMP_CONTRACT', label: '입주·계약' },
  { code: 'COMP_SAFETY', label: '안전' },
  { code: 'COMP_ETC', label: '기타' },
];

export default function ComplainEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ compTitle: '', compCtnt: '', code: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supportApi
      .getComplainDetail(id)
      .then((res) => {
        setForm({
          compTitle: res.compTitle ?? '',
          compCtnt: res.compCtnt ?? '',
          code: res.code ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.code) return alert('민원 유형을 선택해주세요.');
    if (!form.compTitle.trim()) return alert('제목을 입력해주세요.');
    if (!form.compCtnt.trim()) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      await supportApi.updateComplain(id, form);
      alert('수정되었습니다.');
      navigate(`/support/complain/${id}`);
    } catch (err) {
      alert(err.message || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>민원 수정</h2>

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
          value={form.compTitle}
          onChange={(e) => handleChange('compTitle', e.target.value)}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          value={form.compCtnt}
          onChange={(e) => handleChange('compCtnt', e.target.value)}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={styles.buttonPrimary}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '수정 중...' : '수정'}
          </button>
          <button className={styles.pageBtn} onClick={() => navigate(`/support/complain/${id}`)}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
