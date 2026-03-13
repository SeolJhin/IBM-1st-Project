// src/features/admin/pages/inspection/AdminOpenTickets.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionApi } from '../../api/inspectionApi';
import styles from './AdminInspectionList.module.css';

const SEVERITY_LABEL = {
  low: { text: '낮음', color: '#16a34a' },
  medium: { text: '중간', color: '#d97706' },
  high: { text: '높음', color: '#ea580c' },
  critical: { text: '위험', color: '#dc2626' },
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

// 변경 가능한 상태 목록 (closed 제외 - closed는 목록에서 사라지므로 select에서 선택 시 처리)
const STATUS_OPTIONS = [
  { value: 'open', label: '미처리' },
  { value: 'in_progress', label: '처리 중' },
  { value: 'resolved', label: '처리 완료' },
  { value: 'closed', label: '종료/삭제' },
];

export default function AdminOpenTickets() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inspectionApi.getOpenTickets({ page, size: 10 });
      setRows(data?.content ?? []);
      setMeta({ totalPages: data?.totalPages ?? 1 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      await inspectionApi.updateTicketStatus(ticketId, newStatus);
      if (newStatus === 'closed') {
        // 종료 상태일 때만 목록에서 제거
        setRows((prev) => prev.filter((t) => t.ticketId !== ticketId));
      } else {
        // 그 외는 해당 행의 상태만 업데이트
        setRows((prev) =>
          prev.map((t) =>
            t.ticketId === ticketId ? { ...t, ticketStatus: newStatus } : t
          )
        );
      }
    } catch (e) {
      alert('변경 실패: ' + (e?.message || ''));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div>
          <h2 className={styles.title}>하자 관리</h2>
          <p className={styles.sub}>AI가 감지한 시설 하자 목록입니다.</p>
        </div>
        <button
          className={styles.btnCreate}
          onClick={() => navigate('/admin/inspections')}
        >
          ← 점검 목록
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>티켓 ID</th>
              <th>점검 ID</th>
              <th>공간</th>
              <th>문제 유형</th>
              <th>심각도</th>
              <th>설명</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className={styles.center}>
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.center}>
                  하자 접수 내역이 없습니다 ✅
                </td>
              </tr>
            ) : (
              rows.map((t) => {
                const sev = SEVERITY_LABEL[t.severity] ?? {
                  text: t.severity,
                  color: '#6b7280',
                };
                return (
                  <tr key={t.ticketId}>
                    <td>{t.ticketId}</td>
                    <td>
                      <button
                        className={styles.btnDetail}
                        onClick={() =>
                          navigate(`/admin/inspections/${t.inspectionId}`)
                        }
                      >
                        #{t.inspectionId}
                      </button>
                    </td>
                    <td>
                      {t.spaceType} {t.spaceId}
                    </td>
                    <td>{ISSUE_TYPE_LABEL[t.issueType] ?? t.issueType}</td>
                    <td>
                      <span
                        className={styles.badge}
                        style={{ color: sev.color, borderColor: sev.color }}
                      >
                        {sev.text}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, fontSize: 13 }}>
                      {t.description}
                    </td>
                    <td>
                      {/* value를 ticketStatus로 바인딩 → 현재 상태가 select에 표시됨 */}
                      <select
                        disabled={updatingId === t.ticketId}
                        value={t.ticketStatus ?? 'open'}
                        onChange={(e) =>
                          handleStatusChange(t.ticketId, e.target.value)
                        }
                        className={styles.btnDetail}
                        style={{ cursor: 'pointer' }}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paging}>
        <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          ◀ 이전
        </button>
        <span>
          {page + 1} / {meta.totalPages}
        </span>
        <button
          disabled={page + 1 >= meta.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
}
