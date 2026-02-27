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
import AdminMonthlyChargeList from './features/admin/pages/billing/AdminMonthlyChargeList';
import AdminContractList from './features/admin/pages/contract/AdminContractList';
import AdminResidentList from './features/admin/pages/contract/AdminResidentList';
import AdminPayHub from './features/admin/pages/payment/AdminPayHub';
import AdminOrderList from './features/admin/pages/commerce/AdminOrderList';
import AdminProductList from './features/admin/pages/commerce/AdminProductList';
import AdminPaymentList from './features/admin/pages/payment/AdminPaymentList';
import AdminRefundList from './features/admin/pages/payment/AdminRefundList';
import AdminPropertyHub from './features/admin/pages/property/AdminPropertyHub';
import AdminBuildingList from './features/admin/pages/property/AdminBuildingList';
import AdminRoomList from './features/admin/pages/property/AdminRoomList';
import AdminSpaceList from './features/admin/pages/property/AdminSpaceList';
import AdminReservationHub from './features/admin/pages/reservation/AdminReservationHub';
import AdminSpaceReservationList from './features/admin/pages/reservation/AdminSpaceReservationList';
import AdminTourReservationList from './features/admin/pages/reservation/AdminTourReservationList';
import AdminRoomServiceHub from './features/admin/pages/roomservice/AdminRoomServiceHub';
import AdminRoomServiceOrderList from './features/admin/pages/roomservice/AdminRoomServiceOrderList';
import AdminSystemHub from './features/admin/pages/system/AdminSystemHub';
import AdminAffiliateList from './features/admin/pages/system/AdminAffiliateList';
import AdminBannerList from './features/admin/pages/system/AdminBannerList';
import AdminCompanyInfoDetail from './features/admin/pages/system/AdminCompanyInfoDetail';
import AdminUserHub from './features/admin/pages/user/AdminUserHub';
import AdminUserList from './features/admin/pages/user/AdminUserList';

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
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<AdminInfo />} />

              <Route path="users" element={<AdminUserHub />}>
                <Route index element={<AdminUserList />} />
                <Route path="residents" element={<AdminResidentList />} />
              </Route>

              <Route path="property" element={<AdminPropertyHub />}>
                <Route path="buildings" element={<AdminBuildingList />} />
                <Route path="rooms" element={<AdminRoomList />} />
                <Route path="spaces" element={<AdminSpaceList />} />
                <Route index element={<Navigate to="buildings" replace />} />
              </Route>

              <Route path="reservations" element={<AdminReservationHub />}>
                <Route path="tours" element={<AdminTourReservationList />} />
                <Route path="space" element={<AdminSpaceReservationList />} />
                <Route index element={<Navigate to="tours" replace />} />
              </Route>

              <Route path="contracts" element={<AdminContractList />} />

              <Route path="system" element={<AdminSystemHub />}>
                <Route path="banners" element={<AdminBannerList />} />
                <Route path="affiliates" element={<AdminAffiliateList />} />
                <Route
                  path="company_info"
                  element={<AdminCompanyInfoDetail />}
                />
                <Route index element={<Navigate to="banners" replace />} />
              </Route>

              <Route path="roomservice" element={<AdminRoomServiceHub />}>
                <Route
                  path="room_orders"
                  element={<AdminRoomServiceOrderList />}
                />
                <Route path="room_products" element={<AdminProductList />} />
                <Route index element={<Navigate to="room_orders" replace />} />
              </Route>

              <Route path="pay" element={<AdminPayHub />}>
                <Route path="billings" element={<AdminMonthlyChargeList />} />
                <Route path="payments" element={<AdminPaymentList />} />
                <Route path="refunds" element={<AdminRefundList />} />
                <Route path="orders" element={<AdminOrderList />} />
                <Route path="products" element={<AdminProductList />} />
                {/* ✅ 여기 수정! payment -> payments */}
                <Route index element={<Navigate to="payments" replace />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
