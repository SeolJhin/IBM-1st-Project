// features/support/pages/Support.jsx
import React from 'react';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './Support.module.css';

// 고객센터 카테고리
const supportCategories = [
  { label: '공지사항', path: '/support/notice' },
  { label: 'FAQ', path: '/support/faq' },
  { label: '민원 접수', path: '/support/complain' },
  { label: '1:1 문의', path: '/support/qna' },
];

export default function Support() {
  const location = useLocation();

  // 현재 URL 기준으로 variant 결정
  const getVariant = () => {
    if (location.pathname.includes('notice')) return 'notice';
    if (location.pathname.includes('faq')) return 'faq';
    if (location.pathname.includes('complain')) return 'complain';
    if (location.pathname.includes('qna')) return 'qna';
    return 'faq';
  };
  const variant = getVariant();

  const titleMap = {
    notice: '공지사항',
    faq: 'FAQ',
    complain: '민원 접수',
    qna: '1:1 문의',
  };

  return (
    <div>
      <Header />

      {/* 페이지 헤더: 타이틀 + 카테고리 */}
      <PageHeader
        title="고객센터"
        subtitle="궁금한 점이나 불편사항을 확인하세요."
        categories={supportCategories}
      />

      <main style={{ padding: '40px', overflow: 'visible' }}>
        {/* 현재 카테고리 제목 */}
        <h2>{titleMap[variant]}</h2>

        {/* 하위 라우트가 들어가는 자리 */}
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
