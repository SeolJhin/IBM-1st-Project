// features/support/pages/FaqList.jsx
import React, { useState } from 'react';
import { useFaqs } from '../hooks/useFaqs';
import styles from './Support.module.css';

export default function FaqList() {
  const { faqs, pagination, loading, error, goToPage } = useFaqs();
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!faqs.length) return <div style={{ padding: 24 }}>등록된 FAQ가 없습니다.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.accordionList}>
        {faqs.map((faq) => {
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
                <span className={styles.accordionIcon}>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className={styles.accordionBody}>
                  <span className={styles.accordionA}>A</span>
                  <p className={styles.accordionContent}>{faq.faqCtnt}</p>
                </div>
              )}
            </div>
          );
        })}
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
