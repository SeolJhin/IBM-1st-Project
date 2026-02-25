import React from 'react';
import './app/styles/globals.css';

import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './shared/pages/Home';
import Login from './features/user/pages/Login';
import Signup from './features/user/pages/Signup';
import MemberInfo from './features/user/pages/MemberInfo';
import About from './shared/pages/About';
import ScrollToTop from './shared/components/ScrollToTop';

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
      </Routes>
    </>
  );
}
