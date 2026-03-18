// src/features/chat/components/GestureControl.jsx
// ── 기능 ────────────────────────────────────────────────────────────────────
//  ☝️  검지만 펴기        → 검지 끝으로 커서 이동
//  ✌️  V사인 500ms 유지   → 커서 위치 클릭
//  🤏  엄지+검지 벌리기   → 줌인  (연속)
//  🤏  엄지+검지 오므리기 → 줌아웃 (연속)
//  🖐  손 전체 펼치기     → 줌 초기화
// ────────────────────────────────────────────────────────────────────────────

import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './GestureControl.module.css';

/* ═══════════════════════════════════════════════════════════
   유틸
═══════════════════════════════════════════════════════════ */

function dist2d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 손가락 5개 펴짐 여부 [엄지, 검지, 중지, 약지, 새끼]
 * - 엄지: tip(4) 이 mcp(2) 보다 손목에서 멀면 펴짐
 * - 나머지: tip.y < pip.y
 */
function fingerStates(lm) {
  return [
    Math.abs(lm[4].x - lm[0].x) > Math.abs(lm[2].x - lm[0].x),
    lm[8].y < lm[6].y,
    lm[12].y < lm[10].y,
    lm[16].y < lm[14].y,
    lm[20].y < lm[18].y,
  ];
}

/**
 * 제스처 분류
 * 'cursor' | 'click' | 'open' | null
 * (핀치는 거리 기반으로 onResults 에서 직접 처리)
 */
function classifyGesture(lm) {
  const f = fingerStates(lm);
  if (f[0] && f[1] && f[2] && f[3] && f[4]) return 'open'; // 🖐
  if (!f[0] && f[1] && f[2] && !f[3] && !f[4]) return 'click'; // ✌️
  if (!f[0] && f[1] && !f[2] && !f[3] && !f[4]) return 'cursor'; // ☝️
  return null;
}

/* ═══════════════════════════════════════════════════════════
   가상 커서 (전역 DOM 요소)
═══════════════════════════════════════════════════════════ */

let _cursorEl = null;

function getOrCreateCursor() {
  if (_cursorEl) return _cursorEl;
  _cursorEl = document.createElement('div');
  _cursorEl.id = '__gesture_cursor__';
  Object.assign(_cursorEl.style, {
    position: 'fixed',
    zIndex: '999999',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'rgba(217,173,91,0.88)',
    border: '3px solid #fff',
    boxShadow: '0 2px 14px rgba(0,0,0,0.38)',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
    display: 'none',
    transition: 'background 0.12s',
  });
  document.body.appendChild(_cursorEl);
  return _cursorEl;
}

function moveCursor(normX, normY) {
  // 카메라 영상은 미러(좌우 반전) → x 반전
  const x = (1 - normX) * window.innerWidth;
  const y = normY * window.innerHeight;
  const el = getOrCreateCursor();
  el.style.display = 'block';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  return { x, y };
}

function hideCursor() {
  if (_cursorEl) _cursorEl.style.display = 'none';
}

function setCursorColor(color) {
  if (_cursorEl) _cursorEl.style.background = color;
}

function setCursorScale(scale) {
  if (_cursorEl)
    _cursorEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
}

/* ═══════════════════════════════════════════════════════════
   클릭 / 줌
═══════════════════════════════════════════════════════════ */

function fireClick(x, y) {
  const el = document.elementFromPoint(x, y);
  if (el) {
    el.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      })
    );
  }
}

let _zoom = 1;

function applyZoom(delta) {
  _zoom = Math.min(3, Math.max(0.4, _zoom + delta));
  document.body.style.transform = `scale(${_zoom})`;
  document.body.style.transformOrigin = 'top center';
}

function resetZoom() {
  _zoom = 1;
  document.body.style.transform = '';
}

/* ═══════════════════════════════════════════════════════════
   핀치 줌 상수
═══════════════════════════════════════════════════════════ */

// 엄지-검지 거리 (정규화 0~1) 기준
const PINCH_CLOSE_THRESH = 0.08; // 이 이하면 핀치 "닫힘" 진입
const PINCH_OPEN_THRESH = 0.11; // 이 이상이면 핀치 해제
const ZOOM_SENSITIVITY = 3.5; // 거리 변화 대비 줌 배율

/* ═══════════════════════════════════════════════════════════
   컴포넌트
═══════════════════════════════════════════════════════════ */

export default function GestureControl() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|loading|running|error
  const [gesture, setGesture] = useState(null); // 현재 표시용 제스처
  const [toast, setToast] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  // 클릭 홀드
  const clickTimerRef = useRef(null);
  const clickFiredRef = useRef(false);
  const prevGestureRef = useRef(null);

  // 커서 현재 위치 (클릭에 재사용)
  const cursorPosRef = useRef({ x: 0, y: 0 });

  // 핀치 상태
  const prevPinchRef = useRef(null); // 이전 프레임 핀치 거리
  const pinchActiveRef = useRef(false); // 핀치 줌 동작 중 여부
  const toastTimerRef = useRef(null);

  /* ── 토스트 ── */
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 900);
  }, []);

  /* ═══ onResults : 매 프레임 ══════════════════════════════ */
  const onResults = useCallback(
    (results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width,
        H = canvas.height;

      /* ── 캔버스 그리기 (미러) ── */
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(results.image, 0, 0, W, H);
      ctx.restore();

      /* ── 손 없음 ── */
      if (!results.multiHandLandmarks?.length) {
        hideCursor();
        prevPinchRef.current = null;
        pinchActiveRef.current = false;
        clearTimeout(clickTimerRef.current);
        clickFiredRef.current = false;
        prevGestureRef.current = null;
        setGesture(null);
        return;
      }

      const lm = results.multiHandLandmarks[0];

      /* ── 랜드마크 시각화 ── */
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);

      // 뼈대
      (window.HAND_CONNECTIONS || []).forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * W, lm[a].y * H);
        ctx.lineTo(lm[b].x * W, lm[b].y * H);
        ctx.strokeStyle = 'rgba(217,173,91,0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 관절
      lm.forEach((pt, i) => {
        const isTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc(pt.x * W, pt.y * H, isTip ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#d9ad5b' : 'rgba(255,255,255,0.65)';
        ctx.fill();
      });

      // 핀치 라인 (엄지4 ↔ 검지8)
      const pinchDist = dist2d(lm[4], lm[8]);
      const pinchPct = Math.max(0, 1 - pinchDist / PINCH_OPEN_THRESH);
      ctx.beginPath();
      ctx.moveTo(lm[4].x * W, lm[4].y * H);
      ctx.lineTo(lm[8].x * W, lm[8].y * H);
      ctx.strokeStyle = `rgba(100,200,255,${0.3 + pinchPct * 0.6})`;
      ctx.lineWidth = 1.5 + pinchPct * 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 핀치 중점에 원
      const midX = ((lm[4].x + lm[8].x) / 2) * W;
      const midY = ((lm[4].y + lm[8].y) / 2) * H;
      ctx.beginPath();
      ctx.arc(midX, midY, 5 + pinchPct * 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(100,200,255,${0.4 + pinchPct * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      /* ══ 핀치 줌 처리 ══════════════════════════════════════ */
      // 핀치 진입/해제 히스테리시스
      if (pinchDist < PINCH_CLOSE_THRESH) pinchActiveRef.current = true;
      if (pinchDist > PINCH_OPEN_THRESH) pinchActiveRef.current = false;

      if (pinchActiveRef.current && prevPinchRef.current !== null) {
        const delta = (pinchDist - prevPinchRef.current) * ZOOM_SENSITIVITY;
        if (Math.abs(delta) > 0.001) {
          applyZoom(delta);
          const label =
            delta > 0
              ? `🔍 줌인 (${_zoom.toFixed(1)}×)`
              : `🔎 줌아웃 (${_zoom.toFixed(1)}×)`;
          showToast(label);
          setGesture('pinch');
          prevGestureRef.current = 'pinch';
        }
        prevPinchRef.current = pinchDist;
        // 핀치 중엔 커서/클릭 스킵
        hideCursor();
        return;
      }
      prevPinchRef.current = pinchDist;

      /* ══ 일반 제스처 처리 ══════════════════════════════════ */
      const g = classifyGesture(lm);
      setGesture(g);

      /* ── 커서 이동 (검지 끝 기준) ── */
      if (g === 'cursor' || g === 'click') {
        const pos = moveCursor(lm[8].x, lm[8].y);
        cursorPosRef.current = pos;

        if (g === 'click') {
          setCursorColor('rgba(255,80,80,0.92)');
          setCursorScale(1.3);
        } else {
          setCursorColor('rgba(217,173,91,0.88)');
          setCursorScale(1.0);
        }
      } else {
        hideCursor();
      }

      /* ── 클릭 (V사인 500ms 유지) ── */
      if (g === 'click') {
        if (prevGestureRef.current !== 'click') {
          // 방금 V사인으로 진입
          clickFiredRef.current = false;
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = setTimeout(() => {
            if (!clickFiredRef.current) {
              clickFiredRef.current = true;
              const { x, y } = cursorPosRef.current;
              fireClick(x, y);
              showToast('👆 클릭!');
            }
          }, 500);
        }
      } else {
        clearTimeout(clickTimerRef.current);
        if (prevGestureRef.current === 'click') clickFiredRef.current = false;
      }

      /* ── 줌 초기화 (🖐 첫 진입 시) ── */
      if (g === 'open' && prevGestureRef.current !== 'open') {
        resetZoom();
        showToast('↺ 줌 초기화');
      }

      prevGestureRef.current = g;
    },
    [showToast]
  );

  /* ── 스크립트 동적 로드 ── */
  const loadScript = (src) =>
    new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        res();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });

  /* ── 카메라 시작 ── */
  const startCamera = useCallback(async () => {
    setStatus('loading');
    try {
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'
      );
      await loadScript(
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
      );

      const hands = new window.Hands({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.72,
        minTrackingConfidence: 0.65,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      const cam = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 320,
        height: 240,
      });
      await cam.start();
      cameraRef.current = cam;
      setStatus('running');
    } catch (e) {
      console.error('GestureControl error:', e);
      setStatus('error');
    }
  }, [onResults]);

  /* ── 카메라 정지 ── */
  const stopCamera = useCallback(() => {
    clearTimeout(clickTimerRef.current);
    clearTimeout(toastTimerRef.current);
    cameraRef.current?.stop();
    cameraRef.current = null;
    handsRef.current?.close();
    handsRef.current = null;
    hideCursor();
    resetZoom();
    prevPinchRef.current = null;
    pinchActiveRef.current = false;
    prevGestureRef.current = null;
    clickFiredRef.current = false;
    setGesture(null);
    setStatus('idle');
    setToast('');
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      stopCamera();
      setActive(false);
    } else {
      setActive(true);
      startCamera();
    }
  }, [active, startCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ── 제스처 레이블 ── */
  const LABELS = {
    cursor: '☝️ 커서 이동 중',
    click: '✌️ 클릭 준비 (유지 중…)',
    pinch: '🤏 핀치 줌',
    open: '🖐 줌 초기화',
  };

  return (
    <>
      {/* ── 플로팅 버튼 ── */}
      <button
        className={`${styles.gestureFab} ${active ? styles.gestureFabActive : ''}`}
        onClick={toggle}
        aria-label={active ? '손동작 제어 끄기' : '손동작 제어 켜기'}
        title={active ? '손동작 제어 끄기' : '손동작 제어 켜기 (카메라 필요)'}
      >
        {status === 'loading' ? (
          <span className={styles.spinner} />
        ) : (
          <svg
            className={styles.fabIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0" />
            <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
            <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
          </svg>
        )}
        {active && status === 'running' && gesture && (
          <span className={styles.gestureDot} />
        )}
      </button>

      {/* ── 카메라 패널 ── */}
      {active && (
        <div className={styles.cameraPanel}>
          <div className={styles.cameraPanelHeader}>
            <span>🤚 손동작 제어</span>
            <button className={styles.closeBtn} onClick={toggle}>
              ✕
            </button>
          </div>

          <div className={styles.cameraWrap}>
            <video
              ref={videoRef}
              className={styles.hiddenVideo}
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              width={320}
              height={240}
            />

            {status === 'loading' && (
              <div className={styles.overlay}>
                <span className={styles.spinner} />
                <p>AI 모델 로딩 중…</p>
              </div>
            )}
            {status === 'error' && (
              <div className={styles.overlay}>
                <p>⚠️ 카메라 또는 모델 로딩 실패</p>
                <button onClick={startCamera}>다시 시도</button>
              </div>
            )}
            {toast && <div className={styles.toast}>{toast}</div>}
          </div>

          {/* 제스처 상태 */}
          <div className={styles.gestureStatus}>
            <span className={gesture ? styles.gestureOn : styles.gestureOff}>
              {gesture ? LABELS[gesture] : '손을 카메라에 보여주세요'}
            </span>
          </div>

          {/* 가이드 */}
          <ul className={styles.guide}>
            <li>
              ☝️ <b>검지만 펴기</b> — 커서 이동
            </li>
            <li>
              ✌️ <b>V자 유지 0.5초</b> — 클릭
            </li>
            <li>
              🤏 <b>엄지+검지 벌리기</b> — 줌인
            </li>
            <li>
              🤏 <b>엄지+검지 오므리기</b> — 줌아웃
            </li>
            <li>
              🖐 <b>손 펼치기</b> — 줌 초기화
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
