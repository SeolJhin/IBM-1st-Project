import React from 'react';
import './app/styles/globals.css';

import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './shared/pages/Home';
import Login from './features/user/pages/Login';
import Signup from './features/user/pages/Signup';
import MemberInfo from './features/user/pages/MemberInfo';
import About from './shared/pages/About';
import ScrollToTop from './shared/components/ScrollToTop';
import SpaceReservationCreate from './features/reservation/pages/SpaceReservationCreate';
import SpaceReservationList from './features/reservation/pages/SpaceReservationList';
import TourReservationCreate from './features/reservation/pages/TourReservationCreate';
import TourReservationList from './features/reservation/pages/TourReservationList';

// App.jsx (admin 라우트 부분만 발췌)
import RequireAuth from './app/router/guards/RequireAuth';
import RequireRole from './app/router/guards/RequireRole';

import AdminShell from './features/admin/components/AdminShell';
import AdminInfo from './features/admin/pages/AdminInfo';

// ✅ 연결될 리스트 페이지들 (너가 말한 파일들)
import AdminUserList from './features/admin/pages/user/AdminUserList';
import AdminSpaceList from './features/admin/pages/property/AdminSpaceList';
import AdminTourReservationList from './features/admin/pages/reservation/AdminTourReservationList';
import AdminContractList from './features/admin/pages/contract/AdminContractList';
import AdminBannerList from './features/admin/pages/system/AdminBannerList';
import AdminRoomServiceOrderList from './features/admin/pages/roomservice/AdminRoomServiceOrderList';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About variant="about" />} />
        <Route path="/community" element={<About variant="community" />} />
        <Route path="/guide" element={<About variant="guide" />} />
        <Route path="/news" element={<About variant="news" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/me" element={<MemberInfo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
          path="/reservations/space/create"
          element={<SpaceReservationCreate />}
        />
        <Route
          path="/reservations/space/list"
          element={<SpaceReservationList />}
        />
        <Route
          path="/reservations/tour/create"
          element={<TourReservationCreate />}
        />
        <Route
          path="/reservations/tour/list"
          element={<TourReservationList />}
        />

        <Route element={<RequireAuth />}>
          <Route element={<RequireRole allow={['admin']} />}>
            {/* ✅ /admin 이하 공통 레이아웃 */}
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<AdminInfo />} />

              {/* 사이드바 메뉴 1: 회원관리 */}
              <Route path="users" element={<AdminUserList />} />

              {/* 사이드바 메뉴 2: 시설관리 -> 공용공간 리스트 */}
              <Route path="property/spaces" element={<AdminSpaceList />} />

              {/* 사이드바 메뉴 3: 사전방문 관리 -> 투어 예약 리스트 */}
              <Route
                path="reservations/tours"
                element={<AdminTourReservationList />}
              />

              {/* 사이드바 메뉴 4: 계약 관리 -> 계약 리스트 */}
              <Route path="contracts" element={<AdminContractList />} />

              {/* 사이드바 메뉴 5: 배너관리 -> 배너 리스트 */}
              <Route path="system/banners" element={<AdminBannerList />} />

              {/* 사이드바 메뉴 6: 룸서비스 관리 -> 룸서비스 주문 리스트 */}
              <Route
                path="roomservice/orders"
                element={<AdminRoomServiceOrderList />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}
