// features/reservation/pages/TourReservationList.jsx
// 팝업 내부 + 독립 페이지 겸용
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTourReservations from '../hooks/useTourReservations';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import styles from './TourReservationList.module.css';

function StatusBadge({ status }) {
  const map = {
    PENDING: { label: '대기', cls: styles.statusPending },
    CONFIRMED: { label: '확정', cls: styles.statusConfirmed },
    CANCELLED: { label: '취소됨', cls: styles.statusCancelled },
    COMPLETED: { label: '완료', cls: styles.statusCompleted },
  };
  const s = map[status] ?? { label: status ?? '-', cls: styles.statusPending };
  return <span className={`${styles.statusBadge} ${s.cls}`}>{s.label}</span>;
}

function TourCard({ item, onCancel }) {
  const id = item.tourId ?? item.id;
  const startAt = item.tourStartAt ?? item.startAt ?? '-';
  const endAt = item.tourEndAt ?? item.endAt ?? '-';
  const formatDt = (s) =>
    s && s !== '-' ? s.replace('T', ' ').slice(0, 16) : '-';

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          <p className={styles.cardRoomId}>방 #{item.roomId ?? '-'}</p>
          <p className={styles.cardTime}>
            {formatDt(startAt)} ~ {formatDt(endAt).slice(11)}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className={styles.cardBody}>
        <span className={styles.metaItem}>👤 {item.tourNm ?? '-'}</span>
        <span className={styles.metaItem}>📞 {item.tourTel ?? '-'}</span>
      </div>
      <div className={styles.cardBottom}>
        <span className={styles.cardId}>예약 #{id}</span>
        {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
          <button
            className={styles.cancelBtn}
            type="button"
            onClick={() => onCancel(id)}
          >
            예약 취소
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * inlineMode=true  → Header/Footer/topBar 없이 (Modal 안에서 사용)
 * onGoCreate       → "예약 생성" 버튼 클릭 콜백
 * onClose          → "닫기" 콜백
 */
export default function TourReservationList({
  inlineMode = false,
  onGoCreate,
  onClose,
}) {
  const nav = useNavigate();
  const { lookup, lookupPage, lookupLoading, lookupError, cancel } =
    useTourReservations();

  const [tourTel, setTourTel] = useState('');
  const [tourPwd, setTourPwd] = useState('');

  const items = lookupPage?.content ?? [];

  const onLookup = async (page = 1) => {
    if (!tourTel.trim()) return alert('연락처를 입력해주세요.');
    if (!/^[0-9]{4}$/.test(tourPwd))
      return alert('비밀번호는 숫자 4자리입니다.');
    try {
      await lookup(
        { tourTel: tourTel.trim(), tourPwd },
        { page, size: 10, sort: 'tourId', direct: 'DESC' }
      );
    } catch {
      /* hook에서 처리 */
    }
  };

  const onCancel = async (tourId) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await cancel(tourId, { tourTel: tourTel.trim(), tourPwd });
      alert('취소 완료');
      onLookup(lookupPage?.page ?? 1);
    } catch (e) {
      alert(e?.message ?? '취소 실패');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onLookup(1);
  };

  const mainContent = (
    <>
      {/* 상단 바 */}
      <div className={styles.topBarInline}>
        <span className={styles.inlineTitle}>📋 방문 예약 조회</span>
        <button
          className={styles.createLink}
          type="button"
          onClick={() =>
            inlineMode && onGoCreate
              ? onGoCreate()
              : nav('/reservations/tour/create')
          }
        >
          + 예약 생성
        </button>
      </div>

      {/* 조회 폼 */}
      <div className={styles.lookupBox}>
        <p className={styles.lookupDesc}>
          예약 시 입력한 연락처와 비밀번호로 조회합니다.
        </p>
        <div className={styles.lookupRow}>
          <input
            className={styles.input}
            type="tel"
            placeholder="연락처 (예: 010-0000-0000)"
            value={tourTel}
            onChange={(e) => setTourTel(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호 4자리"
            value={tourPwd}
            maxLength={4}
            pattern="\d{4}"
            onChange={(e) => setTourPwd(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ maxWidth: 160 }}
          />
          <button
            className={styles.lookupBtn}
            type="button"
            onClick={() => onLookup(1)}
            disabled={lookupLoading}
          >
            {lookupLoading ? '조회 중…' : '🔍 조회'}
          </button>
        </div>
        {lookupError && <p className={styles.errMsg}>{lookupError}</p>}
      </div>

      {/* 결과 */}
      {lookupPage && (
        <>
          <div className={styles.resultHeader}>
            <span className={styles.resultCount}>
              총 <strong>{lookupPage.totalElements ?? items.length}</strong>건
            </span>
            <div className={styles.paging}>
              <button
                className={styles.pageBtn}
                type="button"
                disabled={(lookupPage.page ?? 1) <= 1}
                onClick={() =>
                  onLookup(Math.max(1, (lookupPage.page ?? 1) - 1))
                }
              >
                이전
              </button>
              <span className={styles.pageInfo}>
                {lookupPage.page ?? 1}페이지
              </span>
              <button
                className={styles.pageBtn}
                type="button"
                disabled={items.length < 10}
                onClick={() => onLookup((lookupPage.page ?? 1) + 1)}
              >
                다음
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🗓️</span>
              <p>조회된 예약이 없습니다.</p>
            </div>
          ) : (
            <div className={styles.cardList}>
              {items.map((it) => (
                <TourCard
                  key={it.tourId ?? it.id}
                  item={it}
                  onCancel={onCancel}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );

  if (inlineMode) return <div className={styles.inlineWrap}>{mainContent}</div>;

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.topBar}>
        <button
          className={styles.backBtn}
          type="button"
          onClick={() => nav(-1)}
        >
          ←
        </button>
        <h1 className={styles.pageTitle}>📋 방문 예약 조회</h1>
        <button
          className={styles.createLink}
          type="button"
          onClick={() => nav('/reservations/tour/create')}
        >
          + 예약 생성
        </button>
      </div>
      {mainContent}
      <Footer />
    </div>
  );
}
