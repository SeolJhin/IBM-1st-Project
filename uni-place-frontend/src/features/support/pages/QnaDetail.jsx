// features/support/pages/QnaDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';
import styles from './Support.module.css';

const STATUS_MAP = {
  waiting: '답변대기',
  complete: '답변완료',
};

export default function QnaDetail() {
  const { qnaId } = useParams();
  const navigate = useNavigate();
  const [qna, setQna] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supportApi.getQnaDetail(qnaId),
      supportApi.getQnaReplies(qnaId).catch(() => []),
    ])
      .then(([detail, replyData]) => {
        setQna(detail);
        setReplies(Array.isArray(replyData) ? replyData : []);
      })
      .catch((err) => setError(err.message || '문의 내용을 불러오는 데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, [qnaId]);

  const handleDelete = async () => {
    if (!window.confirm('문의를 삭제하시겠습니까?')) return;
    try {
      await supportApi.deleteQna(qnaId);
      navigate('/support/qna');
    } catch (e) {
      alert(e.message || '삭제에 실패했습니다.');
    }
  };

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!qna) return null;

  return (
    <div className={styles.container}>
      {/* 문의 본문 */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 className={styles.cardTitle}>{qna.qnaTitle}</h2>
          <span
            className={styles.statusBadge}
            style={qna.qnaSt === 'complete' ? { background: 'var(--highlight)' } : {}}
          >
            {STATUS_MAP[qna.qnaSt] ?? qna.qnaSt}
          </span>
        </div>

        <div className={styles.cardMeta} style={{ marginBottom: 20 }}>
          {qna.createdAt ? qna.createdAt.slice(0, 10) : '-'}
        </div>

        <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{qna.qnaCtnt}</div>

        {qna.qnaSt === 'waiting' && (
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

      {/* 답변 목록 */}
      {replies.length > 0 && (
        <div className={styles.card} style={{ background: 'var(--b-5)', marginTop: 12 }}>
          <p style={{ fontWeight: 700, marginBottom: 12, color: 'var(--primary)' }}>📩 관리자 답변</p>
          {replies.map((r, idx) => (
            <div key={idx} style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {r.qnaCtnt}
            </div>
          ))}
        </div>
      )}

      <button className={styles.pageBtn} onClick={() => navigate('/support/qna')} style={{ marginTop: 16 }}>
        ← 목록으로
      </button>
    </div>
  );
}
