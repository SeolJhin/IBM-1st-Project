// App.js — property 페이지 라우트 추가
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

// ✅ Property 페이지
import RoomList from './features/property/pages/RoomList';
import RoomDetail from './features/property/pages/RoomDetail';
import SpaceDetail from './features/property/pages/SpaceDetail';
import BuildingDetail from './features/property/pages/BuildingDetail';

// ✅ Review 페이지
import ReviewWrite from './features/review/pages/ReviewWrite';
import MyReviewsList from './features/review/pages/MyReviewsList';
import MyReviewsDetail from './features/review/pages/MyReviewsDetail';

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

        {/* ✅ 방 찾기 (헤더 메뉴 "방찾기" 클릭 시 진입) */}
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/rooms/:roomId" element={<RoomDetail />} />

        {/* ✅ 공용공간 상세 */}
        <Route path="/spaces/:spaceId" element={<SpaceDetail />} />

        {/* ✅ 빌딩 상세 */}
        <Route path="/buildings/:buildingId" element={<BuildingDetail />} />

        {/* /membership → /rooms 리다이렉트 (기존 헤더에 /membership으로 되어있어서) */}
        <Route path="/membership" element={<Navigate to="/rooms" replace />} />

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

        {/* ✅ 리뷰 */}
        <Route path="/reviews/write" element={<ReviewWrite />} />
        <Route path="/reviews/:reviewId/edit" element={<ReviewWrite />} />
        <Route path="/reviews/my" element={<MyReviewsList />} />
        <Route path="/reviews/:reviewId" element={<MyReviewsDetail />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
