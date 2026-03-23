import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import styles from './AdminSystemDashboard.module.css';

function Donut({ percent, label }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));

  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 140 140" className={styles.donut}>
        {/* 배경 */}
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="#eee"
          strokeWidth="14"
          fill="none"
        />

        {/* 값 */}
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="#5b5bd6"
          strokeWidth="14"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>

      <div className={styles.donutCenter}>
        <strong>{p.toFixed(1)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export default function AdminSystemDashboard() {
  const [data, setData] = useState({
    activeBanner: 0,
    activeAffiliate: 0,
    endingSoonBanner: 0,
    endingSoonAffiliate: 0,
    bannerRate: 0,
    affiliateRate: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [bannersRes, affiliatesRes] = await Promise.all([
          adminApi.getBanners({ size: 1000 }),
          adminApi.getAffiliates({ size: 1000 }),
        ]);

        const banners = bannersRes?.content ?? [];
        const affiliates = affiliatesRes?.content ?? [];

        const now = new Date();
        const weekLater = new Date();
        weekLater.setDate(now.getDate() + 7);

        // =========================
        // 배너 계산
        // =========================
        const activeBannerList = banners.filter((b) => b.banSt === 'active');

        const endingSoonBannerList = banners.filter((b) => {
          const end = new Date(b.endAt);
          return end >= now && end <= weekLater;
        });

        const bannerRate =
          banners.length > 0
            ? (activeBannerList.length / banners.length) * 100
            : 0;

        // =========================
        // 제휴 계산
        // =========================
        const activeAffiliateList = affiliates.filter(
          (a) => a.affiliateSt === 'progress'
        );

        const endingSoonAffiliateList = affiliates.filter((a) => {
          const end = new Date(a.affiliateEndAt);
          return end >= now && end <= weekLater;
        });

        const affiliateRate =
          affiliates.length > 0
            ? (activeAffiliateList.length / affiliates.length) * 100
            : 0;

        setData({
          activeBanner: activeBannerList.length,
          activeAffiliate: activeAffiliateList.length,
          endingSoonBanner: endingSoonBannerList.length,
          endingSoonAffiliate: endingSoonAffiliateList.length,
          bannerRate,
          affiliateRate,
        });
      } catch (e) {
        console.error(e);
      }
    }

    fetchData();
  }, []);

  const bannerDeg = (data.bannerRate / 100) * 360;
  const affiliateDeg = (data.affiliateRate / 100) * 360;

  return (
    <div className={styles.dashboard}>
      <div className={`${styles.card} ${styles.cardSmall}`}>
        <h3>활성 상태</h3>
        <div className={styles.row}>
          <div>
            <p>배너{data.activeBanner}건</p>
            <div className={styles.divider} />
            <p>제휴 {data.activeAffiliate}건</p>
          </div>
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardSmall}`}>
        <h3>종료 예정</h3>
        <div className={styles.row}>
          <div>
            <p>배너 {data.endingSoonBanner}건</p>
            <div className={styles.divider} />
            <p>제휴 {data.endingSoonAffiliate}건</p>
          </div>
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardLarge}`}>
        <h3>활성율</h3>

        <div className={styles.donutRow}>
          <Donut percent={data.bannerRate} label="배너" />
          <Donut percent={data.affiliateRate} label="제휴" />
        </div>
      </div>
    </div>
  );
}
