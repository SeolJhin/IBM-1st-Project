import React, { useCallback, useEffect, useState } from 'react';
import styles from './AdminInfo.module.css';
import { adminApi } from '../api/adminApi';

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const formatNumber = (v) => toNum(v).toLocaleString('ko-KR');
const formatMoney = (v) => `${toNum(v).toLocaleString('ko-KR')}원`;
const formatPercent = (v) => `${toNum(v).toFixed(1)}%`;

/* ================= 날짜 유틸 ================= */
const isToday = (date) => {
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const isTodaySafe = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const eq = (a, b) => String(a || '').toLowerCase() === String(b).toLowerCase();

const isYesterday = (date) => {
  const d = new Date(date);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toDateString() === y.toDateString();
};

const diffDays = (date) =>
  (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);

const diffFromNowDays = (date) =>
  (new Date() - new Date(date)) / (1000 * 60 * 60 * 24);

const getPaymentDate = (p) => p?.paidAt ?? p?.createdAt ?? null;
const getPaymentAmount = (p) => toNum(p?.capturedPrice ?? p?.totalPrice);

const isRentPayment = (p) => {
  const t = String(p?.targetType ?? '').toLowerCase();
  return t === 'monthly_charge' || t === 'rent' || t === 'charge';
};

const isOrderPayment = (p) => {
  const t = String(p?.targetType ?? '').toLowerCase();
  return t === 'order' || t === 'room_service' || t === 'roomservice';
};

/* ================= 알림 컴포넌트 ================= */
function AlertSection({ alerts }) {
  const renderList = (list) =>
    list.map((item, i) => (
      <div key={i} className={styles.alertItem}>
        - {item.text}
      </div>
    ));

  return (
    <div className={styles.alertGrid}>
      <div className={styles.alertCol}>
        <div className={`${styles.alertTitle} ${styles.danger}`}>
          🔴 긴급 (즉시 처리)
        </div>
        {alerts.danger.length > 0 ? (
          renderList(alerts.danger)
        ) : (
          <div>- 없음</div>
        )}
      </div>

      <div className={styles.alertCol}>
        <div className={`${styles.alertTitle} ${styles.warning}`}>🟡 주의</div>
        {alerts.warning.length > 0 ? (
          renderList(alerts.warning)
        ) : (
          <div>- 없음</div>
        )}
      </div>

      <div className={styles.alertCol}>
        <div className={`${styles.alertTitle} ${styles.info}`}>🟢 참고</div>
        {renderList(alerts.info)}
      </div>
    </div>
  );
}

/* ================= 알림 생성 ================= */
function buildAlerts(metrics) {
  const danger = [];
  const warning = [];
  const info = [];

  if (metrics?.unpaidMonthlyRent > 0) {
    danger.push({
      text: `월세 미납 (${metrics.unpaidMonthlyRent}건)`,
    });
  }

  if (metrics?.paymentFailSpike >= 5) {
    danger.push({
      text: `결제 실패 급증 (${metrics.paymentFailSpike}건)`,
    });
  }

  if (metrics?.expiringContracts > 0) {
    warning.push({
      text: `계약 만료 임박 (${metrics.expiringContracts}건)`,
    });
  }

  if (metrics?.longVacancyRooms > 0) {
    warning.push({
      text: `공실 장기 방치 (${metrics.longVacancyRooms}개)`,
    });
  }

  if (danger.length === 0 && warning.length === 0) {
    info.push({ text: '현재 특이사항 없음' });
  } else {
    info.push({ text: '기타' });
  }

  return { danger, warning, info };
}

/* ================= 메인 ================= */

export default function AdminInfo() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const alerts = buildAlerts(metrics);

  const fetchAllUsers = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.users({ page, size: 10 });
      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const fetchAllReservations = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.tourReservations({
        page,
        size: 15,
        sort: 'tourId',
        direct: 'DESC',
      });

      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const fetchAllContracts = async () => {
    let page = 1;
    let all = [];

    while (true) {
      const res = await adminApi.getContracts({
        page,
        size: 50,
        sort: 'contractId',
        direct: 'DESC',
      });

      const content = res?.content ?? [];
      all = [...all, ...content];

      if (page >= (res?.totalPages ?? 1)) break;
      page++;
    }

    return all;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const contracts = await fetchAllContracts().catch(() => []);
      const paymentsRes = await adminApi.getPayments().catch(() => []);
      const complainsRes = await adminApi
        .getComplains()
        .catch(() => ({ content: [] }));
      const users = await fetchAllUsers();
      const roomsRes = await adminApi.getRooms?.().catch(() => []);
      const reservations = await fetchAllReservations();

      const payments = paymentsRes?.content ?? paymentsRes ?? [];
      const complains = complainsRes?.content ?? complainsRes ?? [];
      const rooms = roomsRes?.content ?? roomsRes ?? [];

      console.table(
        contracts.map((c) => ({
          contractId: c.contractId,
          contractSt: c.contractSt,
          contractStatus: c.contractStatus,
          userId: c.userId,
          roomId: c.roomId,
          contractStart: c.contractStart,
          contractEnd: c.contractEnd,
        }))
      );

      /* ================= ALERT ================= */

      const unpaidMonthlyRent = payments.filter(
        (p) => p.paymentSt === 'unpaid'
      ).length;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const paymentFailSpike = payments.filter(
        (p) =>
          eq(p.paymentSt, 'fail') &&
          getPaymentDate(p) &&
          new Date(getPaymentDate(p)) >= oneHourAgo
      ).length;

      const expiringContracts = contracts.filter((c) => {
        const d = diffDays(c.contractEnd);
        return d <= 7 && d >= 0;
      }).length;

      const roomSet = new Set();

      contracts.forEach((c) => {
        if (c.contractEnd && diffFromNowDays(c.contractEnd) >= 365) {
          roomSet.add(c.roomId);
        }
      });

      rooms.forEach((r) => {
        if (r.createdAt && diffFromNowDays(r.createdAt) >= 365) {
          roomSet.add(r.roomId);
        }
      });

      const longVacancyRooms = roomSet.size;

      /* ================= KPI ================= */
      const today = new Date().toISOString().slice(0, 10);
      const todayVisitors = users.filter(
        (u) => u.lastLoginAt?.slice(0, 10) === today
      ).length;

      const newUsers = users.filter((u) => isToday(u.createdAt)).length;

      const activeContracts = contracts.filter((c) =>
        eq(c.contractSt ?? c.contractStatus, 'active')
      );

      const todayConfirmedTours = reservations.filter(
        (r) => r.tourSt === 'confirmed' && r.tourStartAt?.slice(0, 10) === today
      ).length;

      const todayRevenue = payments
        .filter(
          (p) => eq(p.paymentSt, 'paid') && isTodaySafe(getPaymentDate(p))
        )
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const yesterdayRevenue = payments
        .filter(
          (p) => eq(p.paymentSt, 'paid') && isYesterday(getPaymentDate(p))
        )
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const revenueGrowth =
        yesterdayRevenue > 0
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
          : 0;

      const unresolvedComplaintsToday = complains.filter(
        (c) => isTodaySafe(c.createdAt) && !eq(c.compSt, 'resolved')
      ).length;

      const unresolvedComplaints = complains.filter(
        (c) => !eq(c.compSt, 'resolved')
      ).length;

      /* ================= 운영 ================= */

      const vacantRooms = rooms.filter(
        (r) => !eq(r.roomSt, 'contracted')
      ).length;

      const vacancyRate =
        rooms.length > 0 ? (vacantRooms / rooms.length) * 100 : 0;

      const todayCheckin = contracts.filter((c) =>
        isToday(c.contractStart)
      ).length;

      const todayCheckout = contracts.filter((c) =>
        isToday(c.contractEnd)
      ).length;

      const totalPayments = payments.length;

      const failCount = payments.filter((p) => p.paymentSt === 'fail').length;

      const todayPaidPayments = payments.filter(
        (p) => eq(p.paymentSt, 'paid') && isTodaySafe(getPaymentDate(p))
      );

      const rentRevenue = todayPaidPayments
        .filter(isRentPayment)
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const serviceRevenue = todayPaidPayments
        .filter(isOrderPayment)
        .reduce((sum, p) => sum + getPaymentAmount(p), 0);

      const paymentFailRate =
        totalPayments > 0 ? (failCount / totalPayments) * 100 : 0;

      setMetrics({
        unpaidMonthlyRent,
        paymentFailSpike,
        expiringContracts,
        longVacancyRooms,

        todayVisitors,
        newUsers,
        activeContracts: activeContracts.length,
        todayReservations: todayConfirmedTours,
        monthlyRevenue: todayRevenue,
        revenueGrowth,
        unresolvedComplaints,
        unresolvedComplaintsToday,

        vacancyRate,
        todayCheckin,
        todayCheckout,
        paymentFailRate,
        rentRevenue,
        serviceRevenue,
      });

      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.message || '대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className={styles.page}>로딩중...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>관리자 운영 대시보드</h1>
          <p>공유주거 플랫폼의 운영 상태를 한눈에 확인합니다.</p>
        </div>
        <button onClick={load}>{loading ? '갱신 중...' : '새로고침'}</button>
      </div>

      <div className={styles.meta}>
        마지막 갱신: {lastUpdated?.toLocaleString('ko-KR')}
      </div>

      <section className={styles.section}>
        <h2>알림</h2>
        <AlertSection alerts={alerts} />
      </section>

      <section className={styles.section}>
        <h2>KPI 요약</h2>
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span>오늘 방문자</span>
            <strong>{formatNumber(metrics.todayVisitors)}</strong>
          </div>

          <div className={styles.kpi}>
            <span>신규 회원</span>
            <strong>{formatNumber(metrics.newUsers)}</strong>
          </div>

          <div className={styles.kpi}>
            <span>활성 계약</span>
            <strong>{formatNumber(metrics.activeContracts)}</strong>
          </div>

          <div className={styles.kpi}>
            <span>투어 예약</span>
            <strong>{formatNumber(metrics.todayReservations)}</strong>
          </div>

          <div className={styles.kpi}>
            <span>오늘 매출</span>
            <strong>
              {formatMoney(metrics.monthlyRevenue)} (
              {formatPercent(metrics.revenueGrowth)})
            </strong>
          </div>

          <div className={styles.kpi}>
            <span>오늘 등록된 민원 수</span>
            <strong>{formatNumber(metrics.unresolvedComplaintsToday)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>운영 현황</h2>

        <div className={styles.operationGrid}>
          <div className={styles.opCard}>
            <h3>🏠 숙소 운영</h3>
            <p>
              공실률: <strong>{formatPercent(metrics.vacancyRate)}</strong>
            </p>
            <p>
              체크인: <strong>{metrics.todayCheckin}</strong>
            </p>
            <p>
              체크아웃: <strong>{metrics.todayCheckout}</strong>
            </p>
          </div>

          <div className={styles.opCard}>
            <h3>💳 결제 현황</h3>
            <p>
              월세: <strong>{formatMoney(metrics.rentRevenue)}</strong>
            </p>
            <p>
              룸서비스: <strong>{formatMoney(metrics.serviceRevenue)}</strong>
            </p>
            <p>
              실패율: <strong>{formatPercent(metrics.paymentFailRate)}</strong>
            </p>
          </div>

          <div className={styles.opCard}>
            <h3>📞 고객 대응</h3>
            <p>
              미처리 민원: <strong>{metrics.unresolvedComplaints}</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
