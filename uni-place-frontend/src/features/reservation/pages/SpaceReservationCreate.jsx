// features/reservation/pages/SpaceReservationCreate.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { propertyApi } from '../../property/api/propertyApi';
import { reservationApi } from '../api/reservationApi';
import { useAuth } from '../../user/hooks/useAuth';
import Header from '../../../app/layouts/components/Header';
import Footer from '../../../app/layouts/components/Footer';

import BuildingSlotButtons from '../components/BuildingSlotButtons';
import TimeSlotButtons from '../components/TimeSlotButtons';
import styles from './SpaceReservationCreate.module.css';

export default function SpaceReservationCreate() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // URL 파라미터
  const initSpaceId = searchParams.get('spaceId')
    ? Number(searchParams.get('spaceId'))
    : null;
  const initBuildingId = searchParams.get('buildingId')
    ? Number(searchParams.get('buildingId'))
    : null;

  // 로그인 필수 → 미인증 시 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      nav('/login', {
        state: { from: window.location.pathname + window.location.search },
      });
    }
  }, [authLoading, user, nav]);

  // 빌딩
  const [buildings, setBuildings] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // spaces
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [spacesPage, setSpacesPage] = useState(null);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesError, setSpacesError] = useState('');
  const spaces = spacesPage?.content ?? [];

  const [spaceId, setSpaceId] = useState(
    initSpaceId ? String(initSpaceId) : ''
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [srNoPeople, setSrNoPeople] = useState(1);

  // 빌딩 목록
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

  // 빌딩 목록 로드 후 URL buildingId 자동 선택
  useEffect(() => {
    if (!initBuildingId || !buildings.length) return;
    const found = buildings.find(
      (b) => Number(b.buildingId) === initBuildingId
    );
    if (found && !selectedBuilding) setSelectedBuilding(found);
  }, [buildings, initBuildingId]);

  // 빌딩 선택 또는 날짜 변경 → spaces 조회
  const loadSpaces = async (buildingId, targetDate) => {
    if (!buildingId || !targetDate) return;
    setSpacesLoading(true);
    setSpacesError('');
    try {
      const page = await reservationApi.reservableSpaces({
        buildingId,
        date: targetDate,
        page: 1,
        size: 50,
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
    setSelectedSlot(null);
    loadSpaces(Number(selectedBuilding.buildingId), date);
    // 다른 건물 수동 선택 시 spaceId 초기화
    if (
      initBuildingId &&
      Number(selectedBuilding.buildingId) !== initBuildingId
    ) {
      setSpaceId('');
    }
  }, [selectedBuilding, date]);

  // spaces 로드 후 URL spaceId 자동 선택 (없으면 첫 번째)
  useEffect(() => {
    if (!spaces.length) return;
    if (initSpaceId && spaces.find((s) => s.spaceId === initSpaceId)) {
      setSpaceId(String(initSpaceId));
    } else if (!spaceId) {
      setSpaceId(String(spaces[0].spaceId));
    }
  }, [spaces]);

  // spaceId 변경 → slot 초기화
  useEffect(() => {
    setSelectedSlot(null);
  }, [spaceId]);

  const currentSpace = useMemo(
    () => spaces.find((s) => String(s.spaceId) === String(spaceId)),
    [spaces, spaceId]
  );
  const availableSlots = currentSpace?.availableSlots ?? [];

  const canSubmit = useMemo(() => {
    if (!selectedBuilding?.buildingId) return false;
    if (!spaceId) return false;
    if (!selectedSlot) return false;
    if (!srNoPeople || srNoPeople < 1) return false;
    return true;
  }, [selectedBuilding, spaceId, selectedSlot, srNoPeople]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const maxCap = currentSpace?.spaceCapacity;
    if (maxCap && Number(srNoPeople) > maxCap) {
      return alert(`최대 인원은 ${maxCap}명입니다.`);
    }
    try {
      await reservationApi.createSpaceReservation({
        buildingId: Number(selectedBuilding.buildingId),
        spaceId: Number(spaceId),
        srStartAt: selectedSlot.startAt,
        srEndAt: selectedSlot.endAt,
        srNoPeople: Number(srNoPeople),
      });
      nav('/reservations/space/list');
    } catch (e) {
      alert(e?.message || '생성 실패');
    }
  };

  if (authLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.centerBox}>
          <span className={styles.spinner} />
        </div>
        <Footer />
      </div>
    );
  }

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
        <h1 className={styles.pageTitle}>🛋️ 공용공간 예약</h1>
        <button
          className={styles.listLink}
          type="button"
          onClick={() => nav('/reservations/space/list')}
        >
          내 예약 목록
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

        {/* ── 2. 공용공간 · 날짜 · 슬롯 ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            2. 공용공간 · 날짜 · 시간 선택
          </h2>

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
            <div className={styles.formGroup}>
              <label className={styles.label}>
                이용 인원
                {currentSpace?.spaceCapacity
                  ? ` (최대 ${currentSpace.spaceCapacity}명)`
                  : ''}
              </label>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={currentSpace?.spaceCapacity || 99}
                value={srNoPeople}
                onChange={(e) => setSrNoPeople(Number(e.target.value))}
                disabled={!selectedBuilding}
                style={{ maxWidth: 100 }}
              />
            </div>
          </div>

          {spacesLoading && (
            <p className={styles.mutedMsg}>공용공간 조회 중…</p>
          )}
          {spacesError && <p className={styles.errMsg}>{spacesError}</p>}

          <div className={styles.formGroup}>
            <label className={styles.label}>공용공간 선택</label>
            {currentSpace &&
              initSpaceId &&
              String(currentSpace.spaceId) === String(initSpaceId) && (
                <p className={styles.autoSelectedBadge}>
                  🛋️ 자동 선택: {currentSpace.spaceNm}
                </p>
              )}
            <select
              className={styles.select}
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              disabled={!selectedBuilding}
            >
              <option value="">선택하세요</option>
              {spaces.map((s) => (
                <option key={s.spaceId} value={s.spaceId}>
                  {s.spaceNm ?? '공용공간'} (#{s.spaceId})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>예약 가능 시간</label>
            <TimeSlotButtons
              slots={availableSlots}
              selectedKey={selectedSlot ? String(selectedSlot.startAt) : ''}
              onSelect={setSelectedSlot}
            />
          </div>
        </section>

        {/* 예약 요약 */}
        {selectedSlot && currentSpace && (
          <div className={styles.summaryBox}>
            <p className={styles.summaryTitle}>📋 예약 요약</p>
            <div className={styles.summaryGrid}>
              <span>건물</span>
              <span>{selectedBuilding.buildingNm}</span>
              <span>공용공간</span>
              <span>{currentSpace.spaceNm}</span>
              <span>날짜</span>
              <span>{date}</span>
              <span>시간</span>
              <span>
                {selectedSlot.startAt?.slice(11, 16)} ~{' '}
                {selectedSlot.endAt?.slice(11, 16)}
              </span>
              <span>인원</span>
              <span>{srNoPeople}명</span>
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
            📅 예약 확정
          </button>
        </div>
      </form>
      <Footer />
    </div>
  );
}
