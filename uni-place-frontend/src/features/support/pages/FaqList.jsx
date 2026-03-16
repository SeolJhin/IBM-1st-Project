import React, { useState } from 'react';
import { useFaqs } from '../hooks/useFaqs';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

// ── 카테고리 정의 (코드 → 라벨/스타일) ──────────────────────
const CODE_LABEL = {
  SUP_GENERAL: { label: '일반', cls: 'type_general' },
  SUP_BILLING: { label: '요금/정산', cls: 'type_billing' },
  FAQ_CONTRACT: { label: '계약', cls: 'type_faq_contract' },
  FAQ_FACILITY: { label: '시설 이용', cls: 'type_faq_facility' },
  FAQ_MOVEINOUT: { label: '입주/퇴실', cls: 'type_faq_moveinout' },
  FAQ_ROOMSERVICE: { label: '룸서비스', cls: 'type_faq_roomservice' },
  FAQ_COMMUNITY: { label: '커뮤니티', cls: 'type_faq_community' },
  FAQ_ETC: { label: '기타', cls: 'type_etc' },
};

// ── select 옵션용 배열 ────────────────────────────────────────
const CODE_OPTIONS = [
  { value: 'SUP_GENERAL', label: '일반' },
  { value: 'SUP_BILLING', label: '요금/정산' },
  { value: 'FAQ_CONTRACT', label: '계약' },
  { value: 'FAQ_FACILITY', label: '시설 이용' },
  { value: 'FAQ_MOVEINOUT', label: '입주/퇴실' },
  { value: 'FAQ_ROOMSERVICE', label: '룸서비스' },
  { value: 'FAQ_COMMUNITY', label: '커뮤니티' },
  { value: 'FAQ_ETC', label: '기타' },
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

export default function FaqList() {
  const { user } = useAuth();
  const { faqs, pagination, loading, error, goToPage, refetch } = useFaqs();

  const [openId, setOpenId] = useState(null);
  const [showWriter, setShowWriter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [writeForm, setWriteForm] = useState({
    faqTitle: '',
    faqCtnt: '',
    code: 'SUP_GENERAL',
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    faqTitle: '',
    faqCtnt: '',
    code: 'SUP_GENERAL',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isAdmin = normalizeRole(user) === 'admin';
  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));
  const handleChange = (field, value) =>
    setWriteForm((prev) => ({ ...prev, [field]: value }));

  const startEdit = (faq) => {
    setEditingId(faq.faqId);
    setOpenId(faq.faqId);
    setEditForm({
      faqTitle: faq.faqTitle ?? '',
      faqCtnt: faq.faqCtnt ?? '',
      code: faq.code ?? 'SUP_GENERAL',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ faqTitle: '', faqCtnt: '', code: 'SUP_GENERAL' });
  };

  const handleCreate = async () => {
    if (!writeForm.faqTitle.trim()) return alert('제목을 입력해주세요.');
    if (!writeForm.faqCtnt.trim()) return alert('내용을 입력해주세요.');
    setSubmitting(true);
    try {
      await supportApi.createFaq(writeForm);
      setWriteForm({ faqTitle: '', faqCtnt: '', code: 'SUP_GENERAL' });
      setShowWriter(false);
      await refetch();
      alert('FAQ가 등록되었습니다.');
    } catch (e) {
      alert(e.message || '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (faqId) => {
    if (!editForm.faqTitle.trim()) return alert('제목을 입력해주세요.');
    if (!editForm.faqCtnt.trim()) return alert('내용을 입력해주세요.');
    setEditSubmitting(true);
    try {
      await supportApi.updateFaq(faqId, editForm);
      await refetch();
      cancelEdit();
      alert('FAQ가 수정되었습니다.');
    } catch (e) {
      alert(e.message || '수정에 실패했습니다.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm('FAQ를 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteFaq(faqId);
      await refetch();
      if (editingId === faqId) cancelEdit();
      alert('FAQ가 삭제되었습니다.');
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHead}>
        <h2 className={styles.pageTitle}>FAQ</h2>
      </div>

      {/* ── 관리자 글쓰기 ────────────────────────────────────── */}
      {isAdmin && (
        <>
          <div className={styles.listActions}>
            <button
              className={styles.buttonPrimary}
              onClick={() => setShowWriter((prev) => !prev)}
            >
              {showWriter ? '닫기' : '+ FAQ 글쓰기'}
            </button>
          </div>

          {showWriter && (
            <div className={styles.card} style={{ marginBottom: 16 }}>
              <label className={styles.formLabel}>제목</label>
              <input
                className={styles.formInput}
                value={writeForm.faqTitle}
                onChange={(e) => handleChange('faqTitle', e.target.value)}
                maxLength={100}
                disabled={submitting}
              />

              <label className={styles.formLabel}>분류</label>
              <select
                className={styles.formSelect}
                value={writeForm.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={submitting}
              >
                {CODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <label className={styles.formLabel}>내용</label>
              <textarea
                className={styles.formTextarea}
                value={writeForm.faqCtnt}
                onChange={(e) => handleChange('faqCtnt', e.target.value)}
                maxLength={3000}
                disabled={submitting}
              />
              <div style={{ marginTop: 12 }}>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleCreate}
                  disabled={submitting}
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FAQ 아코디언 목록 ─────────────────────────────────── */}
      <div className={styles.accordionList}>
        {faqs.length === 0 ? (
          <div
            className={styles.card}
            style={{ textAlign: 'center', color: 'var(--muted)' }}
          >
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          faqs.map((faq) => {
            const isOpen = openId === faq.faqId;
            const isEditing = editingId === faq.faqId;
            const codeMeta = CODE_LABEL[faq.code] ?? {
              label: faq.code ?? '',
              cls: 'type_general',
            };

            return (
              <div
                key={faq.faqId}
                className={`${styles.accordionItem} ${isOpen ? styles.accordionItemOpen : ''}`}
              >
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggle(faq.faqId)}
                  type="button"
                >
                  <span className={styles.accordionQ}>Q</span>
                  <span
                    className={`${styles.typeBadge} ${styles[codeMeta.cls]}`}
                    style={{ flexShrink: 0 }}
                  >
                    {codeMeta.label}
                  </span>
                  <span className={styles.accordionTitle}>{faq.faqTitle}</span>
                  <span className={styles.accordionIcon}>
                    {isOpen ? '-' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className={styles.accordionBody}>
                    <span className={styles.accordionA}>A</span>
                    <div style={{ width: '100%' }}>
                      {isEditing ? (
                        <>
                          <label className={styles.formLabel}>제목</label>
                          <input
                            className={styles.formInput}
                            value={editForm.faqTitle}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                faqTitle: e.target.value,
                              }))
                            }
                            maxLength={100}
                            disabled={editSubmitting}
                          />

                          <label className={styles.formLabel}>분류</label>
                          <select
                            className={styles.formSelect}
                            value={editForm.code}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                code: e.target.value,
                              }))
                            }
                            disabled={editSubmitting}
                          >
                            {CODE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>

                          <label className={styles.formLabel}>내용</label>
                          <textarea
                            className={styles.formTextarea}
                            value={editForm.faqCtnt}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                faqCtnt: e.target.value,
                              }))
                            }
                            maxLength={3000}
                            disabled={editSubmitting}
                          />
                          <div
                            style={{ display: 'flex', gap: 8, marginTop: 8 }}
                          >
                            <button
                              className={styles.buttonPrimary}
                              type="button"
                              onClick={() => handleUpdate(faq.faqId)}
                              disabled={editSubmitting}
                            >
                              {editSubmitting ? '저장 중...' : '저장'}
                            </button>
                            <button
                              className={styles.pageBtn}
                              type="button"
                              onClick={cancelEdit}
                              disabled={editSubmitting}
                            >
                              취소
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className={styles.accordionContent}>{faq.faqCtnt}</p>
                      )}

                      {isAdmin && !isEditing && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button
                            className={styles.buttonPrimary}
                            type="button"
                            onClick={() => startEdit(faq)}
                          >
                            수정
                          </button>
                          <button
                            className={styles.pageBtn}
                            type="button"
                            onClick={() => handleDelete(faq.faqId)}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── 페이지네이션 ─────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.isFirst}
            onClick={() => goToPage(pagination.page - 1)}
          >
            이전
          </button>
          <span className={styles.pageInfo}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.isLast}
            onClick={() => goToPage(pagination.page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
