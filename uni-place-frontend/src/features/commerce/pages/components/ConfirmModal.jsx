// src/features/commerce/pages/components/ConfirmModal.jsx
// 취소/삭제 등 중요 액션 전 확인 모달

import React, { useEffect, useState } from 'react';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({
  title,
  desc,
  onConfirm,
  onCancel,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = true,
}) {
  const [loading, setLoading] = useState(false);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>{danger ? '⚠️' : 'ℹ️'}</div>
        <h2 className={styles.title}>{title}</h2>
        {desc && <p className={styles.desc}>{desc}</p>}
        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${danger ? styles.confirmDanger : ''}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
