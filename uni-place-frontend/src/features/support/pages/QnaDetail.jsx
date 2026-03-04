import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import { useAuth } from '../../user/hooks/useAuth';
import styles from './Support.module.css';

const STATUS_MAP = {
  waiting: '답변 대기',
  complete: '답변 완료',
};

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

export default function QnaDetail() {
  const { user } = useAuth();
  const { qnaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qnaListPath = location.pathname.startsWith('/admin/')
    ? '/admin/support/qna'
    : '/support/qna';

  const [qna, setQna] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerCtnt, setAnswerCtnt] = useState('');
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  const isAdmin = normalizeRole(user) === 'admin';

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detail, replyData] = await Promise.all([
        supportApi.getQnaDetail(qnaId),
        supportApi.getQnaReplies(qnaId).catch(() => []),
      ]);
      const replyList = Array.isArray(replyData) ? replyData : [];
      setQna(detail);
      setReplies(replyList);
      const adminReply =
        replyList.find((r) => Number(r?.qnaLev) === 1) ?? replyList[0];
      if (adminReply) {
        setAnswerTitle(adminReply.qnaTitle ?? '');
        setAnswerCtnt(adminReply.qnaCtnt ?? '');
      } else {
        setAnswerTitle(detail?.qnaTitle ? `[답변] ${detail.qnaTitle}` : '답변');
        setAnswerCtnt('');
      }
    } catch (err) {
      if (Number(err?.status) === 404) {
        navigate(qnaListPath, { replace: true });
        return;
      }
      setError(err.message || '문의 내용을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qnaId, user]);

  if (!user) return <Navigate to="/login" replace />;

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!qna) return null;

  const handleDelete = async () => {
    if (!window.confirm('문의를 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteQna(qnaId);
      navigate(qnaListPath);
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    }
  };

  const handleSubmitAnswer = async () => {
    const title = answerTitle.trim();
    const content = answerCtnt.trim();
    if (!title) return alert('답변 제목을 입력해주세요.');
    if (!content) return alert('답변 내용을 입력해주세요.');

    setAnswerSubmitting(true);
    try {
      const payload = { qnaTitle: title, qnaCtnt: content };
      if (replies.length > 0) {
        await supportApi.updateQnaAnswer(qnaId, payload);
      } else {
        await supportApi.createQnaAnswer(qnaId, payload);
      }
      await loadDetail();
      alert(
        replies.length > 0 ? '답변이 수정되었습니다.' : '답변이 등록되었습니다.'
      );
    } catch (e) {
      alert(e.message || '답변 처리에 실패했습니다.');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <h2 className={styles.cardTitle}>{qna.qnaTitle}</h2>
          <span
            className={styles.statusBadge}
            style={
              qna.qnaSt === 'complete' ? { background: 'var(--highlight)' } : {}
            }
          >
            {STATUS_MAP[qna.qnaSt] ?? qna.qnaSt}
          </span>
        </div>

        <div className={styles.cardMeta} style={{ marginBottom: 8 }}>
          {qna.createdAt ? qna.createdAt.slice(0, 10) : '-'}
        </div>
        {isAdmin && (
          <div className={styles.cardMeta} style={{ marginBottom: 20 }}>
            작성자 ID: {qna.userId || '-'}
          </div>
        )}
        {!isAdmin && <div style={{ marginBottom: 20 }} />}

        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {qna.qnaCtnt}
        </div>

        {isAdmin && qna.qnaSt === 'waiting' && (
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <button
              className={styles.buttonPrimary}
              onClick={() => navigate(`/support/qna/${qnaId}/edit`)}
            >
              수정
            </button>
            <button className={styles.pageBtn} onClick={handleDelete}>
              삭제
            </button>
          </div>
        )}
      </div>

      {replies.length > 0 && (
        <div
          className={styles.card}
          style={{ background: 'var(--b-5)', marginTop: 12 }}
        >
          <p
            style={{
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--primary)',
            }}
          >
            관리자 답변
          </p>
          {replies.map((r, idx) => (
            <div key={idx} style={{ marginBottom: 14 }}>
              {r?.qnaTitle ? (
                <p style={{ fontWeight: 700, marginBottom: 6 }}>{r.qnaTitle}</p>
              ) : null}
              <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {r.qnaCtnt}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className={styles.card} style={{ marginTop: 12 }}>
          <p
            style={{
              fontWeight: 700,
              marginBottom: 12,
              color: 'var(--primary)',
            }}
          >
            관리자 답변 {replies.length > 0 ? '수정' : '작성'}
          </p>

          <label className={styles.formLabel}>답변 제목</label>
          <input
            className={styles.formInput}
            value={answerTitle}
            onChange={(e) => setAnswerTitle(e.target.value)}
            maxLength={255}
            disabled={answerSubmitting}
          />

          <label className={styles.formLabel}>답변 내용</label>
          <textarea
            className={styles.formTextarea}
            value={answerCtnt}
            onChange={(e) => setAnswerCtnt(e.target.value)}
            maxLength={4000}
            disabled={answerSubmitting}
          />

          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className={styles.buttonPrimary}
              onClick={handleSubmitAnswer}
              disabled={answerSubmitting}
            >
              {answerSubmitting
                ? '처리 중...'
                : replies.length > 0
                  ? '답변 수정'
                  : '답변 등록'}
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.pageBtn}
        onClick={() => navigate(qnaListPath)}
        style={{ marginTop: 16 }}
      >
        목록으로
      </button>
    </div>
  );
}
