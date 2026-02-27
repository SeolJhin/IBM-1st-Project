// src/features/admin/constants/adminMenu.js
export const adminMenu = [
  { key: 'dashboard', label: '통계', path: '/admin' },
  { key: 'users', label: '회원관리', path: '/admin/users' },

  // App.js에 실제로 있는 라우트로 맞춤
  { key: 'property', label: '시설 관리', path: '/admin/property/spaces' },
  { key: 'tours', label: '사전방문 관리', path: '/admin/reservations/tours' },

  { key: 'contracts', label: '계약 관리', path: '/admin/contracts' },
  { key: 'banners', label: '배너관리', path: '/admin/system/banners' },

  // App.js에 실제로 있는 라우트로 맞춤
  {
    key: 'roomservice',
    label: '룸서비스 관리',
    path: '/admin/roomservice/orders',
  },
];
