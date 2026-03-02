import React, { useState } from 'react';
import { useFaqs } from '../hooks/useFaqs';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

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

  const isAdmin = normalizeRole(user) === 'admin';

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  const handleChange = (field, value) => {
    setWriteForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateFaq = async () => {
    if (!isAdmin) {
      alert('관리자만 FAQ를 등록할 수 있습니다.');
      return;
    }

    const title = writeForm.faqTitle.trim();
    const content = writeForm.faqCtnt.trim();
    if (!title) return alert('제목을 입력해주세요.');
    if (!content) return alert('내용을 입력해주세요.');

    setSubmitting(true);
    try {
      await supportApi.createFaq({
        faqTitle: title,
        faqCtnt: content,
        code: writeForm.code,
      });
      setWriteForm({
        faqTitle: '',
        faqCtnt: '',
        code: 'SUP_GENERAL',
      });
      setShowWriter(false);
      await refetch();
      alert('FAQ가 등록되었습니다.');
    } catch (e) {
      alert(e.message || 'FAQ 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      {isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className={styles.buttonPrimary} onClick={() => setShowWriter((v) => !v)}>
              {showWriter ? '작성 닫기' : 'FAQ 글쓰기'}
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

              <label className={styles.formLabel}>분류 코드</label>
              <select
                className={styles.formSelect}
                value={writeForm.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={submitting}
              >
                <option value="SUP_GENERAL">일반</option>
                <option value="SUP_BILLING">요금/정산</option>
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
                  onClick={handleCreateFaq}
                  disabled={submitting}
                >
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.accordionList}>
        {faqs.length === 0 ? (
          <div className={styles.card} style={{ textAlign: 'center', color: 'var(--muted)' }}>
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          faqs.map((faq) => {
            const isOpen = openId === faq.faqId;
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
                  <span className={styles.accordionTitle}>{faq.faqTitle}</span>
                  <span className={styles.accordionIcon}>{isOpen ? '-' : '+'}</span>
                </button>
                {isOpen && (
                  <div className={styles.accordionBody}>
                    <span className={styles.accordionA}>A</span>
                    <p className={styles.accordionContent}>{faq.faqCtnt}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

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
