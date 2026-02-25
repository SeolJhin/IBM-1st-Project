import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { propertyApi } from '../../property/api/propertyApi';
import { reservationApi } from '../api/reservationApi';

import BuildingSlotButtons from '../components/BuildingSlotButtons';
import TimeSlotButtons from '../components/TimeSlotButtons';

export default function TourReservationCreate() {
  const nav = useNavigate();

  // 빌딩 목록
  const [buildings, setBuildings] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // rooms
  const [roomsPage, setRoomsPage] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');
  const rooms = roomsPage?.content ?? [];

  // slot
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roomId, setRoomId] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({ tourNm: '', tourTel: '', tourPwd: '' });

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

  const loadRooms = async (buildingId) => {
    if (!buildingId) return;
    setRoomsLoading(true);
    setRoomsError('');
    try {
      const page = await reservationApi.reservableRooms({
        buildingId,
        page: 1,
        size: 10,
        sort: 'roomId',
        direct: 'DESC',
      });
      setRoomsPage(page);
    } catch (e) {
      setRoomsError(e?.message || '방 조회 실패');
      setRoomsPage(null);
    } finally {
      setRoomsLoading(false);
    }
  };

  const loadSlots = async ({ buildingId, roomId, date }) => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const res = await reservationApi.reservableTourSlots({
        buildingId,
        roomId,
        date,
      });
      setSlots(res?.availableSlots ?? []);
    } catch (e) {
      setSlotsError(e?.message || '슬롯 조회 실패');
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // 빌딩 선택 -> 방 조회
  useEffect(() => {
    if (!selectedBuilding?.buildingId) return;
    setRoomId('');
    setSelectedSlot(null);
    setSlots([]);
    loadRooms(Number(selectedBuilding.buildingId));
  }, [selectedBuilding]);

  // rooms 로드되면 첫 room 자동 선택
  useEffect(() => {
    const first = rooms?.[0];
    if (first && !roomId) setRoomId(String(first.roomId));
  }, [rooms, roomId]);

  // room/date/building 변경 -> slots 조회
  useEffect(() => {
    if (!selectedBuilding?.buildingId || !roomId || !date) return;
    setSelectedSlot(null);
    loadSlots({
      buildingId: Number(selectedBuilding.buildingId),
      roomId: Number(roomId),
      date,
    });
  }, [selectedBuilding, roomId, date]);

  const canSubmit = useMemo(() => {
    if (!selectedBuilding?.buildingId) return false;
    if (!roomId) return false;
    if (!selectedSlot) return false;
    if (!form.tourNm || !form.tourTel || !form.tourPwd) return false;
    if (!/^[0-9]{4}$/.test(form.tourPwd)) return false;
    return true;
  }, [selectedBuilding, roomId, selectedSlot, form]);

  const onSubmit = async () => {
    if (!canSubmit) return alert('필수값 확인 (비번 4자리 포함)');

    try {
      await reservationApi.createTourReservation({
        buildingId: Number(selectedBuilding.buildingId),
        roomId: Number(roomId),
        tourStartAt: selectedSlot.startAt,
        tourEndAt: selectedSlot.endAt,
        tourNm: form.tourNm,
        tourTel: form.tourTel,
        tourPwd: form.tourPwd,
      });
      alert('투어 예약 생성 완료');
      nav('/reservations/tour/list');
    } catch (e) {
      alert(e?.message || '생성 실패');
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <h2>투어 예약</h2>

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

      <section
        style={{
          border: '1px solid #eee',
          borderRadius: 12,
          padding: 12,
          marginTop: 12,
        }}
      >
        <h3 style={{ marginTop: 0 }}>2) 방 / 슬롯 선택</h3>

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
        </div>

        {roomsLoading && <div style={{ marginTop: 8 }}>로딩중...</div>}
        {roomsError && (
          <div style={{ marginTop: 8, color: 'crimson' }}>{roomsError}</div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6 }}>방 선택</div>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={!selectedBuilding}
          >
            <option value="">선택</option>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.roomNm ?? 'Room'} (#{r.roomId})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6 }}>
            슬롯 선택 {slotsLoading ? '(조회중...)' : ''}
          </div>
          {slotsError && (
            <div style={{ color: 'crimson', marginBottom: 6 }}>
              {slotsError}
            </div>
          )}
          <TimeSlotButtons
            slots={slots}
            selectedKey={selectedSlot ? String(selectedSlot.startAt) : ''}
            onSelect={setSelectedSlot}
          />
        </div>

        <h3 style={{ marginTop: 16 }}>3) 예약자 정보</h3>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <input
            placeholder="tourNm"
            value={form.tourNm}
            onChange={(e) => setForm((p) => ({ ...p, tourNm: e.target.value }))}
            disabled={!selectedBuilding}
          />
          <input
            placeholder="tourTel"
            value={form.tourTel}
            onChange={(e) =>
              setForm((p) => ({ ...p, tourTel: e.target.value }))
            }
            disabled={!selectedBuilding}
          />
          <input
            placeholder="tourPwd (숫자 4자리)"
            value={form.tourPwd}
            onChange={(e) =>
              setForm((p) => ({ ...p, tourPwd: e.target.value }))
            }
            disabled={!selectedBuilding}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{ padding: '10px 12px' }}
          >
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
