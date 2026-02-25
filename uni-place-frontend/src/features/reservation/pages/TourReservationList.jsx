// src/features/reservation/pages/TourReservationList.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useTourReservations from '../hooks/useTourReservations';

export default function TourReservationList() {
  const { lookup, lookupPage, lookupLoading, lookupError, cancel } =
    useTourReservations();

  const [tourTel, setTourTel] = useState('');
  const [tourPwd, setTourPwd] = useState('');

  const items = lookupPage?.content ?? [];

  const onLookup = async (page = 1) => {
    if (!tourTel || !tourPwd) return alert('tourTel / tourPwd 입력');
    if (!/^[0-9]{4}$/.test(tourPwd)) return alert('tourPwd는 숫자 4자리');

    try {
      await lookup(
        { tourTel, tourPwd },
        { page, size: 10, sort: 'tourId', direct: 'DESC' }
      );
    } catch {
      // hook에서 error 처리
    }
  };

  const onCancel = async (tourId) => {
    if (!window.confirm('취소할래?')) return;
    try {
      await cancel(tourId, { tourTel, tourPwd });
      alert('취소 완료');
      onLookup(lookupPage?.page ?? 1);
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
        <h2>투어 예약 조회/취소</h2>
        <Link to="/reservations/tour/create">+ 예약 생성</Link>
      </div>

      <section
        style={{
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            placeholder="tourTel"
            value={tourTel}
            onChange={(e) => setTourTel(e.target.value)}
          />
          <input
            placeholder="tourPwd(숫자4자리)"
            value={tourPwd}
            onChange={(e) => setTourPwd(e.target.value)}
          />
          <button onClick={() => onLookup(1)} disabled={lookupLoading}>
            {lookupLoading ? '조회중...' : '조회'}
          </button>
        </div>

        {lookupError && (
          <div style={{ marginTop: 8, color: 'crimson' }}>{lookupError}</div>
        )}

        {lookupPage && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <button
              onClick={() => onLookup(Math.max(1, (lookupPage.page ?? 1) - 1))}
            >
              이전
            </button>
            <div>page: {lookupPage.page}</div>
            <button onClick={() => onLookup((lookupPage.page ?? 1) + 1)}>
              다음
            </button>
          </div>
        )}
      </section>

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {items.map((it) => {
          const id = it.tourId ?? it.id;
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
                    roomId: {it.roomId ?? '-'} /{' '}
                    {it.tourStartAt ?? it.startAt ?? '-'} ~{' '}
                    {it.tourEndAt ?? it.endAt ?? '-'}
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 6 }}>
                    이름: {it.tourNm ?? it.name ?? '-'} / 전화:{' '}
                    {it.tourTel ?? it.phone ?? '-'} / 상태: {it.status ?? '-'}
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
