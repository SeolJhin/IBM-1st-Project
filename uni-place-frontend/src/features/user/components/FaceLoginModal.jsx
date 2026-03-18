// src/features/user/components/FaceLoginModal.jsx
//
// 2단계 얼굴 로그인
//  1단계: 얼굴 스캔 → /auth/face/match → 일치 계정 목록 표시
//  2단계: 계정 선택 → /auth/face/select → JWT 발급
//
// 등록 모드: /auth/face/register (JWT 인증 필요)

import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './FaceLoginModal.module.css';

import * as faceapi from '@vladmandic/face-api';

// 모델은 node_modules에서 직접 로드 (public 폴더 불필요)
const MODELS_URL = '/node_modules/@vladmandic/face-api/model';
const API_BASE = '/api';
const SCAN_MS = 300;
const SAMPLES = 40;

/* ── 모델 초기화 ── */
async function initModels() {
  if (initModels._done) return;
  // TensorFlow.js 백엔드 초기화 먼저
  await faceapi.tf.ready();
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
  ]);
  initModels._done = true;
}
initModels._done = false;

/* ── 에러 메시지 변환 ── */
function parseFaceError(e) {
  try {
    const body = JSON.parse(e.message || '');
    const code = body?.errorCode || '';
    if (code === 'FACE_404')
      return '등록된 얼굴 정보가 없습니다.\n마이페이지에서 먼저 얼굴을 등록해 주세요.';
    if (code === 'FACE_401')
      return '얼굴을 인식하지 못했습니다.\n카메라 정면을 바라보고 다시 시도해 주세요.';
    if (code === 'FACE_429')
      return '인식 실패가 반복되어 10분간 잠금되었습니다.\n잠시 후 다시 시도해 주세요.';
    if (body?.message) return body.message;
  } catch {}
  const msg = e.message || '';
  if (msg.includes('404'))
    return '등록된 얼굴 정보가 없습니다.\n마이페이지에서 먼저 얼굴을 등록해 주세요.';
  if (msg.includes('401') || msg.includes('400'))
    return '얼굴을 인식하지 못했습니다.\n카메라 정면을 바라보고 다시 시도해 주세요.';
  if (msg.includes('429')) return '잠시 후 다시 시도해 주세요. (일시 잠금)';
  return '얼굴 인식에 실패했습니다. 다시 시도해 주세요.';
}

/* ── API 헬퍼 ── */
function getToken() {
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}
async function apiPost(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      JSON.stringify({
        errorCode: err.errorCode || err.code,
        message: err.message,
        status: res.status,
      })
    );
  }
  return res.json();
}

/* ── 평균 descriptor ── */
function averageDescriptors(descs) {
  const len = descs[0].length;
  const avg = new Float32Array(len);
  for (const d of descs) for (let i = 0; i < len; i++) avg[i] += d[i];
  for (let i = 0; i < len; i++) avg[i] /= descs.length;
  return avg;
}

/* ════════════════════════════════════════════════════════════
   컴포넌트
════════════════════════════════════════════════════════════ */
export default function FaceLoginModal({ mode = 'login', onSuccess, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const faceApiRef = useRef(null);

  // phase: loading | ready | scanning | select | done | error
  const [phase, setPhase] = useState('loading');
  const [msg, setMsg] = useState('AI 모델 로딩 중…');
  const [progress, setProgress] = useState(0);

  /* ── 초기화 ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMsg('모델 로딩 중… (최초 실행 시 약 10~20초 소요)');
        await initModels();
        if (cancelled) return;
        faceApiRef.current = faceapi;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setPhase('ready');
        setMsg(
          mode === 'register'
            ? '얼굴을 화면에 맞추고 잠시 기다려 주세요.'
            : '얼굴을 화면에 맞춰 주세요.'
        );
      } catch (e) {
        if (!cancelled) {
          setPhase('error');
          setMsg('카메라/모델 오류: ' + e.message);
        }
      }
    })();
    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line

  const scanStartedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'ready') return;
    if (scanStartedRef.current) return; // 중복 실행 방지
    scanStartedRef.current = true;
    setPhase('scanning');
    if (mode === 'login') startLoginScan();
    else startRegisterScan();
  }, [phase]); // eslint-disable-line

  /* ── 얼굴 감지 + 각도 판단 ── */
  const detectFace = useCallback(async () => {
    const faceapi = faceApiRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!faceapi || !video || !canvas) return null;
    const opts = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.3,
    });
    const det = await faceapi
      .detectSingleFace(video, opts)
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    if (!det) return null;
    const dims = faceapi.matchDimensions(canvas, video, true);
    const resized = faceapi.resizeResults(det, dims);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);
    return det; // descriptor 대신 det 전체 반환
  }, []);

  /* ── 고개 방향 판단 (랜드마크 기반) ── */
  // 코 끝(30번)과 얼굴 중심(좌우 눈 중점) x 차이로 판단
  // 미러 캔버스이므로 left/right 반전
  function getHeadYaw(det) {
    const lm = det.landmarks.positions;
    const noseTip = lm[30].x;
    const leftEye = lm[36].x; // 실제 오른눈 (미러)
    const rightEye = lm[45].x; // 실제 왼눈 (미러)
    const eyeCenter = (leftEye + rightEye) / 2;
    const eyeWidth = Math.abs(rightEye - leftEye);
    const ratio = (noseTip - eyeCenter) / eyeWidth; // -: 오른쪽, +: 왼쪽
    if (ratio < -0.12) return 'right'; // 고개 오른쪽
    if (ratio > 0.12) return 'left'; // 고개 왼쪽
    return 'center';
  }

  /* ── 로그인 스캔 → match API → 계정 선택 ── */
  const startLoginScan = useCallback(() => {
    setMsg('얼굴을 인식하는 중…');
    let sent = false;

    timerRef.current = setInterval(async () => {
      if (sent) return;
      const det = await detectFace();
      if (!det || sent) {
        if (!sent)
          setMsg(
            '얼굴을 찾는 중… 카메라 정면을 바라봐 주세요. 조명을 밝게 해주세요.'
          );
        return;
      }

      sent = true;
      clearInterval(timerRef.current);
      timerRef.current = null;
      setMsg('서버에서 확인 중…');

      try {
        const res = await apiPost('/auth/face/match', {
          descriptor: JSON.stringify(Array.from(det.descriptor)),
          deviceId: localStorage.getItem('device_id') || 'face_browser',
        });
        const data = res.data || res;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (data.accounts?.length > 0) {
          await doSelect(data.matchToken, data.accounts[0].userId);
        } else {
          throw new Error('계정 정보를 불러오지 못했습니다.');
        }
      } catch (e) {
        setPhase('error');
        setMsg(parseFaceError(e));
      }
    }, SCAN_MS);
  }, [detectFace]); // eslint-disable-line

  /* ── 계정 선택 후 JWT 발급 ── */
  const doSelect = useCallback(
    async (token, userId) => {
      try {
        const res = await apiPost('/auth/face/select', {
          matchToken: token,
          userId,
          deviceId: localStorage.getItem('device_id') || 'face_browser',
        });
        const data = res.data || res;
        if (data?.accessToken)
          localStorage.setItem('access_token', data.accessToken);
        if (data?.refreshToken)
          localStorage.setItem('refresh_token', data.refreshToken);
        if (data?.deviceId) localStorage.setItem('device_id', data.deviceId);

        setPhase('done');
        setMsg('✅ 로그인 성공!');
        setTimeout(() => onSuccess && onSuccess(), 700);
      } catch (e) {
        setPhase('error');
        setMsg(parseFaceError(e));
      }
    },
    [onSuccess]
  );

  /* ── 등록 스캔 ── */
  const startRegisterScan = useCallback(() => {
    setMsg('📷 정면을 바라봐 주세요. (최대 5개 등록 가능)');
    const collected = [];

    // 단계별 안내 메시지
    const getGuideMsg = (count) => {
      const pct = count / SAMPLES;
      if (pct < 0.3) return '📷 정면을 바라봐 주세요.';
      if (pct < 0.55) return '↙️ 살짝 왼쪽으로 고개를 돌려주세요.';
      if (pct < 0.8) return '↗️ 살짝 오른쪽으로 고개를 돌려주세요.';
      return '✅ 거의 완료됐어요! 정면을 봐주세요.';
    };

    // 단계별 필요 각도
    const getRequiredYaw = (count) => {
      const pct = count / SAMPLES;
      if (pct < 0.3) return 'center';
      if (pct < 0.55) return 'left';
      if (pct < 0.8) return 'right';
      return 'center';
    };

    timerRef.current = setInterval(async () => {
      const det = await detectFace();
      if (!det) return;

      const yaw = getHeadYaw(det);
      const required = getRequiredYaw(collected.length);

      // 요구 각도와 다르면 수집 안 하고 안내만
      if (yaw !== required) {
        const guide =
          required === 'center'
            ? '📷 정면을 바라봐 주세요.'
            : required === 'left'
              ? '↙️ 왼쪽으로 고개를 살짝 돌려주세요.'
              : '↗️ 오른쪽으로 고개를 살짝 돌려주세요.';
        setMsg(`${guide}  (${collected.length}/${SAMPLES})`);
        return;
      }

      collected.push(det.descriptor);
      const pct = Math.round((collected.length / SAMPLES) * 100);
      setProgress(pct);
      setMsg(
        `${getGuideMsg(collected.length)}  (${collected.length}/${SAMPLES})`
      );

      if (collected.length >= SAMPLES) {
        clearInterval(timerRef.current);
        setMsg('서버에 등록 중…');
        try {
          await apiPost(
            '/auth/face/register',
            {
              descriptor: JSON.stringify(
                Array.from(averageDescriptors(collected))
              ),
            },
            true
          );
          streamRef.current?.getTracks().forEach((t) => t.stop());
          setPhase('done');
          setMsg('✅ 얼굴 등록 완료!');
          setTimeout(() => onSuccess && onSuccess(), 700);
        } catch (e) {
          setPhase('error');
          setMsg(`등록 실패: ${parseFaceError(e)}`);
        }
      }
    }, SCAN_MS);
  }, [detectFace, onSuccess]);

  const hideCam = phase === 'done';

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>👤</span>
          <span className={styles.headerTitle}>
            {mode === 'register' ? '얼굴 등록' : '얼굴 인식 로그인'}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* 카메라 뷰 (계정 선택/완료 단계엔 숨김) */}
        {!hideCam && (
          <div className={styles.camWrap}>
            <video
              ref={videoRef}
              className={styles.video}
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              style={{ transform: 'scaleX(-1)' }}
            />
            <div
              className={`${styles.faceGuide} ${phase === 'done' ? styles.faceGuideDone : ''}`}
            />
            {phase === 'scanning' && <div className={styles.scanLine} />}
            {phase === 'loading' && (
              <div className={styles.overlay}>
                <span className={styles.spinner} />
                <p>AI 모델 로딩 중…</p>
              </div>
            )}
            {phase === 'done' && (
              <div className={styles.overlayDone}>
                <span className={styles.doneCheck}>✓</span>
              </div>
            )}
            {phase === 'error' && (
              <div className={styles.overlayError}>
                <span>⚠️</span>
                <p>{msg}</p>
              </div>
            )}
          </div>
        )}

        {/* 진행률 바 */}
        {mode === 'register' && phase === 'scanning' && (
          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* 메시지 */}
        {
          <p
            className={`${styles.msg} ${phase === 'done' ? styles.msgDone : ''} ${phase === 'error' ? styles.msgError : ''}`}
          >
            {msg}
          </p>
        }

        {phase === 'error' && (
          <button className={styles.retryBtn} onClick={onClose}>
            닫기
          </button>
        )}

        {(phase === 'ready' || phase === 'scanning') && (
          <p className={styles.secNote}>
            🔒 얼굴 데이터는 서버에 AES-256 암호화되어 저장됩니다
          </p>
        )}
      </div>
    </div>
  );
}
