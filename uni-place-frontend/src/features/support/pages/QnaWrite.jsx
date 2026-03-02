import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const QNA_CATEGORIES = [
  { code: 'QNA_CONTRACT', label: '계약 문의' },
  { code: 'QNA_PAYMENT', label: '결제/환불' },
  { code: 'QNA_FACILITY', label: '시설 이용' },
  { code: 'QNA_ROOMSERVICE', label: '룸서비스' },
  { code: 'QNA_MOVEINOUT', label: '입주/퇴실' },
  { code: 'QNA_ETC', label: '기타' },
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

export default function QnaWrite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { qnaId } = useParams();
  const isEdit = !!qnaId;

  const [form, setForm] = useState({ qnaTitle: '', qnaCtnt: '', code: '' });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const canCreate = role === 'admin' || role === 'tenant';

  useEffect(() => {
    if (!isEdit || !isAdmin) {
      setLoading(false);
      return;
    }

    supportApi
      .getQnaDetail(qnaId)
      .then((res) => {
        setForm({
          qnaTitle: res.qnaTitle ?? '',
          qnaCtnt: res.qnaCtnt ?? '',
          code: res.code ?? '',
        });
      })
      .catch((err) => {
        alert(err.message || '문의 내용을 불러오는 데 실패했습니다.');
        navigate('/support/qna');
      })
      .finally(() => setLoading(false));
  }, [isEdit, isAdmin, qnaId, navigate]);

  if (!user) return <Navigate to="/login" replace />;

  if (!isEdit && !canCreate) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>접근 권한 없음</h2>
          <p style={{ marginBottom: 16 }}>1:1 문의 작성은 관리자와 입주자만 가능합니다.</p>
          <button className={styles.pageBtn} onClick={() => navigate('/support/qna')}>
            목록으로
          </button>
        </div>
      </div>
    );
  }

  if (isEdit && !isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>접근 권한 없음</h2>
          <p style={{ marginBottom: 16 }}>1:1 문의 수정은 관리자만 가능합니다.</p>
          <button className={styles.pageBtn} onClick={() => navigate(`/support/qna/${qnaId}`)}>
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
    if (!form.code) return alert('문의 유형을 선택해주세요.');
    if (!form.qnaTitle.trim()) return alert('제목을 입력해주세요.');
    if (!form.qnaCtnt.trim()) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      if (isEdit) {
        await supportApi.updateQna(qnaId, form);
        alert('문의가 수정되었습니다.');
        navigate(`/support/qna/${qnaId}`);
      } else {
        await supportApi.createQna(form);
        alert('문의가 등록되었습니다.');
        navigate('/support/qna');
      }
    } catch (err) {
      alert(err.message || (isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>{isEdit ? '1:1 문의 수정' : '1:1 문의 작성'}</h2>

        <label className={styles.formLabel}>문의 유형</label>
        <select
          className={styles.formSelect}
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value)}
          disabled={submitting}
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
          disabled={submitting}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          placeholder="문의 내용을 입력하세요"
          value={form.qnaCtnt}
          onChange={(e) => handleChange('qnaCtnt', e.target.value)}
          disabled={submitting}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className={styles.buttonPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? (isEdit ? '수정 중...' : '등록 중...') : isEdit ? '수정' : '등록'}
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => (isEdit ? navigate(`/support/qna/${qnaId}`) : navigate('/support/qna'))}
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
