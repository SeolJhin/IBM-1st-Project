// src/features/reservation/pages/SpaceReservationList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useSpaceReservations from '../hooks/useSpaceReservations';

export default function SpaceReservationList() {
  const { myQuery, setMyQuery, myPage, myLoading, myError, reloadMy, cancel } =
    useSpaceReservations();

  const items = myPage?.content ?? [];

  const onCancel = async (reservationId) => {
    if (!window.confirm('예약 취소할래?')) return;
    try {
      await cancel(reservationId);
      alert('취소 완료');
      reloadMy();
    } catch (e) {
      alert(e?.message ?? '취소 실패');
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <h2>내 공용공간 예약</h2>
        <Link to="/reservations/space/create">+ 예약 생성</Link>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <button
          onClick={() =>
            setMyQuery((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
          }
        >
          이전
        </button>
        <div>page: {myQuery.page}</div>
        <button onClick={() => setMyQuery((p) => ({ ...p, page: p.page + 1 }))}>
          다음
        </button>
        <button onClick={reloadMy} style={{ marginLeft: 'auto' }}>
          새로고침
        </button>
      </div>

      {myLoading && <div>로딩중...</div>}
      {myError && <div style={{ color: 'crimson' }}>{myError}</div>}

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {items.map((it) => {
          const id = it.reservationId ?? it.id;
          return (
            <div
              key={id}
              style={{
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>
                    spaceId: {it.spaceId ?? '-'} /{' '}
                    {it.srStartAt ?? it.startAt ?? '-'} ~{' '}
                    {it.srEndAt ?? it.endAt ?? '-'}
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    인원: {it.srNoPeople ?? it.noPeople ?? '-'} / 상태:{' '}
                    {it.status ?? '-'}
                  </div>
                </div>
                <button
                  onClick={() => onCancel(id)}
                  style={{ padding: '8px 10px' }}
                >
                  취소
                </button>
              </div>

              <pre
                style={{
                  marginTop: 10,
                  background: '#fafafa',
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                {JSON.stringify(it, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
