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

import RequireAuth from './app/router/guards/RequireAuth';
import RequireRole from './app/router/guards/RequireRole';
import AdminInfo from './features/admin/pages/AdminInfo';

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
            <Route path="/admin" element={<AdminInfo />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
