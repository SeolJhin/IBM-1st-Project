// src/features/support/pages/FaqList.jsx
import React, { useEffect, useState } from 'react';
import { supportApi } from '../api/supportApi';

export default function FaqList() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportApi
      .getFaqs()
      .then((res) => {
        console.log('🔥 FAQ 응답', res);
        if (res && res.content) {
          setFaqs(res.content);
        } else {
          setFaqs([]);
        }
      })
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>FAQ 목록 로딩 중...</div>;
  if (!faqs.length) return <div>등록된 FAQ가 없습니다.</div>;

  return (
    <div className="faq-list">
      <h2>FAQ</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>제목</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>코드</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>내용</th>
          </tr>
        </thead>
        <tbody>
          {faqs.map((faq) => (
            <tr key={faq.faqId}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {faq.faqId}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {faq.faqTitle}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {faq.code}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {faq.faqCtnt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
