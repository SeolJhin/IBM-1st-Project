// features/support/pages/Support.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';

const supportCategories = [
  { label: '공지사항', path: '/support/notice' },
  { label: 'FAQ', path: '/support/faq' },
  { label: '민원', path: '/support/complain' },
  { label: 'QNA', path: '/support/qna' },
];

// 각 경로(탭)마다 다른 제목을 정의합니다
const titleMap = {
  '/support/notice': '고객센터',
  '/support/faq': 'FAQ',
  '/support/complain': '민원',
  '/support/qna': 'QNA',
};

// 각 경로(탭)마다 다른 부제목을 정의합니다
const subtitleMap = {
  '/support/notice': '궁금한 점이나 불편사항을 확인해보세요..',
  '/support/faq': '입주 전후 궁금한 점을 한 번에 해결해보세요.',
  '/support/complain': '불편하신 사항을 남겨주시면 빠르게 검토하겠습니다.',
  '/support/qna': '궁금한 점을 남겨주시면 담당자가 직접 답변해드립니다.',
};

export default function Support() {
  // useLocation: 현재 브라우저 URL 경로 정보를 가져오는 훅
  const { pathname } = useLocation();

  // 현재 경로에 맞는 제목/부제목을 찾고, 없으면 기본 문구 사용
  const title = titleMap[pathname] ?? '고객센터';
  const subtitle =
    subtitleMap[pathname] ?? '궁금한 점이나 불편사항을 확인해보세요.';

  return (
    <div>
      <Header />

      <PageHeader
        title={title}
        subtitle={subtitle}
        categories={supportCategories}
      />

      <main style={{ overflow: 'visible' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
