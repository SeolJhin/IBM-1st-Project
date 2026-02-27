import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportApi } from '../api/supportApi';

export default function QnaWrite() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await supportApi.createQna({ qnaTitle: title, qnaCtnt: content });
      navigate('/support/qna');
    } catch (err) {
      alert(err.message || '작성 실패');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>QnA 작성</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: 12 }}
          />
        </div>
        <div>
          <textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '100%', height: 200 }}
          />
        </div>
        <button type="submit" style={{ marginTop: 12 }}>
          작성
        </button>
      </form>
    </div>
  );
}
