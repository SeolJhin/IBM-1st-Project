import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminInfo.module.css';

import { adminApi } from '../api/adminApi';

const CARD_CONFIG = [
  {
    key: 'residentCount',
    title: '입주자',
    subtitle: '등록 회원 현황',
    unit: '명',
    badge: 'U',
    path: '/admin/users',
  },
  {
    key: 'facilityCount',
    title: '시설',
    subtitle: '관리 대상 공간',
    unit: '건',
    badge: 'P',
    path: '/admin/property/spaces',
  },
  {
    key: 'tourCount',
    title: '투어 예약',
    subtitle: '방문 신청 건수',
    unit: '건',
    badge: 'T',
    path: '/admin/reservations/tours',
  },
  {
    key: 'contractCount',
    title: '계약',
    subtitle: '계약 진행 현황',
    unit: '건',
    badge: 'C',
    path: '/admin/contracts',
  },
  {
    key: 'bannerViewCount',
    title: '배너',
    subtitle: '배너 노출 집계',
    unit: '건',
    badge: 'B',
    path: '/admin/system/banners',
  },
  {
    key: 'roomServiceOrderCount',
    title: '룸서비스',
    subtitle: '주문 처리 현황',
    unit: '건',
    badge: 'R',
    path: '/admin/roomservice/room_orders',
  },
];

function formatValue(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString('en-US');
}

export default function AdminInfo() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const [dataSource, setDataSource] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState(null);
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
      const payload = await adminApi.dashboard();
      setDataSource(payload?._source || 'dashboard');
      setData({
        residentCount: Number(payload?.residentCount ?? 0),
        facilityCount: Number(payload?.facilityCount ?? 0),
        tourCount: Number(payload?.tourCount ?? 0),
        contractCount: Number(payload?.contractCount ?? 0),
        bannerViewCount: Number(payload?.bannerViewCount ?? 0),
        roomServiceOrderCount: Number(payload?.roomServiceOrderCount ?? 0),
      });
      setLastUpdated(new Date());
    } catch (error) {
      const message =
        error?.message || '대시보드 데이터를 불러오지 못했습니다. API 상태를 확인해 주세요.';
      setErrMsg(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const cards = useMemo(
    () =>
      CARD_CONFIG.map((config) => {
        const raw = Number(data[config.key] ?? 0);
        return {
          ...config,
          rawValue: Number.isFinite(raw) ? raw : 0,
        };
      }),
    [data]
  );

  const totalSignals = useMemo(
    () => cards.reduce((sum, card) => sum + card.rawValue, 0),
    [cards]
  );

  const maxValue = useMemo(
    () => Math.max(...cards.map((card) => card.rawValue), 1),
    [cards]
  );

  const normalizedMetrics = useMemo(
    () =>
      cards.map((card) => ({
        ...card,
        percent: Math.round((card.rawValue / maxValue) * 100),
        barHeight:
          card.rawValue === 0
            ? 8
            : Math.max(12, (card.rawValue / maxValue) * 100),
      })),
    [cards, maxValue]
  );

  return (
    <div className={styles.mainInner} aria-busy={loading}>
      <p className={styles.srOnly} aria-live="polite">
        {loading
          ? 'Loading dashboard data.'
          : errMsg
            ? `Dashboard load failed: ${errMsg}`
            : 'Dashboard data loaded.'}
      </p>
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>관리자 대시보드</h1>
          <p className={styles.pageSub}>
            입주자, 예약, 계약, 룸서비스 지표를 한 화면에서 확인하세요.
          </p>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={fetchDashboard}
          disabled={loading}
          aria-label="Refresh dashboard data"
        >
          {loading ? '갱신중...' : '새로고침'}
        </button>
      </div>

      <section className={styles.hero}>
        <div>
          <p className={styles.heroCaption}>운영 개요</p>
          <h2 className={styles.heroTitle}>관리자 통합 운영 대시보드</h2>
          <p className={styles.heroSub}>
            Skote의 관리자 카드/패널 흐름을 참고하되, 기존 프로젝트 스타일 톤을
            유지해서 구성했습니다.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>전체 지표 합계</span>
            <strong className={styles.heroStatValue}>
              {loading ? '...' : formatValue(totalSignals)}
            </strong>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>마지막 갱신</span>
            <strong className={styles.heroStatValue}>
              {lastUpdated ? lastUpdated.toLocaleTimeString('ko-KR') : '-'}
            </strong>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Data source</span>
            <strong className={styles.heroStatValue}>
              {dataSource === 'aggregate' ? 'Fallback aggregate' : 'Dashboard API'}
            </strong>
          </div>
        </div>
      </section>

      {errMsg ? (
        <div className={styles.errorBox} role="alert">
          {errMsg}
        </div>
      ) : null}

      <section className={styles.kpiGrid}>
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={styles.kpiCard}
            onClick={() => navigate(card.path)}
            aria-label={`${card.title} 상세 페이지`}
          >
            <div className={styles.kpiHead}>
              <div>
                <p className={styles.kpiTitle}>{card.title}</p>
                <p className={styles.kpiSub}>{card.subtitle}</p>
              </div>
              <span className={styles.kpiBadge}>{card.badge}</span>
            </div>
            <div className={styles.kpiValue}>
              {loading ? '...' : `${formatValue(card.rawValue)} ${card.unit}`}
            </div>
          </button>
        ))}
      </section>

      <section className={styles.panelGrid}>
        <article className={styles.panel}>
          <div className={styles.panelTop}>
            <h3 className={styles.panelTitle}>운영 비중</h3>
            <p className={styles.panelSub}>
              현재 최대값을 기준으로 각 지표 비중을 정규화해서 표시합니다.
            </p>
          </div>
          <div className={styles.ratioList}>
            {normalizedMetrics.map((metric) => (
              <div key={metric.key} className={styles.ratioRow}>
                <div className={styles.ratioMeta}>
                  <span>{metric.title}</span>
                  <span>{loading ? '...' : `${metric.percent}%`}</span>
                </div>
                <div className={styles.ratioTrack}>
                  <span
                    className={styles.ratioFill}
                    style={{ width: loading ? '0%' : `${metric.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelTop}>
            <h3 className={styles.panelTitle}>바로가기</h3>
            <p className={styles.panelSub}>
              자주 쓰는 관리자 메뉴로 즉시 이동합니다.
            </p>
          </div>
          <div className={styles.quickList}>
            {cards.map((card) => (
              <button
                key={`quick-${card.key}`}
                type="button"
                className={styles.quickItem}
                onClick={() => navigate(card.path)}
                aria-label={`${card.title}로 이동`}
              >
                <span className={styles.quickLabel}>{card.title}</span>
                <span className={styles.quickHint} aria-hidden="true">
                  열기
                </span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.trendPanel}>
        <div className={styles.panelTop}>
          <h3 className={styles.panelTitle}>지표 스냅샷</h3>
          <p className={styles.panelSub}>
            현재 카운트를 막대 형태로 빠르게 비교합니다.
          </p>
        </div>
        <div className={styles.barChart}>
          {normalizedMetrics.map((metric) => (
            <div key={`bar-${metric.key}`} className={styles.barItem}>
              <div className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ height: loading ? '8%' : `${metric.barHeight}%` }}
                />
              </div>
              <span className={styles.barLabel}>{metric.badge}</span>
              <span className={styles.barValue}>
                {loading ? '...' : formatValue(metric.rawValue)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
