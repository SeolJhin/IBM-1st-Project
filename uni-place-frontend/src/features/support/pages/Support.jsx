// features/support/pages/Support.jsx
import React from 'react';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './Support.module.css';

const supportCategories = [
  { label: '공지사항', path: '/support/notice' },
  { label: 'FAQ', path: '/support/faq' },
  { label: '민원 접수', path: '/support/complain' },
  { label: '1:1 문의', path: '/support/qna' },
];

export default function Support() {
  const location = useLocation();

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

      <PageHeader
        title="고객센터"
        subtitle="궁금한 점이나 불편사항을 확인하세요."
        categories={supportCategories}
      />

      <main style={{ overflow: 'visible' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
