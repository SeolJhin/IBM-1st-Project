import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import { useRequireAuth } from '../hooks/useRequireAuth';
import styles from './Support.module.css';
import {
  validateTitle,
  validateContent,
} from '../../../shared/utils/validators';

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
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ compTitle: '', compCtnt: '', code: '' });
  const [imageFiles, setImageFiles] = useState([]); // { file, previewUrl }[]
  const [submitting, setSubmitting] = useState(false);

  const blocked = useRequireAuth(user, '민원 접수');
  if (blocked) return null;

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
    if (!form.code) return alert('민원 유형을 선택해주세요.');
    const titleErr = validateTitle(form.compTitle, '제목');
    if (titleErr) return alert(titleErr);
    const ctntErr = validateContent(form.compCtnt, '내용', 10);
    if (ctntErr) return alert(ctntErr);
    if (form.compCtnt.trim().length > 2000)
      return alert('내용은 2000자 이하로 입력해주세요.');
    setSubmitting(true);
    try {
      const created = await supportApi.createComplain(form);
      if (imageFiles.length > 0 && created?.compId) {
        await supportApi
          .uploadFiles(
            'COMPLAIN',
            created.compId,
            imageFiles.map((i) => i.file)
          )
          .catch((e) => {
            console.warn('이미지 업로드 실패:', e.message);
          });
      }
      alert('민원이 접수되었습니다.');
      navigate('/support/complain');
    } catch (err) {
      if (Number(err?.status) === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login', { state: { from: '/support/complain/write' } });
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
                    border: '1px solid #ddd',
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
