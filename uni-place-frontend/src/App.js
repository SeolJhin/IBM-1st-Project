// App.js
import React from 'react';
import './app/styles/globals.css';

import { Routes, Route, Navigate } from 'react-router-dom';

import ScrollToTop from './shared/components/ScrollToTop';
import Home from './shared/pages/Home';
import About from './shared/pages/About';
import CompanyInfo from './shared/pages/CompanyInfo';
import CommunityHome from './features/community/pages/CommunityHome';
import BoardDetail from './features/community/pages/BoardDetail';

// ── 유저 ──────────────────────────────────────────────────────
import Login from './features/user/pages/Login';
import Signup from './features/user/pages/Signup';
import MemberInfo from './features/user/pages/MemberInfo';
import OAuth2Success from './features/user/pages/OAuth2Success';
import FindAccount from './features/user/pages/FindAccount';
import ResetPassword from './features/user/pages/ResetPassword';

// ── Property ──────────────────────────────────────────────────
import RoomList from './features/property/pages/RoomList';
import RoomDetail from './features/property/pages/RoomDetail';
import SpaceDetail from './features/property/pages/SpaceDetail';
import BuildingDetail from './features/property/pages/BuildingDetail';

// ── Commerce ──────────────────────────────────────────────────
import ProductList from './features/commerce/pages/ProductList';
import Cart from './features/commerce/pages/Cart';
import OrderList from './features/commerce/pages/OrderList';
import OrderDetail from './features/commerce/pages/OrderDetail';
import Checkout from './features/commerce/pages/Checkout';

// ── 예약 ──────────────────────────────────────────────────────
import SpaceReservationCreate from './features/reservation/pages/SpaceReservationCreate';
import SpaceReservationList from './features/reservation/pages/SpaceReservationList';
import TourReservationCreate from './features/reservation/pages/TourReservationCreate';
import TourReservationList from './features/reservation/pages/TourReservationList';

// ── 계약 ──────────────────────────────────────────────────────
import ContractApply from './features/contract/pages/ContractApply';

// ── 리뷰 ──────────────────────────────────────────────────────
import ReviewWrite from './features/review/pages/ReviewWrite';
import MyReviewsList from './features/review/pages/MyReviewsList';
import MyReviewsDetail from './features/review/pages/MyReviewsDetail';

// ── support ───────────────────────────────────────────────────
import Support from './features/support/pages/Support';
import FaqList from './features/support/pages/FaqList';
import NoticeList from './features/support/pages/NoticeList';
import NoticeDetail from './features/support/pages/NoticeDetail';
import QnaList from './features/support/pages/QnaList';
import QnaDetail from './features/support/pages/QnaDetail';
import QnaWrite from './features/support/pages/QnaWrite';
import ComplainList from './features/support/pages/ComplainList';
import ComplainWrite from './features/support/pages/ComplainWrite';
import ComplainDetail from './features/support/pages/ComplainDetail';
import ComplainEdit from './features/support/pages/ComplainEdit';

// ── 어드민 ────────────────────────────────────────────────────
import RequireAuth from './app/router/guards/RequireAuth';
import RequireRole from './app/router/guards/RequireRole';

import AdminShell from './features/admin/components/AdminShell';
import AdminInfo from './features/admin/pages/AdminInfo';

import AdminMonthlyChargeList from './features/admin/pages/billing/AdminMonthlyChargeList';
import AdminContractHub from './features/admin/pages/contract/AdminContractHub';
import AdminResidentList from './features/admin/pages/contract/AdminResidentList';

import AdminPayHub from './features/admin/pages/payment/AdminPayHub';
import AdminPaymentList from './features/admin/pages/payment/AdminPaymentList';
import AdminRefundList from './features/admin/pages/payment/AdminRefundList';

import AdminOrderList from './features/admin/pages/commerce/AdminOrderList';
import AdminProductList from './features/admin/pages/commerce/AdminProductList';

import AdminPropertyHub from './features/admin/pages/property/AdminPropertyHub';
import AdminBuildingList from './features/admin/pages/property/AdminBuildingList';
import AdminRoomList from './features/admin/pages/property/AdminRoomList';
import AdminSpaceList from './features/admin/pages/property/AdminSpaceList';

import AdminReservationHub from './features/admin/pages/reservation/AdminReservationHub';
import AdminTourReservationList from './features/admin/pages/reservation/AdminTourReservationList';
import AdminSpaceReservationList from './features/admin/pages/reservation/AdminSpaceReservationList';

import AdminRoomServiceHub from './features/admin/pages/roomservice/AdminRoomServiceHub';
import AdminRoomServiceOrderList from './features/admin/pages/roomservice/AdminRoomServiceOrderList';

import AdminSystemHub from './features/admin/pages/system/AdminSystemHub';
import AdminAffiliateList from './features/admin/pages/system/AdminAffiliateList';
import AdminBannerList from './features/admin/pages/system/AdminBannerList';
import AdminCompanyInfoDetail from './features/admin/pages/system/AdminCompanyInfoDetail';

import AdminUserHub from './features/admin/pages/user/AdminUserHub';
import AdminUserList from './features/admin/pages/user/AdminUserList';

// ── ✅ 챗봇 ───────────────────────────────────────────────────
import ChatBot from './features/chat/components/ChatBot';
import {
  GEMINI_API_KEY,
  USE_BACKEND_AI,
} from './features/chat/config/chatConfig';
import { useAuth } from './features/user/hooks/useAuth';

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── 공통 ── */}
        <Route path="/" element={<Home />} />
        <Route
          path="/company_info"
          element={<CompanyInfo variant="company" />}
        />
        <Route path="/about" element={<About variant="about" />} />
        <Route path="/community" element={<CommunityHome />} />
        <Route path="/community/:boardId" element={<BoardDetail />} />
        <Route path="/guide" element={<CompanyInfo variant="guide" />} />
        <Route path="/news" element={<CompanyInfo variant="news" />} />

        {/* ── 유저 ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/find-account" element={<FindAccount />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} />
        <Route path="/me" element={<MemberInfo />} />

        {/* ── Property ── */}
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/rooms/:roomId" element={<RoomDetail />} />
        <Route path="/spaces/:spaceId" element={<SpaceDetail />} />
        <Route path="/buildings/:buildingId" element={<BuildingDetail />} />
        <Route
          path="/buildings"
          element={
            <Navigate to="/rooms" state={{ tab: 'buildings' }} replace />
          }
        />
        <Route path="/membership" element={<Navigate to="/rooms" replace />} />

        {/* ── 예약 ── */}
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

        {/* ── 리뷰 ── */}
        <Route path="/reviews/write" element={<ReviewWrite />} />
        <Route path="/reviews/:reviewId/edit" element={<ReviewWrite />} />
        <Route path="/reviews/my" element={<MyReviewsList />} />
        <Route path="/reviews/:reviewId" element={<MyReviewsDetail />} />

        {/* ── 계약 ── */}
        <Route path="/contracts/apply" element={<ContractApply />} />

        {/* ── 커머스 ── */}
        <Route path="/commerce/room-service" element={<ProductList />} />
        <Route path="/commerce/cart" element={<Cart />} />
        <Route path="/commerce/orders" element={<OrderList />} />
        <Route path="/commerce/orders/:orderId" element={<OrderDetail />} />
        <Route path="/commerce/checkout" element={<Checkout />} />

        {/* ── support ── */}
        <Route path="/support" element={<Support />}>
          <Route index element={<Navigate to="faq" replace />} />
          <Route path="faq" element={<FaqList />} />
          <Route path="notice" element={<NoticeList />} />
          <Route path="notice/:noticeId" element={<NoticeDetail />} />
          <Route path="qna" element={<QnaList />} />
          <Route path="qna/write" element={<QnaWrite />} />
          <Route path="qna/:qnaId/edit" element={<QnaWrite />} />
          <Route path="qna/:qnaId" element={<QnaDetail />} />
          <Route path="complain" element={<ComplainList />} />
          <Route path="complain/write" element={<ComplainWrite />} />
          <Route path="complain/edit/:id" element={<ComplainEdit />} />
          <Route path="complain/:id" element={<ComplainDetail />} />
        </Route>

        {/* ── 어드민 (로그인 + ADMIN 역할 필요) ── */}
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
                <Route path="spaces" element={<AdminSpaceReservationList />} />
                <Route index element={<Navigate to="tours" replace />} />
              </Route>

              <Route path="contracts" element={<AdminContractHub />} />

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

              <Route path="support">
                <Route index element={<Navigate to="complain" replace />} />
                <Route path="complain" element={<ComplainList />} />
                <Route path="complain/:id" element={<ComplainDetail />} />
                <Route path="qna" element={<QnaList />} />
                <Route path="qna/:qnaId" element={<QnaDetail />} />
              </Route>

              <Route path="pay" element={<AdminPayHub />}>
                <Route path="billings" element={<AdminMonthlyChargeList />} />
                <Route path="payments" element={<AdminPaymentList />} />
                <Route path="refunds" element={<AdminRefundList />} />
                <Route path="orders" element={<AdminOrderList />} />
                <Route path="products" element={<AdminProductList />} />
                <Route index element={<Navigate to="payments" replace />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* ── 나머지 ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ✅ 챗봇 - 모든 페이지에 플로팅 버튼으로 표시 */}
      <ChatBot
        user={user}
        geminiApiKey={GEMINI_API_KEY}
        useBackend={USE_BACKEND_AI}
      />
    </>
  );
}
