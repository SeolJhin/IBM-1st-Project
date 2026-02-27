// src/features/support/pages/QnaDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQnas } from '../hooks/useQnas';

export default function QnaDetail() {
  const { qnaId } = useParams();
  const { getQnaById } = useQnas();
  const [qna, setQna] = useState(null);

  useEffect(() => {
    setQna(getQnaById(qnaId));
  }, [qnaId, getQnaById]);

  if (!qna) return <div>로딩중...</div>;

  return (
    <div>
      <h2>{qna.qnaTitle}</h2>
      <p>{qna.qnaCtnt}</p>
      <Link to="/support/qna">목록으로</Link>
    </div>
  );
}
