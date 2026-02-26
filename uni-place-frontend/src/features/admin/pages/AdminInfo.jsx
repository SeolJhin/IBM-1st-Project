import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/AdminPageHeader'; // 프로젝트 경로에 맞게 조정
import styles from './AdminInfo.module.css';

import { getAdminDashboard } from '../api/adminApi';
import { useAuth } from '../../user/hooks/useAuth';

// tokenStore가 이미 src/app/http/tokenStore.js 에 있으면 그걸 쓰는 게 베스트
// 경로가 다르면 아래 import 경로만 맞춰줘.
import { getOrCreateDeviceId } from '../../../app/http/tokenStore'; // 프로젝트 경로에 맞게 조정

const StatIcon = ({ type }) => {
  const map = {
    resident: '👤',
    facility: '🏢',
    tour: '🔖',
    contract: '📝',
    banner: '➕',
    roomservice: '🛎️',
  };
  return <span className={styles.icon}>{map[type] ?? '📊'}</span>;
};

export default function AdminInfo() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const [data, setData] = useState({
    residentCount: 0,
    facilityCount: 0,
    tourCount: 0,
    contractCount: 0,
    bannerViewCount: 0,
    roomServiceOrderCount: 0,
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setErrMsg('');
    try {
      const resp = await getAdminDashboard();
      // apiJson.get() 가 axios 기반이면 resp.data에 담겨올 가능성 큼
      const payload = resp?.data ?? resp;

      setData({
        residentCount: payload?.residentCount ?? 0,
        facilityCount: payload?.facilityCount ?? 0,
        tourCount: payload?.tourCount ?? 0,
        contractCount: payload?.contractCount ?? 0,
        bannerViewCount: payload?.bannerViewCount ?? 0,
        roomServiceOrderCount: payload?.roomServiceOrderCount ?? 0,
      });
    } catch (e) {
      // 서버 아직 없으면 화면은 뜨되, 안내만 띄우게
      setErrMsg(
        '대시보드 데이터를 불러오지 못했어요. (백엔드 /admin/dashboard 확인)'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // 좌측 메뉴(첫 번째 이미지처럼)
  const sideMenu = useMemo(
    () => [
      { label: '통계', path: '/admin' }, // 현재 페이지
      { label: '회원관리', path: '/admin/users' },
      { label: '시설 관리', path: '/admin/property/buildings' },
      { label: '사전방문 관리', path: '/admin/reservation/tours' },
      { label: '계약 관리', path: '/admin/contract/contracts' },
      { label: '배너관리', path: '/admin/system/banners' },
      { label: '룸서비스 관리', path: '/admin/roomservice/orders' },
    ],
    []
  );

  const cards = useMemo(
    () => [
      {
        title: '입주자 수',
        icon: 'resident',
        value: `${data.residentCount}명`,
        onClick: () => navigate('/admin/contract/residents'),
      },
      {
        title: '시설',
        icon: 'facility',
        value: `${data.facilityCount}명`,
        onClick: () => navigate('/admin/property/buildings'),
      },
      {
        title: '투어',
        icon: 'tour',
        value: `${data.tourCount}개`,
        onClick: () => navigate('/admin/reservation/tours'),
      },
      {
        title: '계약',
        icon: 'contract',
        value: `${data.contractCount}건`,
        onClick: () => navigate('/admin/contract/contracts'),
      },
      {
        title: '배너',
        icon: 'banner',
        value: `${data.bannerViewCount} 열람`,
        onClick: () => navigate('/admin/system/banners'),
      },
      {
        title: '룸서비스',
        icon: 'roomservice',
        value: `${data.roomServiceOrderCount}건`,
        onClick: () => navigate('/admin/roomservice/orders'),
      },
    ],
    [data, navigate]
  );

  return (
    <div className={styles.page}>
      <Header />

      <div className={styles.body}>
        {/* LEFT */}
        <aside className={styles.sidebar}>
          <div className={styles.sideBox}>
            {sideMenu.map((m) => {
              const active = m.path === '/admin'; // 현재 AdminInfo
              return (
                <button
                  key={m.label}
                  type="button"
                  className={`${styles.sideItem} ${active && m.label === '통계' ? styles.sideItemActive : ''}`}
                  onClick={() => navigate(m.path)}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN */}
        <main className={styles.main}>
          <div className={styles.mainInner}>
            <div className={styles.topRow}>
              <div className={styles.titleArea}>
                <h1 className={styles.pageTitle}>관리자 통계</h1>
                <p className={styles.pageSub}>
                  전체 운영 현황을 한눈에 확인하세요.
                </p>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={fetchDashboard}
                  disabled={loading}
                >
                  새로고침
                </button>
              </div>
            </div>

            {errMsg ? <div className={styles.errorBox}>{errMsg}</div> : null}

            <section className={styles.grid}>
              {cards.map((c) => (
                <button
                  key={c.title}
                  type="button"
                  className={styles.card}
                  onClick={c.onClick}
                >
                  <div className={styles.cardTitle}>{c.title}</div>
                  <div className={styles.cardBottom}>
                    <StatIcon type={c.icon} />
                    <div className={styles.cardValue}>
                      {loading ? '...' : c.value}
                    </div>
                  </div>
                </button>
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
