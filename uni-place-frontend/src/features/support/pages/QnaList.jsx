import React from 'react';
import { useQnas } from '../hooks/useQnas';
import { Link } from 'react-router-dom';

export default function QnaList() {
  const { qnas, pagination, loading, error, goToPage } = useQnas();

  if (loading) return <div style={{ padding: 24 }}>로딩중...</div>;
  if (error) return <div style={{ padding: 24 }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2>QnA</h2>
      <ul>
        {qnas.map((q) => (
          <li key={q.qnaId}>
            <Link to={`/support/qnas/${q.qnaId}`}>{q.qnaTitle}</Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        {!pagination.isFirst && (
          <button onClick={() => goToPage(pagination.page - 1)}>이전</button>
        )}
        <span>
          {' '}
          {pagination.page} / {pagination.totalPages}{' '}
        </span>
        {!pagination.isLast && (
          <button onClick={() => goToPage(pagination.page + 1)}>다음</button>
        )}
      </div>

      <Link to="/support/qna/write">
        <button style={{ marginTop: 16 }}>문의 작성</button>
      </Link>
    </div>
  );
}
