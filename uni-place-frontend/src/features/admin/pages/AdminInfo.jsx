import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminInfo.module.css';

import { adminApi } from '../api/adminApi';

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
      // adminApi.dashboard()는 이미 data를 unwrap해서 반환하므로 resp.data 처리 필요 없음
      const payload = await adminApi.dashboard();
      setData({
        residentCount: payload?.residentCount ?? 0,
        facilityCount: payload?.facilityCount ?? 0,
        tourCount: payload?.tourCount ?? 0,
        contractCount: payload?.contractCount ?? 0,
        bannerViewCount: payload?.bannerViewCount ?? 0,
        roomServiceOrderCount: payload?.roomServiceOrderCount ?? 0,
      });
    } catch (e) {
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
        value: `${data.bannerViewCount}건`,
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
    <div className={styles.mainInner}>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>관리자 통계</h1>
          <p className={styles.pageSub}>전체 운영 현황을 한눈에 확인하세요.</p>
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
  );
}
