// features/support/pages/Support.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';

const supportCategories = [
  { label: '공지사항', path: '/support/notice' },
  { label: 'FAQ', path: '/support/faq' },
  { label: '민원 접수', path: '/support/complain' },
  { label: '1:1 문의', path: '/support/qna' },
];

export default function Support() {
  return (
    <div>
      <Header />

      <PageHeader
        title="고객센터"
        subtitle="궁금한 점이나 불편사항을 확인해보세요."
        categories={supportCategories}
      />

      <main style={{ overflow: 'visible' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
