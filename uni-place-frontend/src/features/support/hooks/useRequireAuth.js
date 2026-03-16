import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 비로그인 접근 시 경고창 표시 후 로그인 페이지로 이동
 * @param {object|null} user - 현재 로그인 유저
 * @param {string} serviceName - 서비스 이름 (예: "민원 접수", "1:1 문의")
 * @returns {boolean} - true면 접근 차단 중 (렌더링 스킵용)
 */
export function useRequireAuth(user, serviceName = '이 서비스') {
  const navigate = useNavigate();
  const alerted = useRef(false);

  useEffect(() => {
    if (!user && !alerted.current) {
      alerted.current = true;
      alert(`${serviceName}는 로그인이 필요합니다.`);
      navigate('/login', { replace: true });
    }
  }, [user, serviceName, navigate]);

  return !user;
}
