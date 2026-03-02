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
import { toKoreanMessage } from '../../../app/http/errorMapper';

/**
 * inlineMode=true  → Header/Footer/topBar 없이 컨텐츠만 렌더 (마이페이지 탭 용)
 * inlineMode=false → 기존 독립 페이지로 렌더 (직접 URL 접근 시)
 * onSuccess        → inlineMode에서 예약 완료 후 콜백 (예: 조회탭으로 전환)
 */
export default function SpaceReservationCreate({
  inlineMode = false,
  onSuccess,
  initSpaceId: propSpaceId,
  initBuildingId: propBuildingId,
}) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // URL 파라미터 (독립 페이지용) 또는 props (인라인용)
  const initSpaceId =
    propSpaceId ??
    (searchParams.get('spaceId') ? Number(searchParams.get('spaceId')) : null);
  const initBuildingId =
    propBuildingId ??
    (searchParams.get('buildingId')
      ? Number(searchParams.get('buildingId'))
      : null);

  // 로그인 필수 (독립 페이지일 때만 리다이렉트)
  useEffect(() => {
    if (!inlineMode && !authLoading && !user) {
      nav('/login', {
        state: { from: window.location.pathname + window.location.search },
      });
    }
  }, [authLoading, user, nav, inlineMode]);

  const [buildings, setBuildings] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [spacesPage, setSpacesPage] = useState(null);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesError, setSpacesError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const spaces = useMemo(() => spacesPage?.content ?? [], [spacesPage]);

  const [spaceId, setSpaceId] = useState(
    initSpaceId ? String(initSpaceId) : ''
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [srNoPeople, setSrNoPeople] = useState(1);

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

  useEffect(() => {
    if (!initBuildingId || !buildings.length) return;
    const found = buildings.find(
      (b) => Number(b.buildingId) === initBuildingId
    );
    if (found && !selectedBuilding) setSelectedBuilding(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, initBuildingId]);

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
    if (
      initBuildingId &&
      Number(selectedBuilding.buildingId) !== initBuildingId
    )
      setSpaceId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuilding, date]);

  useEffect(() => {
    if (!spaces.length) return;
    if (initSpaceId && spaces.find((s) => s.spaceId === initSpaceId)) {
      setSpaceId(String(initSpaceId));
    } else if (!spaceId) {
      setSpaceId(String(spaces[0].spaceId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [spaceId]);

  const currentSpace = useMemo(
    () => spaces.find((s) => String(s.spaceId) === String(spaceId)),
    [spaces, spaceId]
  );
  const availableSlots = currentSpace?.availableSlots ?? [];

  const [confirmOpen, setConfirmOpen] = useState(false);

  const canSubmit = useMemo(() => {
    if (!selectedBuilding?.buildingId) return false;
    if (!spaceId) return false;
    if (!selectedSlot) return false;
    if (!srNoPeople || srNoPeople < 1) return false;
    return true;
  }, [selectedBuilding, spaceId, selectedSlot, srNoPeople]);

  const doCreateReservation = async () => {
    const maxCap = currentSpace?.spaceCapacity;
    if (maxCap && Number(srNoPeople) > maxCap) {
      setSubmitError(`예약 인원이 최대 수용 인원(${maxCap}명)을 초과합니다.`);
      return;
    }
    try {
      await reservationApi.createSpaceReservation({
        buildingId: Number(selectedBuilding.buildingId),
        spaceId: Number(spaceId),
        srStartAt: selectedSlot.startAt,
        srEndAt: selectedSlot.endAt,
        srNoPeople: Number(srNoPeople),
      });
      if (inlineMode && onSuccess) {
        onSuccess();
      } else {
        nav('/me?tab=space&sub=list');
      }
    } catch (e) {
      setSubmitError(toKoreanMessage(e));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  // ── 폼 내용 (공통) ──────────────────────────────────────────
  const formContent = (
    <form
      className={inlineMode ? styles.formInline : styles.form}
      onSubmit={onSubmit}
    >
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

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. 공용공간 · 날짜 · 시간 선택</h2>
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
        {spacesLoading && <p className={styles.mutedMsg}>공용공간 조회 중…</p>}
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

      {submitError && (
        <div className={styles.submitError}>⚠️ {submitError}</div>
      )}
      <div className={styles.btnRow}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => (inlineMode ? null : nav(-1))}
        >
          {inlineMode ? '초기화' : '취소'}
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!canSubmit}
        >
          📅 예약 확정
        </button>
      </div>

      {/* 예약 확인 다이얼로그 */}
      {confirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              minWidth: '300px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: '0 0 8px',
                fontSize: '16px',
                fontWeight: '800',
                color: '#2d2416',
              }}
            >
              예약을 확정하시겠습니까?
            </p>
            {selectedSlot && currentSpace && (
              <p
                style={{
                  margin: '0 0 20px',
                  fontSize: '13px',
                  color: '#7a6a50',
                }}
              >
                {currentSpace.spaceNm} · {selectedSlot.startAt?.slice(11, 16)}~
                {selectedSlot.endAt?.slice(11, 16)} · {srNoPeople}명
              </p>
            )}
            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
            >
              <button
                type="button"
                style={{
                  minWidth: '80px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1.5px solid #ccc',
                  background: '#fff',
                  color: '#666',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                onClick={() => setConfirmOpen(false)}
              >
                아니오
              </button>
              <button
                type="button"
                style={{
                  minWidth: '80px',
                  height: '40px',
                  borderRadius: '10px',
                  border: 0,
                  background: '#c58a3a',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setConfirmOpen(false);
                  doCreateReservation();
                }}
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );

  // ── 인라인 모드: 래퍼 없이 바로 폼 반환 ──────────────────────
  if (inlineMode) {
    if (authLoading)
      return (
        <div className={styles.centerBox}>
          <span className={styles.spinner} />
        </div>
      );
    return formContent;
  }

  // ── 독립 페이지 모드 ──────────────────────────────────────────
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
          onClick={() => nav('/me?tab=space')}
        >
          내 예약 목록
        </button>
      </div>
      {formContent}
      <Footer />
    </div>
  );
}
