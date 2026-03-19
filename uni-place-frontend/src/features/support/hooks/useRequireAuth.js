import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../user/hooks/useAuth';

/**
 * 비로그인 접근 시 경고창 표시 후 로그인 페이지로 이동
 * @param {object|null} user - 현재 로그인 유저
 * @param {string} serviceName - 서비스 이름 (예: "민원 접수", "1:1 문의")
 * @returns {boolean} - true면 접근 차단 중 (렌더링 스킵용)
 */
export function useRequireAuth(user, serviceName = '이 서비스') {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const alerted = useRef(false);
  const unmounted = useRef(false);

  // 언마운트 감지 (로그아웃 시 컴포넌트가 사라지는 중엔 alert 안 띄움)
  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    // 1. 아직 인증 정보 로딩 중 (새로고침 직후) → 대기
    if (loading) return;

    // 2. 컴포넌트가 언마운트되는 중 (로그아웃으로 페이지 이동 중) → 무시
    if (unmounted.current) return;

    // 3. 로딩 완료 후 user 없음 → 비로그인 접근 → alert
    if (!user && !alerted.current) {
      alerted.current = true;
      alert(`${serviceName}는 로그인이 필요합니다.`);
      navigate('/login', { replace: true });
    }
  }, [user, loading, serviceName, navigate]);

  return loading || !user;
}
