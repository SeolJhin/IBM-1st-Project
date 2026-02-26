// src/features/admin/constants/adminMenu.js
export const adminMenu = [
  { key: 'dashboard', label: '통계', path: '/admin' },

  { key: 'users', label: '회원관리', path: '/admin/users' },

  // 시설관리(공용공간 리스트로 연결)
  { key: 'facility', label: '시설 관리', path: '/admin/property/spaces' },

  // 사전방문(투어 예약 리스트로 연결)
  { key: 'tour', label: '사전방문 관리', path: '/admin/reservations/tours' },

  // 계약 관리(계약 리스트로 연결)
  { key: 'contract', label: '계약 관리', path: '/admin/contracts' },

  // 배너관리(배너 리스트로 연결)
  { key: 'banner', label: '배너관리', path: '/admin/system/banners' },

  // 룸서비스(룸서비스 주문 리스트로 연결)
  {
    key: 'roomservice',
    label: '룸서비스 관리',
    path: '/admin/roomservice/orders',
  },
];
