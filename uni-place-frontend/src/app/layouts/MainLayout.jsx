// app/layouts/MainLayout.jsx  ← 기존 파일에 아래 내용 추가
//
// 변경사항:
//   1. ChatBot import 추가
//   2. GEMINI_API_KEY, USE_BACKEND_AI import 추가
//   3. <main> 아래에 <ChatBot /> 추가

import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../features/user/hooks/useAuth';

// ✅ 추가
import ChatBot from '../../features/chat/components/ChatBot';
import {
  GEMINI_API_KEY,
  USE_BACKEND_AI,
} from '../../features/chat/config/chatConfig';

export default function MainLayout() {
  const { user } = useAuth();

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />

      {/* ✅ 챗봇 플로팅 버튼 - 모든 페이지에 표시 */}
      <ChatBot
        user={user}
        geminiApiKey={GEMINI_API_KEY}
        useBackend={USE_BACKEND_AI}
      />
    </div>
  );
}
