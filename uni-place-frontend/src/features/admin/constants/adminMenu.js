// src/features/admin/constants/adminMenu.js
export const adminMenu = [
  { key: 'dashboard', label: '통계', path: '/admin' },
  { key: 'users', label: '회원관리', path: '/admin/users' },
  { key: 'property', label: '시설 관리', path: '/admin/property' },
  { key: 'tours', label: '투어예약 관리', path: '/admin/reservation/tours' },
  {
    key: 'spaces',
    label: '공용공간예약 관리',
    path: '/admin/reservation/spaces',
  },
  { key: 'contracts', label: '계약 관리', path: '/admin/contract/contracts' },
  { key: 'banners', label: '배너관리', path: '/admin/system/banners' },
  {
    key: 'roomservice',
    label: '룸서비스 관리',
    path: '/admin/roomservice/orders',
  },
];
