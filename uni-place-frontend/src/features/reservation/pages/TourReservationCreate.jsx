// features/reservation/pages/TourReservationCreate.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { propertyApi } from '../../property/api/propertyApi';
import { reservationApi } from '../api/reservationApi';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';

import BuildingSlotButtons from '../components/BuildingSlotButtons';
import TimeSlotButtons from '../components/TimeSlotButtons';
import styles from './TourReservationCreate.module.css';

export default function TourReservationCreate() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // URL에서 자동 선택값 읽기
  const initRoomId = searchParams.get('roomId')
    ? String(searchParams.get('roomId'))
    : '';
  const initBuildingId = searchParams.get('buildingId')
    ? Number(searchParams.get('buildingId'))
    : null;

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
  const [roomId, setRoomId] = useState(initRoomId);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({ tourNm: '', tourTel: '', tourPwd: '' });

  // 빌딩 목록 로드
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

  // 빌딩 목록 로드 후 URL buildingId로 자동 선택
  useEffect(() => {
    if (!initBuildingId || !buildings.length) return;
    const found = buildings.find(
      (b) => Number(b.buildingId) === initBuildingId
    );
    if (found && !selectedBuilding) setSelectedBuilding(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, initBuildingId]);

  // 빌딩 선택 → 방 목록 로드
  const loadRooms = async (buildingId) => {
    if (!buildingId) return;
    setRoomsLoading(true);
    setRoomsError('');
    try {
      const page = await reservationApi.reservableRooms({
        buildingId,
        page: 1,
        size: 50,
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

  // 빌딩 선택 → 방 목록 로드
  useEffect(() => {
    if (!selectedBuilding?.buildingId) return;
    setSelectedSlot(null);
    setSlots([]);
    loadRooms(Number(selectedBuilding.buildingId));
    // URL에서 온 roomId는 유지, 다른 건물 수동 선택 시 초기화
    if (
      initBuildingId &&
      Number(selectedBuilding.buildingId) !== initBuildingId
    ) {
      setRoomId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuilding]);

  // rooms 로드 후 URL roomId 자동 선택 (없으면 첫 번째)
  useEffect(() => {
    if (!rooms.length) return;
    if (initRoomId && rooms.find((r) => String(r.roomId) === initRoomId)) {
      setRoomId(initRoomId);
    } else if (!roomId) {
      setRoomId(String(rooms[0].roomId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  // roomId/date/building 변경 → slots 조회
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

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
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
      nav('/reservations/tour/list');
    } catch (e) {
      alert(e?.message || '생성 실패');
    }
  };

  const selectedRoomInfo = rooms.find(
    (r) => String(r.roomId) === String(roomId)
  );

  return (
    <div className={styles.page}>
      <Header />
      {/* 헤더 */}
      <div className={styles.topBar}>
        <button
          className={styles.backBtn}
          type="button"
          onClick={() => nav(-1)}
        >
          ←
        </button>
        <h1 className={styles.pageTitle}>📅 방문 예약</h1>
        <button
          className={styles.listLink}
          type="button"
          onClick={() => nav('/reservations/tour/list')}
        >
          내 예약 조회
        </button>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        {/* ── 1. 건물 선택 ── */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>1. 건물 선택</h2>
            <button
              className={styles.refreshBtn}
              type="button"
              onClick={loadBuildings}
              disabled={bLoading}
            >
              {bLoading ? '조회중…' : '새로고침'}
            </button>
          </div>
          {bError && <p className={styles.errMsg}>{bError}</p>}
          <BuildingSlotButtons
            buildings={buildings}
            selectedId={selectedBuilding?.buildingId}
            onSelect={setSelectedBuilding}
          />
          {selectedBuilding && (
            <p className={styles.selectedHint}>
              선택됨: <strong>{selectedBuilding.buildingNm}</strong>
            </p>
          )}
        </section>

        {/* ── 2. 방 · 날짜 · 슬롯 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. 방 · 날짜 · 시간 선택</h2>

          <div className={styles.rowGroup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>날짜</label>
              <input
                className={styles.input}
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                disabled={!selectedBuilding}
              />
            </div>
          </div>

          {roomsLoading && <p className={styles.mutedMsg}>방 목록 조회 중…</p>}
          {roomsError && <p className={styles.errMsg}>{roomsError}</p>}

          <div className={styles.formGroup}>
            <label className={styles.label}>방 선택</label>
            {selectedRoomInfo && (
              <p className={styles.autoSelectedBadge}>
                🏠 자동 선택:{' '}
                {selectedRoomInfo.roomNm ?? `Room #${selectedRoomInfo.roomId}`}
              </p>
            )}
            <select
              className={styles.select}
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={!selectedBuilding}
            >
              <option value="">선택하세요</option>
              {rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.roomNm ?? 'Room'} (#{r.roomId})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              예약 가능 시간{' '}
              {slotsLoading && (
                <span className={styles.mutedInline}>(조회중…)</span>
              )}
            </label>
            {slotsError && <p className={styles.errMsg}>{slotsError}</p>}
            <TimeSlotButtons
              slots={slots}
              selectedKey={selectedSlot ? String(selectedSlot.startAt) : ''}
              onSelect={setSelectedSlot}
            />
          </div>
        </section>

        {/* ── 3. 예약자 정보 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. 예약자 정보</h2>
          <div className={styles.rowGroup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>이름 *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="방문자 이름"
                value={form.tourNm}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tourNm: e.target.value }))
                }
                disabled={!selectedBuilding}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>연락처 *</label>
              <input
                className={styles.input}
                type="tel"
                placeholder="010-0000-0000"
                value={form.tourTel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tourTel: e.target.value }))
                }
                disabled={!selectedBuilding}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>예약 비밀번호 (숫자 4자리) *</label>
            <input
              className={styles.input}
              type="password"
              placeholder="조회·취소 시 사용"
              value={form.tourPwd}
              maxLength={4}
              pattern="\d{4}"
              onChange={(e) =>
                setForm((p) => ({ ...p, tourPwd: e.target.value }))
              }
              disabled={!selectedBuilding}
              style={{ maxWidth: 180 }}
            />
            <p className={styles.inputHint}>예약 조회 및 취소 시 사용합니다.</p>
          </div>
        </section>

        {/* 예약 요약 */}
        {selectedSlot && selectedRoomInfo && (
          <div className={styles.summaryBox}>
            <p className={styles.summaryTitle}>📋 예약 요약</p>
            <div className={styles.summaryGrid}>
              <span>건물</span>
              <span>{selectedBuilding.buildingNm}</span>
              <span>방</span>
              <span>
                {selectedRoomInfo.roomNm ?? `#${selectedRoomInfo.roomId}`}
              </span>
              <span>날짜</span>
              <span>{date}</span>
              <span>시간</span>
              <span>
                {selectedSlot.startAt?.slice(11, 16)} ~{' '}
                {selectedSlot.endAt?.slice(11, 16)}
              </span>
            </div>
          </div>
        )}

        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => nav(-1)}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!canSubmit}
          >
            📅 예약 신청
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
