// src/features/admin/constants/adminMenu.js
export const adminMenu = [
  { key: 'dashboard', label: '통계', path: '/admin' },
  { key: 'users', label: '회원관리', path: '/admin/users' },
  { key: 'property', label: '시설 관리', path: '/admin/property' },
  { key: 'tours', label: '사전방문 관리', path: '/admin/reservations' },
  { key: 'contracts', label: '계약 관리', path: '/admin/contracts' },
  { key: 'system', label: '배너관리', path: '/admin/system' },
  { key: 'roomservice', label: '룸서비스 관리', path: '/admin/roomservice' },
  { key: 'pay', label: '결제/정산', path: '/admin/pay' },
  {
    key: 'spaces',
    label: '공용공간예약 관리',
    path: '/admin/reservations/spaces',
  },
];
