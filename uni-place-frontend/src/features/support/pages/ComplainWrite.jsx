import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const COMPLAIN_CATEGORIES = [
  { code: 'COMP_PERSONAL', label: '개인' },
  { code: 'COMP_FACILITY', label: '시설' },
  { code: 'COMP_NOISE', label: '소음' },
  { code: 'COMP_CONTRACT', label: '입주/계약' },
  { code: 'COMP_SAFETY', label: '안전' },
  { code: 'COMP_ETC', label: '기타' },
];

function normalizeRole(user) {
  const raw =
    user?.userRole ??
    user?.role ??
    user?.userRl ??
    user?.user_role ??
    user?.authority ??
    user?.authorities?.[0];

  return String(raw ?? '')
    .toLowerCase()
    .replace('role_', '');
}

export default function ComplainWrite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ compTitle: '', compCtnt: '', code: '' });
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const role = normalizeRole(user);
  const canCreate = role === 'admin' || role === 'tenant';
  if (!canCreate) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>접근 권한 없음</h2>
          <p style={{ marginBottom: 16 }}>
            민원 작성은 관리자와 입주민만 가능합니다.
          </p>
          <button
            className={styles.pageBtn}
            onClick={() => navigate('/support/complain')}
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

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
      if (Number(err?.status) === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login', {
          state: { from: '/support/complain/write' },
        });
        return;
      }
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
          disabled={submitting}
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
          placeholder="제목을 입력하세요."
          value={form.compTitle}
          onChange={(e) => handleChange('compTitle', e.target.value)}
          disabled={submitting}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          placeholder="민원 내용을 입력하세요."
          value={form.compCtnt}
          onChange={(e) => handleChange('compCtnt', e.target.value)}
          disabled={submitting}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={styles.buttonPrimary}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => navigate('/support/complain')}
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
