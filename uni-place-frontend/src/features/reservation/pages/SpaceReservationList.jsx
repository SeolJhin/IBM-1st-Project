// features/reservation/pages/SpaceReservationList.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useSpaceReservations from '../hooks/useSpaceReservations';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';
import { toKoreanMessage } from '../../../app/http/errorMapper';
import styles from './SpaceReservationList.module.css';

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

function SpaceCard({ item, onCancel }) {
  const id = item.reservationId ?? item.id;
  const startAt = item.srStartAt ?? item.startAt ?? '-';
  const endAt = item.srEndAt ?? item.endAt ?? '-';
  const fmt = (s) => (s && s !== '-' ? s.replace('T', ' ').slice(0, 16) : '-');

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          <p className={styles.cardSpaceId}>
            {item.spaceNm ?? `공용공간 #${item.spaceId ?? '-'}`}
          </p>
          <p className={styles.cardTime}>
            {fmt(startAt)} ~ {fmt(endAt).slice(11)}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className={styles.cardBody}>
        <span className={styles.metaItem}>
          👥 {item.srNoPeople ?? item.noPeople ?? '-'}명
        </span>
        {item.buildingNm && (
          <span className={styles.metaItem}>🏢 {item.buildingNm}</span>
        )}
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
 * inlineMode=true  → Header/Footer/topBar 없이 컨텐츠만 (마이페이지 탭 용)
 * onGoCreate       → inlineMode에서 "예약 생성" 버튼 클릭 시 콜백
 */
export default function SpaceReservationList({
  inlineMode = false,
  onGoCreate,
}) {
  const nav = useNavigate();
  const { myQuery, setMyQuery, myPage, myLoading, myError, reloadMy, cancel } =
    useSpaceReservations();
  const items = myPage?.content ?? [];

  const onCancel = async (reservationId) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await cancel(reservationId);
      alert('취소 완료');
      reloadMy();
    } catch (e) {
      alert(toKoreanMessage(e, '취소 처리 중 오류가 발생했습니다.'));
    }
  };

  const listContent = (
    <>
      {/* 상단 액션 */}
      <div className={styles.topActions}>
        <button
          className={styles.refreshBtn}
          type="button"
          onClick={reloadMy}
          disabled={myLoading}
        >
          새로고침
        </button>
        <button
          className={styles.createLink}
          type="button"
          onClick={() =>
            inlineMode && onGoCreate ? onGoCreate() : nav('/me?tab=space')
          }
        >
          + 예약 생성
        </button>
      </div>

      {/* 페이지네이션 */}
      <div className={styles.paginationRow}>
        <button
          className={styles.pageBtn}
          type="button"
          disabled={(myQuery.page ?? 1) <= 1}
          onClick={() =>
            setMyQuery((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
          }
        >
          이전
        </button>
        <span className={styles.pageInfo}>{myQuery.page}페이지</span>
        <button
          className={styles.pageBtn}
          type="button"
          disabled={items.length < (myQuery.size ?? 10)}
          onClick={() => setMyQuery((p) => ({ ...p, page: p.page + 1 }))}
        >
          다음
        </button>
      </div>

      {myLoading && (
        <div className={styles.centerBox}>
          <span className={styles.spinner} />
        </div>
      )}
      {myError && <p className={styles.errMsg}>{myError}</p>}

      {!myLoading && items.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🛋️</span>
          <p>예약 내역이 없습니다.</p>
          <button
            className={styles.goCreateBtn}
            type="button"
            onClick={() =>
              inlineMode && onGoCreate ? onGoCreate() : nav('/me?tab=space')
            }
          >
            공용공간 예약하기
          </button>
        </div>
      )}

      {!myLoading && items.length > 0 && (
        <div className={styles.cardList}>
          {items.map((it) => (
            <SpaceCard
              key={it.reservationId ?? it.id}
              item={it}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </>
  );

  if (inlineMode) return <div className={styles.inlineWrap}>{listContent}</div>;

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
        <h1 className={styles.pageTitle}>🛋️ 내 공용공간 예약</h1>
        <div className={styles.topActionsHeader}>
          <button
            className={styles.refreshBtn}
            type="button"
            onClick={reloadMy}
            disabled={myLoading}
          >
            새로고침
          </button>
          <button
            className={styles.createLink}
            type="button"
            onClick={() => nav('/me?tab=space')}
          >
            + 예약 생성
          </button>
        </div>
      </div>
      {listContent}
      <Footer />
    </div>
  );
}
