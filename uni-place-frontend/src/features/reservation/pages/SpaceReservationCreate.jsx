import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { propertyApi } from '../../property/api/propertyApi';
import { reservationApi } from '../api/reservationApi';

import BuildingSlotButtons from '../components/BuildingSlotButtons';
import TimeSlotButtons from '../components/TimeSlotButtons';

export default function SpaceReservationCreate() {
  const nav = useNavigate();

  // 빌딩 목록(프로퍼티 API 사용)
  const [buildings, setBuildings] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');

  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // spaces(= 공용공간 + availableSlots) 조회 상태
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [spacesPage, setSpacesPage] = useState(null);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesError, setSpacesError] = useState('');

  const spaces = spacesPage?.content ?? [];

  const [spaceId, setSpaceId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [srNoPeople, setSrNoPeople] = useState(1);

  // 1) 빌딩 로드
  const loadBuildings = async () => {
    setBLoading(true);
    setBError('');
    try {
      const page = await propertyApi.getBuildings({
        page: 1,
        size: 50,
        sort: 'buildingId',
        direct: 'DESC',
      });
      setBuildings(page?.content ?? []);
    } catch (e) {
      setBError(e?.message || '빌딩 조회 실패');
      setBuildings([]);
    } finally {
      setBLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  // 2) 빌딩 선택 또는 날짜 변경 -> spaces 조회
  const loadSpaces = async (buildingId, targetDate) => {
    if (!buildingId || !targetDate) return;
    setSpacesLoading(true);
    setSpacesError('');
    try {
      const page = await reservationApi.reservableSpaces({
        buildingId,
        date: targetDate,
        page: 1,
        size: 10,
        sort: 'spaceId',
        direct: 'DESC',
      });
      setSpacesPage(page);
    } catch (e) {
      setSpacesError(e?.message || '공용공간 조회 실패');
      setSpacesPage(null);
    } finally {
      setSpacesLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedBuilding?.buildingId) return;
    loadSpaces(Number(selectedBuilding.buildingId), date);
    setSpaceId('');
    setSelectedSlot(null);
  }, [selectedBuilding, date]);

  // spaces 로드되면 첫 space 자동 선택
  useEffect(() => {
    const first = spaces?.[0];
    if (first && !spaceId) setSpaceId(String(first.spaceId));
  }, [spaces, spaceId]);

  // 선택된 space가 바뀌면 slot 초기화
  useEffect(() => {
    setSelectedSlot(null);
  }, [spaceId]);

  const currentSpace = useMemo(
    () => spaces.find((s) => String(s.spaceId) === String(spaceId)),
    [spaces, spaceId]
  );

  const availableSlots = currentSpace?.availableSlots ?? [];

  const onSubmit = async () => {
    if (!selectedBuilding?.buildingId) return alert('빌딩을 선택해줘.');
    if (!spaceId) return alert('공용공간을 선택해줘.');
    if (!selectedSlot) return alert('슬롯을 선택해줘.');

    try {
      await reservationApi.createSpaceReservation({
        buildingId: Number(selectedBuilding.buildingId),
        spaceId: Number(spaceId),
        srStartAt: selectedSlot.startAt,
        srEndAt: selectedSlot.endAt,
        srNoPeople: Number(srNoPeople),
      });
      alert('예약 생성 완료');
      nav('/reservations/space/list');
    } catch (e) {
      alert(e?.message || '생성 실패');
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <h2>공용공간 예약</h2>

      {/* 빌딩 선택 */}
      <section
        style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>1) 빌딩 선택</h3>
          <button onClick={loadBuildings} disabled={bLoading}>
            {bLoading ? '조회중...' : '새로고침'}
          </button>
        </div>

        {bError && (
          <div style={{ marginTop: 8, color: 'crimson' }}>{bError}</div>
        )}

        <div style={{ marginTop: 10 }}>
          <BuildingSlotButtons
            buildings={buildings}
            selectedId={selectedBuilding?.buildingId}
            onSelect={setSelectedBuilding}
          />
        </div>

        {selectedBuilding && (
          <div style={{ marginTop: 10, opacity: 0.85 }}>
            선택됨: {selectedBuilding.buildingNm} (#
            {selectedBuilding.buildingId})
          </div>
        )}
      </section>

      {/* 공용공간/슬롯 */}
      <section
        style={{
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          marginTop: 12,
        }}
      >
        <h3 style={{ marginTop: 0 }}>2) 공용공간 / 슬롯 선택</h3>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <label>
            날짜&nbsp;
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!selectedBuilding}
            />
          </label>

          <label style={{ marginLeft: 'auto' }}>
            인원&nbsp;
            <input
              type="number"
              min="1"
              value={srNoPeople}
              onChange={(e) => setSrNoPeople(e.target.value)}
              style={{ width: 90 }}
              disabled={!selectedBuilding}
            />
          </label>
        </div>

        {spacesLoading && <div style={{ marginTop: 8 }}>로딩중...</div>}
        {spacesError && (
          <div style={{ marginTop: 8, color: 'crimson' }}>{spacesError}</div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6 }}>공용공간 선택</div>
          <select
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            disabled={!selectedBuilding}
          >
            <option value="">선택</option>
            {spaces.map((s) => (
              <option key={s.spaceId} value={s.spaceId}>
                {s.spaceNm ?? '공용공간'} (#{s.spaceId})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6 }}>슬롯 선택</div>
          <TimeSlotButtons
            slots={availableSlots}
            selectedKey={selectedSlot ? String(selectedSlot.startAt) : ''}
            onSelect={setSelectedSlot}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onSubmit} style={{ padding: '10px 12px' }}>
            예약 생성
          </button>
          <button onClick={() => nav(-1)} style={{ padding: '10px 12px' }}>
            뒤로
          </button>
        </div>
      </section>
    </div>
  );
}
