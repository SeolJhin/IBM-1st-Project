// src/features/admin/pages/inspection/AdminInspectionDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inspectionApi } from '../../api/inspectionApi';
import styles from './AdminInspectionDetail.module.css';

const SEVERITY_LABEL = {
  low: { text: '낮음', color: '#16a34a' },
  medium: { text: '중간', color: '#d97706' },
  high: { text: '높음', color: '#ea580c' },
  critical: { text: '위험!', color: '#dc2626' },
};

const TICKET_STATUS_OPTIONS = [
  { value: 'open', label: '처리 대기' },
  { value: 'in_progress', label: '처리 중' },
  { value: 'resolved', label: '처리 완료' },
  { value: 'closed', label: '종료' },
];

const STATUS_LABEL = {
  completed: { text: '완료', color: '#16a34a' },
  issue_detected: { text: '문제 감지', color: '#dc2626' },
  no_change: { text: '변화 없음', color: '#6b7280' },
};

const ISSUE_TYPE_LABEL = {
  wall_crack: '벽 균열',
  water_leak: '누수',
  ceiling_stain: '천장 얼룩',
  broken_light: '조명 파손',
  structural_damage: '구조적 손상',
  paint_peeling: '도장 벗겨짐',
  mold: '곰팡이',
  floor_damage: '바닥 손상',
  window_damage: '창문 손상',
  door_damage: '문 손상',
  general_wear: '일반 노후화',
  room_disorder: '객실 무단 훼손',
  furniture_damage: '가구 손상',
  trash_left: '쓰레기 방치',
  stain_on_surface: '표면 오염',
  missing_item: '비품 분실',
  unauthorized_use: '무단 사용',
};

export default function AdminInspectionDetail() {
  const { inspectionId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await inspectionApi.getInspection(Number(inspectionId));
        setData(result);
      } catch (e) {
        setError(e?.message || '점검 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [inspectionId]);

  const handleDelete = async () => {
    if (
      !window.confirm(
        `점검 #${data.inspectionId}을 삭제할까요?\n관련 티켓과 이미지도 함께 삭제됩니다.`
      )
    )
      return;
    setDeleting(true);
    try {
      await inspectionApi.deleteInspection(data.inspectionId);
      navigate('/admin/inspections');
    } catch (e) {
      alert('삭제 실패: ' + (e?.message || ''));
    } finally {
      setDeleting(false);
    }
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    setUpdatingTicket(ticketId);
    try {
      const updated = await inspectionApi.updateTicketStatus(
        ticketId,
        newStatus
      );
      setData((prev) => ({
        ...prev,
        tickets: prev.tickets.map((t) =>
          t.ticketId === ticketId ? updated : t
        ),
      }));
    } catch (e) {
      alert('상태 변경 실패: ' + (e?.message || ''));
    } finally {
      setUpdatingTicket(null);
    }
  };

  if (loading) return <div className={styles.center}>불러오는 중...</div>;
  if (error) return <div className={styles.errorBox}>{error}</div>;
  if (!data) return null;

  const st = STATUS_LABEL[data.inspectionStatus] ?? {
    text: data.inspectionStatus,
    color: '#6b7280',
  };

  return (
    <div className={styles.wrap}>
      {/* 뒤로가기 + 삭제 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← 목록으로
        </button>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? '삭제 중...' : '🗑 점검 삭제'}
        </button>
      </div>

      {/* 기본 정보 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>점검 #{data.inspectionId}</h2>
          <span
            className={styles.badge}
            style={{ color: st.color, borderColor: st.color }}
          >
            {st.text}
          </span>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span>공간 종류</span>
            <b>{data.spaceType}</b>
          </div>
          <div className={styles.infoItem}>
            <span>공간 ID</span>
            <b>{data.spaceId}</b>
          </div>
          <div className={styles.infoItem}>
            <span>변화율</span>
            <b>
              {data.changePercent != null
                ? `${Number(data.changePercent).toFixed(2)}%`
                : '-'}
            </b>
          </div>
          <div className={styles.infoItem}>
            <span>점검 일시</span>
            <b>
              {data.createdAt
                ? new Date(data.createdAt).toLocaleString('ko-KR')
                : '-'}
            </b>
          </div>
          {data.inspectionMemo && (
            <div className={styles.infoItem} style={{ gridColumn: '1/-1' }}>
              <span>점검 메모</span>
              <b>{data.inspectionMemo}</b>
            </div>
          )}
        </div>
      </div>

      {/* AI 분석 요약 */}
      {data.aiSummary && (
        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>🤖 AI 분석 요약</h3>
          <p className={styles.aiSummary}>{data.aiSummary}</p>
        </div>
      )}

      {/* 이미지 비교 */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>📸 점검 이미지</h3>
        <div className={styles.imageRow}>
          <div className={styles.imageBox}>
            <p className={styles.imageLabel}>이전 점검 (Before)</p>
            {data.beforeFileId ? (
              <img
                src={`/api/files/${data.beforeFileId}/view`}
                alt="이전 점검"
                className={`${styles.image} ${styles.imageClickable}`}
                onClick={() =>
                  setLightbox({
                    src: `/api/files/${data.beforeFileId}/view`,
                    label: '이전 점검 (Before)',
                  })
                }
              />
            ) : (
              <div className={styles.noImage}>첫 번째 점검 (Before 없음)</div>
            )}
          </div>
          <div className={styles.imageBox}>
            <p className={styles.imageLabel}>이번 점검 (After)</p>
            <img
              src={`/api/files/${data.afterFileId}/view`}
              alt="이번 점검"
              className={`${styles.image} ${styles.imageClickable}`}
              onClick={() =>
                setLightbox({
                  src: `/api/files/${data.afterFileId}/view`,
                  label: '이번 점검 (After)',
                })
              }
            />
          </div>
        </div>
      </div>

      {/* 유지보수 티켓 */}
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>🔧 유지보수 티켓</h3>
        {!data.tickets || data.tickets.length === 0 ? (
          <p className={styles.noTicket}>감지된 문제가 없습니다.</p>
        ) : (
          <div className={styles.ticketList}>
            {data.tickets.map((ticket) => {
              const sev = SEVERITY_LABEL[ticket.severity] ?? {
                text: ticket.severity,
                color: '#6b7280',
              };
              return (
                <div key={ticket.ticketId} className={styles.ticketCard}>
                  <div className={styles.ticketHeader}>
                    <span className={styles.issueType}>
                      {ISSUE_TYPE_LABEL[ticket.issueType] ?? ticket.issueType}
                    </span>
                    <span
                      className={styles.badge}
                      style={{ color: sev.color, borderColor: sev.color }}
                    >
                      {sev.text}
                    </span>
                  </div>
                  <p className={styles.ticketDesc}>{ticket.description}</p>
                  <div className={styles.ticketFooter}>
                    <span className={styles.ticketLabel}>처리 상태</span>
                    <select
                      value={ticket.ticketStatus}
                      disabled={updatingTicket === ticket.ticketId}
                      onChange={(e) =>
                        handleTicketStatusChange(
                          ticket.ticketId,
                          e.target.value
                        )
                      }
                      className={styles.statusSelect}
                    >
                      {TICKET_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {updatingTicket === ticket.ticketId && (
                      <span className={styles.saving}>저장 중...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 이미지 라이트박스 */}
      {lightbox && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightbox(null)}
        >
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.lightboxHeader}>
              <span className={styles.lightboxLabel}>{lightbox.label}</span>
              <button
                className={styles.lightboxClose}
                onClick={() => setLightbox(null)}
              >
                ✕
              </button>
            </div>
            <img
              src={lightbox.src}
              alt={lightbox.label}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
