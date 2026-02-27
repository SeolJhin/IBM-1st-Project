// src/features/support/pages/NoticeDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNotices } from '../hooks/useNotices';

export default function NoticeDetail() {
  const { noticeId } = useParams();
  const { getNoticeById } = useNotices();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setNotice(getNoticeById(noticeId));
  }, [noticeId, getNoticeById]);

  if (!notice) return <div>로딩중...</div>;

  return (
    <div>
      <h2>{notice.title}</h2>
      <p>{notice.content}</p>
      <Link to="/support/notice">목록으로</Link>
    </div>
  );
}
