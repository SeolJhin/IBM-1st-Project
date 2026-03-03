import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
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

  return String(raw ?? '').toLowerCase().replace('role_', '');
}

export default function ComplainEdit() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ compTitle: '', compCtnt: '', code: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = normalizeRole(user) === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

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
  }, [id, isAdmin]);

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>접근 권한 없음</h2>
          <p style={{ marginBottom: 16 }}>민원 수정은 관리자만 가능합니다.</p>
          <button className={styles.pageBtn} onClick={() => navigate(`/support/complain/${id}`)}>
            상세로
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.compTitle.trim()) return alert('제목을 입력해주세요.');
    if (!form.compCtnt.trim()) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      await supportApi.updateComplain(id, {
        compTitle: form.compTitle,
        compCtnt: form.compCtnt,
      });
      alert('수정되었습니다.');
      navigate(`/support/complain/${id}`);
    } catch (err) {
      alert(err.message || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>민원 수정</h2>

        <label className={styles.formLabel}>민원 유형</label>
        <select className={styles.formSelect} value={form.code} disabled>
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
          disabled={submitting}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          value={form.compCtnt}
          onChange={(e) => handleChange('compCtnt', e.target.value)}
          disabled={submitting}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className={styles.buttonPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? '수정 중...' : '수정'}
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => navigate(`/support/complain/${id}`)}
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
