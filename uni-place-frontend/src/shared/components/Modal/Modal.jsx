// src/shared/components/Modal.jsx
import React, { useEffect } from 'react';
import styles from './Modal.module.css';

/**
 * 공통 팝업 모달
 * props: open, onClose, title, size('sm'|'md'|'lg'|'xl'), children
 */
export default function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={`${styles.panel} ${styles[size]}`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.closeBtn}
            type="button"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
