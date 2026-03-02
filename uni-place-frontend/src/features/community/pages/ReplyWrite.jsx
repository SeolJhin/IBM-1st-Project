import React, { useMemo, useState } from 'react';
import styles from './ReplyWrite.module.css';
import { communityApi } from '../api/communityApi';

export default function ReplyWrite({
  boardId,
  parentId = null, // 있으면 대댓글
  onCreated, // 작성 성공 후 목록 리로드 콜백
  onCancel, // 대댓글 입력 닫기
  autoFocus = false,
}) {
  const [replyCtnt, setReplyCtnt] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const isChild = useMemo(
    () => parentId !== null && parentId !== undefined,
    [parentId]
  );
  const maxLen = 2000;

  const canSubmit = replyCtnt.trim().length > 0 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    const value = replyCtnt.trim();
    if (!value) {
      setErr('내용을 입력해 주세요.');
      return;
    }
    if (value.length > maxLen) {
      setErr(`최대 ${maxLen}자까지 입력할 수 있어요.`);
      return;
    }

    setLoading(true);
    try {
      if (isChild) {
        await communityApi.createChildReply(boardId, parentId, {
          replyCtnt: value,
        });
      } else {
        await communityApi.createReply(boardId, { replyCtnt: value });
      }

      setReplyCtnt('');
      onCreated?.();
      if (isChild) onCancel?.();
    } catch (e2) {
      setErr(e2?.message || '댓글 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.wrap} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        value={replyCtnt}
        onChange={(e) => setReplyCtnt(e.target.value)}
        placeholder={isChild ? '답글을 입력하세요…' : '댓글 추가…'}
        maxLength={maxLen}
        rows={isChild ? 3 : 4}
        autoFocus={autoFocus}
        disabled={loading}
      />

      <div className={styles.bottom}>
        <div className={styles.meta}>
          <span className={styles.counter}>
            {replyCtnt.length}/{maxLen}
          </span>
          {err ? <span className={styles.error}>{err}</span> : null}
        </div>

        <div className={styles.actions}>
          {onCancel ? (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setReplyCtnt('');
                setErr('');
                onCancel?.();
              }}
              disabled={loading}
            >
              취소
            </button>
          ) : null}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!canSubmit}
          >
            {loading ? '등록 중…' : isChild ? '답글 등록' : '댓글 등록'}
          </button>
        </div>
      </div>
    </form>
  );
}
