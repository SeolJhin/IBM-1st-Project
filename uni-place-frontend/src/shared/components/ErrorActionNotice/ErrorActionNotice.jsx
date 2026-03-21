import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toErrorGuide } from '../../../app/http/errorMapper';
import styles from './ErrorActionNotice.module.css';

export default function ErrorActionNotice({
  error,
  fallback,
  onRetry,
  className = '',
  compact = false,
  hideTitle = false,
  variant = 'light',
}) {
  const navigate = useNavigate();
  const guide = toErrorGuide(error, fallback);

  if (!guide?.message) return null;

  const handleAction = (actionId) => {
    if (actionId === 'retry') {
      if (typeof onRetry === 'function') {
        onRetry();
        return;
      }
      window.location.reload();
      return;
    }

    if (actionId === 'reload') {
      window.location.reload();
      return;
    }

    if (actionId === 'login') {
      navigate('/login', {
        replace: true,
        state: { message: '로그인이 필요하거나 세션이 만료되었습니다.' },
      });
      return;
    }

    if (actionId === 'home') {
      navigate('/');
      return;
    }

    if (actionId === 'support') {
      navigate('/support/qna/write');
    }
  };

  return (
    <div
      className={`${styles.box} ${variant === 'dark' ? styles.dark : ''} ${compact ? styles.compact : ''} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {!hideTitle && guide.title ? (
        <div className={styles.title}>{guide.title}</div>
      ) : null}
      <div className={styles.message}>{guide.message}</div>
      {guide.actions?.length ? (
        <div className={styles.actions}>
          {guide.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles.actionBtn}
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
