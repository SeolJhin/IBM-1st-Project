import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import { useRequireAuth } from '../hooks/useRequireAuth';
import styles from './Support.module.css';
import {
  validateTitle,
  validateContent,
} from '../../../shared/utils/validators';

const QNA_CATEGORIES = [
  { code: 'QNA_CONTRACT', label: '계약 문의' },
  { code: 'QNA_PAYMENT', label: '결제/환불' },
  { code: 'QNA_FACILITY', label: '시설 이용' },
  { code: 'QNA_ROOMSERVICE', label: '룸서비스' },
  { code: 'QNA_MOVEINOUT', label: '입주/퇴거' },
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
  const isEdit = Boolean(qnaId);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ qnaTitle: '', qnaCtnt: '', code: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const role = normalizeRole(user);
  const isAdmin = role === 'admin';
  const isTenant = role === 'tenant';
  const canCreate = isAdmin || isTenant;

  useEffect(() => {
    if (!isEdit || (!isAdmin && !isTenant)) {
      setLoading(false);
      return;
    }
    supportApi
      .getQnaDetail(qnaId)
      .then((res) => {
        if (isTenant && !isAdmin && res.userId !== user?.userId) {
          alert('본인이 작성한 문의만 수정할 수 있습니다.');
          navigate(`/support/qna/${qnaId}`);
          return;
        }
        setForm({
          qnaTitle: res.qnaTitle ?? '',
          qnaCtnt: res.qnaCtnt ?? '',
          code: res.code ?? '',
        });
      })
      .catch((err) => {
        alert(err.message || '문의 내용을 불러오지 못했습니다.');
        navigate('/support/qna');
      })
      .finally(() => setLoading(false));
  }, [isEdit, isAdmin, isTenant, qnaId, user, navigate]); // eslint-disable-line

  const blocked = useRequireAuth(user, '1:1 문의');
  if (blocked) return null;
  if (!isEdit && !canCreate) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>접근 권한 없음</h2>
          <p style={{ marginBottom: 16 }}>
            1:1 문의 작성은 관리자와 입주자만 가능합니다.
          </p>
          <button
            className={styles.pageBtn}
            onClick={() => navigate('/support/qna')}
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }
  if (isEdit && !isAdmin && !isTenant) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>접근 권한 없음</h2>
          <p style={{ marginBottom: 16 }}>
            1:1 문의 수정은 관리자 또는 본인만 가능합니다.
          </p>
          <button
            className={styles.pageBtn}
            onClick={() => navigate(`/support/qna/${qnaId}`)}
          >
            상세로
          </button>
        </div>
      </div>
    );
  }
  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const valid = files.filter((f) => allowed.includes(f.type));
    if (valid.length !== files.length)
      alert('이미지 파일(PNG, JPG, GIF, WEBP)만 업로드 가능합니다.');
    setImageFiles((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setImageFiles((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    if (!isEdit && !form.code) return alert('문의 유형을 선택해주세요.');
    const titleErr = validateTitle(form.qnaTitle, '제목');
    if (titleErr) return alert(titleErr);
    const ctntErr = validateContent(form.qnaCtnt, '내용', 10);
    if (ctntErr) return alert(ctntErr);
    if (form.qnaCtnt.trim().length > 2000)
      return alert('내용은 2000자 이하로 입력해주세요.');
    setSubmitting(true);
    try {
      if (isEdit) {
        await supportApi.updateQna(qnaId, {
          qnaTitle: form.qnaTitle,
          qnaCtnt: form.qnaCtnt,
        });
        if (imageFiles.length > 0) {
          await supportApi
            .uploadFiles(
              'QNA',
              Number(qnaId),
              imageFiles.map((i) => i.file)
            )
            .catch((e) => console.warn('이미지 업로드 실패:', e.message));
        }
        alert('문의가 수정되었습니다.');
        navigate(`/support/qna/${qnaId}`);
      } else {
        const created = await supportApi.createQna(form);
        if (imageFiles.length > 0 && created?.qnaId) {
          await supportApi
            .uploadFiles(
              'QNA',
              created.qnaId,
              imageFiles.map((i) => i.file)
            )
            .catch((e) => console.warn('이미지 업로드 실패:', e.message));
        }
        alert('문의가 등록되었습니다.');
        navigate('/support/qna');
      }
    } catch (err) {
      alert(
        err.message ||
          (isEdit ? '수정에 실패했습니다.' : '등록에 실패했습니다.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>
          {isEdit ? '1:1 문의 수정' : '1:1 문의 작성'}
        </h2>

        <label className={styles.formLabel}>문의 유형</label>
        <select
          className={styles.formSelect}
          value={form.code}
          onChange={(e) => handleChange('code', e.target.value)}
          disabled={submitting || isEdit}
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
          placeholder="제목을 입력하세요."
          value={form.qnaTitle}
          onChange={(e) => handleChange('qnaTitle', e.target.value)}
          disabled={submitting}
        />

        <label className={styles.formLabel}>내용</label>
        <textarea
          className={styles.formTextarea}
          placeholder="문의 내용을 입력하세요."
          value={form.qnaCtnt}
          onChange={(e) => handleChange('qnaCtnt', e.target.value)}
          disabled={submitting}
        />

        {/* 사진 첨부 */}
        <label className={styles.formLabel}>사진 첨부 (선택)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageAdd}
        />
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
          style={{ marginBottom: 10 }}
        >
          + 사진 선택
        </button>
        {imageFiles.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 12,
            }}
          >
            {imageFiles.map((item, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <img
                  src={item.previewUrl}
                  alt=""
                  style={{
                    width: 100,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1.5px solid var(--primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#e55',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    lineHeight: '20px',
                    textAlign: 'center',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={styles.buttonPrimary}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? isEdit
                ? '수정 중...'
                : '등록 중...'
              : isEdit
                ? '수정'
                : '등록'}
          </button>
          <button
            className={styles.pageBtn}
            onClick={() =>
              isEdit
                ? navigate(`/support/qna/${qnaId}`)
                : navigate('/support/qna')
            }
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
