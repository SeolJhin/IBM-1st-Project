import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../../shared/pages/Home';
import NotificationList from '../../features/notification/pages/NotificationList';

// ── property ──────────────────────────────────────────────────
import BuildingList from '../../features/property/pages/BuildingList';
import BuildingDetail from '../../features/property/pages/BuildingDetail';
import RoomList from '../../features/property/pages/RoomList';
import RoomDetail from '../../features/property/pages/RoomDetail';
import SpaceList from '../../features/property/pages/SpaceList';
import SpaceDetail from '../../features/property/pages/SpaceDetail';

// ── reservation ───────────────────────────────────────────────
import TourReservationCreate from '../../features/reservation/pages/TourReservationCreate';
import TourReservationList from '../../features/reservation/pages/TourReservationList';
import SpaceReservationCreate from '../../features/reservation/pages/SpaceReservationCreate';
import SpaceReservationList from '../../features/reservation/pages/SpaceReservationList';

// ── review ────────────────────────────────────────────────────
import ReviewWrite from '../../features/review/pages/ReviewWrite';
import MyReviewsList from '../../features/review/pages/MyReviewsList';
import MyReviewsDetail from '../../features/review/pages/MyReviewsDetail';

// ── admin ─────────────────────────────────────────────────────
import AdminInfo from '../../features/admin/pages/AdminInfo';
import AdminTourReservationList from '../../features/admin/pages/reservation/AdminTourReservationList';
import AdminSpaceReservationList from '../../features/admin/pages/reservation/AdminSpaceReservationList';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/notifications', element: <NotificationList /> },

  // property
  { path: '/buildings', element: <BuildingList /> },
  { path: '/buildings/:buildingId', element: <BuildingDetail /> },
  { path: '/rooms', element: <RoomList /> },
  { path: '/rooms/:roomId', element: <RoomDetail /> },
  { path: '/spaces', element: <SpaceList /> },
  { path: '/spaces/:spaceId', element: <SpaceDetail /> },

  // reservation – tour (비회원: 전화번호+비밀번호 조회)
  { path: '/reservations/tour/create', element: <TourReservationCreate /> },
  { path: '/reservations/tour/list', element: <TourReservationList /> },

  // reservation – space (로그인 필수)
  { path: '/reservations/space/create', element: <SpaceReservationCreate /> },
  { path: '/reservations/space/list', element: <SpaceReservationList /> },

  // review
  { path: '/reviews/write', element: <ReviewWrite /> }, // ?roomId=xxx
  { path: '/reviews/:reviewId/edit', element: <ReviewWrite /> },
  { path: '/reviews/my', element: <MyReviewsList /> },
  { path: '/reviews/:reviewId', element: <MyReviewsDetail /> },

  // admin
  { path: '/admin', element: <AdminInfo /> },
  { path: '/admin/reservation/tours', element: <AdminTourReservationList /> },
  { path: '/admin/reservation/spaces', element: <AdminSpaceReservationList /> },
]);

export default router;
