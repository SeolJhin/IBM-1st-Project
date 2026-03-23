// dt 2
// App.js
import React, { useEffect } from 'react';
import './app/styles/globals.css';

import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import ScrollToTop from './shared/components/ScrollToTop';
import Home from './shared/pages/Home';
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
import SpaceList from './features/property/pages/SpaceList';
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

// ── about ───────────────────────────────────────────────────
import Company from './features/about/pages/Company';
import CompanyDetail from './features/about/pages/CompanyDetail';
import News from './features/about/pages/News';
import NewsDetail from './features/about/pages/NewsDetail';
import Guide from './features/about/pages/Guide';
import GuideDetail from './features/about/pages/GuideDetail';

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

// ── 건물 점검 (새로 추가) ──────────────────────────────────────
import AdminInspectionList from './features/admin/pages/inspection/AdminInspectionList';
import AdminInspectionDetail from './features/admin/pages/inspection/AdminInspectionDetail';
import AdminOpenTickets from './features/admin/pages/inspection/AdminOpenTickets';

// ── 챗봇 ──────────────────────────────────────────────────────
import ChatBot from './features/chat/components/ChatBot';
import AdminChatBot from './features/chat/components/AdminChatBot';

// ── 법적고지 & SNS ────────────────────────────────────────
import Terms from './shared/pages/Terms';
import Privacy from './shared/pages/Privacy';
import Cookies from './shared/pages/Cookies';
import SnsPage from './shared/pages/SnsPage';

import {
  GEMINI_API_KEY,
  USE_BACKEND_AI,
} from './features/chat/config/chatConfig';
import { useAuth } from './features/user/hooks/useAuth';
import { commerceApi } from './features/commerce/api/commerceApi';
import {
  AUTH_EXPIRED_NOTICE,
  AUTH_SESSION_EXPIRED_EVENT,
  getAuthResumePath,
  restoreAuthResumeForPath,
} from './app/auth/authResume';

function normalizeViewportScaleArtifacts() {
  if (typeof document === 'undefined') return;

  if (document.body) {
    document.body.style.transform = '';
    document.body.style.transformOrigin = '';
    document.body.style.zoom = '';
  }

  if (document.documentElement) {
    document.documentElement.style.zoom = '';
  }

  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0'
    );
  }
}

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    normalizeViewportScaleArtifacts();
  }, [location.hash, location.pathname, location.search]);

  // 어느 페이지로 돌아와도 카카오페이 이탈 처리
  useEffect(() => {
    const pendingPaymentId = sessionStorage.getItem('pending_kakao_payment_id');
    const pendingOrderId = sessionStorage.getItem('pending_kakao_order_id');
    if (!pendingPaymentId && !pendingOrderId) return;
    sessionStorage.removeItem('pending_kakao_payment_id');
    sessionStorage.removeItem('pending_kakao_order_id');
    if (pendingPaymentId) {
      commerceApi
        .abandonPayment(Number(pendingPaymentId))
        .catch(
          () =>
            pendingOrderId &&
            commerceApi.cancelOrder(Number(pendingOrderId)).catch(() => {})
        );
    } else if (pendingOrderId) {
      commerceApi.cancelOrder(Number(pendingOrderId)).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleAuthExpired = (event) => {
      if (location.pathname === '/login') return;

      const from =
        String(event?.detail?.from || '').trim() ||
        getAuthResumePath() ||
        `${location.pathname}${location.search}${location.hash}`;

      navigate('/login', {
        replace: true,
        state: {
          from,
          reason: 'auth_expired',
          message: event?.detail?.message || AUTH_EXPIRED_NOTICE,
        },
      });
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleAuthExpired);
    return () =>
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleAuthExpired);
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!user) return;
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    restoreAuthResumeForPath(currentPath);
  }, [location.hash, location.pathname, location.search, user]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── 공통 ── */}
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<CommunityHome />} />
        <Route path="/community/:boardId" element={<BoardDetail />} />

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
        <Route path="/spaces" element={<SpaceList />} />
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

        {/* ── about ── */}
        <Route path="/about/company" element={<Company />} />
        <Route path="/about/company/:id" element={<CompanyDetail />} />
        <Route path="/about/news" element={<News />} />
        <Route path="/about/news/:slug" element={<NewsDetail />} />
        <Route path="/about/guide" element={<Guide />} />
        <Route path="/about/guide/:slug" element={<GuideDetail />} />

        {/* ── support ── */}
        <Route path="/support" element={<Support />}>
          <Route index element={<Navigate to="notice" replace />} />
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

        {/* ── 어드민 ── */}
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

              {/* ── 건물 점검 (새로 추가) ── */}
              <Route path="inspections" element={<AdminInspectionList />} />
              <Route
                path="inspections/tickets"
                element={<AdminOpenTickets />}
              />
              <Route
                path="inspections/:inspectionId"
                element={<AdminInspectionDetail />}
              />
            </Route>
          </Route>
        </Route>

        {/* ── 법적고지 ── */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />

        {/* ── SNS 더미 페이지 ── */}
        <Route path="/sns/:platform" element={<SnsPage />} />

        {/* ── 나머지 ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 챗봇 — 어드민이면 AdminChatBot만, 일반 유저면 ChatBot만 */}
      {user?.userRole === 'ADMIN' ||
      user?.role === 'ADMIN' ||
      user?.userRole === 'admin' ||
      user?.role === 'admin' ? (
        <AdminChatBot user={user} />
      ) : (
        <ChatBot
          user={user}
          geminiApiKey={GEMINI_API_KEY}
          useBackend={USE_BACKEND_AI}
        />
      )}
    </>
  );
}
