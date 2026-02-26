import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../../shared/pages/Home';

import RequireAuth from './guards/RequireAuth';
import RequireRole from './guards/RequireRole';

import AdminInfo from '../../features/admin/pages/AdminInfo';
import { ADMIN_ROUTES } from '../../features/admin/constants/adminRoutes';

export const router = createBrowserRouter([
  // ===== 공개 영역 =====
  {
    path: '/',
    element: <Home />,
  },

  // ===== 관리자 영역 =====
  {
    element: <RequireAuth />, // 로그인 필수
    children: [
      {
        element: <RequireRole allow={['admin']} />, // 관리자만
        children: [
          {
            path: ADMIN_ROUTES.root,
            element: <AdminInfo />,
          },

          // 아래는 아직 화면 없을 수 있으니 ComingSoon으로 안전빵
          {
            path: ADMIN_ROUTES.users,
            element: <ComingSoon title="회원관리" />,
          },
          {
            path: ADMIN_ROUTES.facilities,
            element: <ComingSoon title="시설 관리" />,
          },
          {
            path: ADMIN_ROUTES.tours,
            element: <ComingSoon title="사전방문 관리" />,
          },
          {
            path: ADMIN_ROUTES.contracts,
            element: <ComingSoon title="계약 관리" />,
          },
          {
            path: ADMIN_ROUTES.banners,
            element: <ComingSoon title="배너관리" />,
          },
          {
            path: ADMIN_ROUTES.roomService,
            element: <ComingSoon title="룸서비스 관리" />,
          },
          {
            path: ADMIN_ROUTES.residents,
            element: <ComingSoon title="입주자 관리" />,
          },
        ],
      },
    ],
  },

  // ===== 404 =====
  { path: '*', element: <NotFound /> },
]);

export default router;
