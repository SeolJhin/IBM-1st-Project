import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { communityApi } from '../api/communityApi';

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function BoardDetail() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!boardId) {
      setLoading(false);
      setError('게시글 번호가 올바르지 않습니다.');
      return;
    }

    let canceled = false;
    const timerId = setTimeout(async () => {
      if (canceled) return;
      setLoading(true);
      setError('');
      try {
        const data = await communityApi.getBoard(boardId);
        if (!canceled) setBoard(data);
      } catch (e) {
        if (!canceled) {
          setError(e?.message || '게시글을 불러오지 못했습니다.');
          setBoard(null);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }, 0);
    return () => {
      canceled = true;
      clearTimeout(timerId);
    };
  }, [boardId]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '24px 20px 48px' }}>
        <button
          type="button"
          onClick={() => navigate('/community')}
          style={{
            height: 36,
            padding: '0 14px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            background: '#fff',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          ← 목록으로
        </button>

        {loading ? (
          <div style={{ color: '#6b7280' }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>⚠️ {error}</div>
        ) : (
          <article
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 28, color: '#111827' }}>
              {board?.boardTitle || '(제목 없음)'}
            </h1>
            <div style={{ marginTop: 10, color: '#6b7280', fontSize: 14 }}>
              작성자: {board?.userId || '-'} | 작성일: {formatDateTime(board?.createdAt)}{' '}
              | 조회수: {board?.readCount ?? 0} | 좋아요: {board?.likeCount ?? 0}
            </div>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #f1f5f9',
                color: '#111827',
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
              }}
            >
              {board?.boardCtnt || '(내용 없음)'}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
