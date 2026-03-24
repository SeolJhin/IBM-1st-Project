import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Home from '../../shared/pages/Home';
import NotificationList from '../../features/notification/pages/NotificationList';

// ── user ──────────────────────────────────────────────────────
import FindAccount from '../../features/user/pages/FindAccount';
import ResetPassword from '../../features/user/pages/ResetPassword';

// ── property ──────────────────────────────────────────────────
import BuildingList from '../../features/property/pages/BuildingList';
import BuildingDetail from '../../features/property/pages/BuildingDetail';
import RoomList from '../../features/property/pages/RoomList';
import RoomDetail from '../../features/property/pages/RoomDetail';
import SpaceList from '../../features/property/pages/SpaceList';
import SpaceDetail from '../../features/property/pages/SpaceDetail';

// ── contract ──────────────────────────────────────────────────
import ContractApply from '../../features/contract/pages/ContractApply';

// ── reservation ───────────────────────────────────────────────
import TourReservationCreate from '../../features/reservation/pages/TourReservationCreate';
import TourReservationList from '../../features/reservation/pages/TourReservationList';
import SpaceReservationCreate from '../../features/reservation/pages/SpaceReservationCreate';
import SpaceReservationList from '../../features/reservation/pages/SpaceReservationList';

// ── review ────────────────────────────────────────────────────
import ReviewWrite from '../../features/review/pages/ReviewWrite';
import MyReviewsList from '../../features/review/pages/MyReviewsList';
import MyReviewsDetail from '../../features/review/pages/MyReviewsDetail';

// ── support ────────────────────────────────────────────────────
import NoticeList from '../../features/support/pages/NoticeList';
import NoticeDetail from '../../features/support/pages/NoticeDetail';
import FaqList from '../../features/support/pages/FaqList';
import QnaList from '../../features/support/pages/QnaList';
import QnaDetail from '../../features/support/pages/QnaDetail';
import QnaWrite from '../../features/support/pages/QnaWrite';
import ComplainList from '../../features/support/pages/ComplainList';
import ComplainDetail from '../../features/support/pages/ComplainDetail';
import ComplainWrite from '../../features/support/pages/ComplainWrite';
import ComplainEdit from '../../features/support/pages/ComplainEdit';

// ── 권한 필요 ────────────────────────────────────────────────────
import RequireAuth from '../../app/router/guards/RequireAuth';

// ── admin ─────────────────────────────────────────────────────
import AdminInfo from '../../features/admin/pages/AdminInfo';
import AdminTourReservationList from '../../features/admin/pages/reservation/AdminTourReservationList';
import AdminSpaceReservationList from '../../features/admin/pages/reservation/AdminSpaceReservationList';
import AdminShell from '../../features/admin/components/AdminShell';
import AdminPropertyHub from '../../features/admin/pages/property/AdminPropertyHub';
import AdminBuildingList from '../../features/admin/pages/property/AdminBuildingList';
import AdminRoomList from '../../features/admin/pages/property/AdminRoomList';
import AdminSpaceList from '../../features/admin/pages/property/AdminSpaceList';

// ── admin/inspection ──────────────────────────────────────────
import AdminInspectionList from '../../features/admin/pages/inspection/AdminInspectionList';
import AdminInspectionDetail from '../../features/admin/pages/inspection/AdminInspectionDetail';
import AdminOpenTickets from '../../features/admin/pages/inspection/AdminOpenTickets';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/notifications', element: <NotificationList /> },

  { path: '/find-account', element: <FindAccount /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // property
  { path: '/buildings', element: <BuildingList /> },
  { path: '/buildings/:buildingId', element: <BuildingDetail /> },
  { path: '/rooms', element: <RoomList /> },
  { path: '/rooms/:roomId', element: <RoomDetail /> },
  { path: '/spaces', element: <SpaceList /> },
  { path: '/spaces/:spaceId', element: <SpaceDetail /> },

  // reservation – tour
  { path: '/reservations/tour/create', element: <TourReservationCreate /> },
  { path: '/reservations/tour/list', element: <TourReservationList /> },

  // reservation – space (로그인 필수)
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/reservations/space/create',
        element: <SpaceReservationCreate />,
      },
      {
        path: '/reservations/space/list',
        element: <SpaceReservationList />,
      },
    ],
  },

  // review
  { path: '/reviews/write', element: <ReviewWrite /> },
  { path: '/reviews/:reviewId/edit', element: <ReviewWrite /> },
  { path: '/reviews/my', element: <MyReviewsList /> },
  { path: '/reviews/:reviewId', element: <MyReviewsDetail /> },

  // contract
  { path: '/contracts/apply', element: <ContractApply /> },

  // support
  { path: '/support/notice', element: <NoticeList /> },
  { path: '/support/notice/:noticeId', element: <NoticeDetail /> },
  { path: '/support/faq', element: <FaqList /> },
  { path: '/support/qna', element: <QnaList /> },
  { path: '/support/qna/:qnaId', element: <QnaDetail /> },
  {
    path: '/support/qna/write',
    element: (
      <RequireAuth>
        <QnaWrite />
      </RequireAuth>
    ),
  },
  {
    path: '/support/complain',
    element: (
      <RequireAuth>
        <ComplainList />
      </RequireAuth>
    ),
  },
  {
    path: '/support/complain/:id',
    element: (
      <RequireAuth>
        <ComplainDetail />
      </RequireAuth>
    ),
  },
  {
    path: '/support/complain/edit/:id',
    element: (
      <RequireAuth>
        <ComplainEdit />
      </RequireAuth>
    ),
  },
  {
    path: '/support/complain/write',
    element: (
      <RequireAuth>
        <ComplainWrite />
      </RequireAuth>
    ),
  },

  // admin
  { path: '/admin', element: <AdminInfo /> },
  { path: '/admin/reservations/tours', element: <AdminTourReservationList /> },
  {
    path: '/admin/reservations/spaces',
    element: <AdminSpaceReservationList />,
  },
  {
    path: '/admin/property',
    element: <AdminShell />,
    children: [
      {
        element: <AdminPropertyHub />,
        children: [
          { path: 'buildings', element: <AdminBuildingList /> },
          { path: 'rooms', element: <AdminRoomList /> },
          { path: 'spaces', element: <AdminSpaceList /> },
        ],
      },
    ],
  },

  // admin inspection — AdminShell 안에 포함
  {
    path: '/admin/inspections',
    element: <AdminShell />,
    children: [
      { index: true, element: <AdminInspectionList /> },
      { path: 'tickets', element: <AdminOpenTickets /> },
      { path: ':inspectionId', element: <AdminInspectionDetail /> },
    ],
  },
]);

export default router;
